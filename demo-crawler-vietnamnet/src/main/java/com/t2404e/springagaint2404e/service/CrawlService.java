package com.t2404e.springagaint2404e.service;

import com.t2404e.springagaint2404e.entity.Article;
import com.t2404e.springagaint2404e.entity.ArticleSource;
import com.t2404e.springagaint2404e.messaging.CrawlProducer;
import com.t2404e.springagaint2404e.messaging.CrawlTask;
import com.t2404e.springagaint2404e.repository.ArticleRepository;
import com.t2404e.springagaint2404e.repository.ArticleSourceRepository;
import lombok.RequiredArgsConstructor;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;

import static com.t2404e.springagaint2404e.config.CrawlRabbitConfig.Q_CAT;

@Service
@RequiredArgsConstructor
public class CrawlService {

    private final ArticleRepository articleRepo;
    private final ArticleSourceRepository sourceRepo;
    private final CrawlProducer producer;

    // ====== PUBLIC API cho Consumer ======

    // CATEGORY: lấy link trong nav (swiper) cùng slug -> enqueue LISTING
    public void handleCategory(CrawlTask t){
        String slug = t.getSlug() != null ? t.getSlug() : slugOf(t.getUrl());
        Document doc = fetch(t.getUrl());

        Set<String> listings = new LinkedHashSet<>();

        // các sub-category trong nav bạn đã gửi
        doc.select("nav.breadcrumb__main .swiper-wrapper a[href]").forEach(a -> {
            String abs = canonical(a.absUrl("href"));
            if (!abs.isEmpty() && isSameHost(abs) && slug.equals(slugOf(abs))) listings.add(abs);
        });

        // chính trang /chinh-tri cũng là 1 listing
        listings.add(t.getUrl());

        for (String l : listings) {
            CrawlTask nx = new CrawlTask(CrawlTask.Kind.LISTING, l, slug, t.getDepth()+1, t.getSourceId());
            producer.send(nx);
        }
    }

    // LISTING: lấy link bài dạng ...-<id>.html -> enqueue ARTICLE
    // bên trong CrawlService
    public void handleListing(CrawlTask t) {
        String slug = t.getSlug() != null ? t.getSlug() : slugOf(t.getUrl());
        org.jsoup.nodes.Document doc = fetch(t.getUrl());

        java.util.Set<String> articles = new java.util.LinkedHashSet<>();
        java.util.Set<String> subListings = new java.util.LinkedHashSet<>();

        for (org.jsoup.nodes.Element a : doc.select("a[href]")) {
            String abs = canonical(a.absUrl("href"));
            if ((abs.isEmpty() || !isSameHost(abs)))
                continue;

            if(isArticle(abs))
            {
                articles.add(abs);
                continue;
            }

            if(slug.equals(slugOf(abs)))
            {
                subListings.add(abs);
            }
        }


        // 1) Đẩy các bài sang queue ARTICLE
        for (String u : articles) {
            producer.send(new CrawlTask(CrawlTask.Kind.ARTICLE, u, slug, t.getDepth() + 1, t.getSourceId()));
        }

        // 2) Đẩy các listing con (phân trang/nhánh con) để quét cạn
        for (String l : subListings) {
            if (!l.equals(t.getUrl())) {
                producer.send(new CrawlTask(CrawlTask.Kind.LISTING, l, slug, t.getDepth() + 1, t.getSourceId()));
            }
        }

        // 3) (tuỳ chọn) bắt link "next page"
        var next = doc.selectFirst("a.next, .pagination a.next, a[rel=next]");
        if (next != null) {
            String nxt = canonical(next.absUrl("href"));
            if (!nxt.isEmpty() && isSameHost(nxt) && slug.equals(slugOf(nxt))) {
                producer.send(new CrawlTask(CrawlTask.Kind.LISTING, nxt, slug, t.getDepth() + 1, t.getSourceId()));
            }
        }
    }



    // ARTICLE: parse + save + liên quan -> enqueue ARTICLE (depth <= 3)
    public void handleArticle(CrawlTask t){
        ArticleSource src = sourceRepo.findById(t.getSourceId()).orElseThrow();
        Document doc = fetch(t.getUrl());

        if (src.getRemoveSelector() != null && !src.getRemoveSelector().isBlank()) {
            doc.select(src.getRemoveSelector()).forEach(Element::remove);
        }

        Element titleEl = choose(doc, src.getTitleSelector(), "h1, .main-title, .title-detail");
        Element descEl  = choose(doc, src.getDescriptionSelector(), ".summary, .sapo, .description");
        Element contEl  = choose(doc, src.getContentSelector(), "article, .maincontent, .content-detail, .content_fck");

        String title = text(titleEl);
        String desc  = text(descEl);
        String content = contEl != null ? contEl.text() : "";

        Article a = articleRepo.findById(t.getUrl()).orElseGet(Article::new);
        a.setUrl(t.getUrl());
        a.setTitle(title);
        a.setDescription(desc);
        a.setContent(content);
        a.setCrawled(true);
        a.setStatus(1);
        // nếu entity của bạn có publishedAt thì set; nếu không, bỏ dòng này
        try { a.getClass().getMethod("setPublishedAt", LocalDateTime.class).invoke(a, LocalDateTime.now()); } catch (Exception ignore) {}
        articleRepo.save(a);

        // liên quan
        if (t.getDepth() < 3) {
            Elements rel = doc.select("article a[href], .box-relate a[href], .related a[href], .relate-list a[href]");
            String slug = t.getSlug() != null ? t.getSlug() : slugOf(t.getUrl());
            for (Element e : rel) {
                String abs = canonical(e.absUrl("href"));
                if (isArticle(abs)){
                    producer.send(new CrawlTask(CrawlTask.Kind.ARTICLE, abs, slug, t.getDepth()+1, t.getSourceId()));
                }
            }
        }
    }

    // ====== Helpers ======

    public boolean isSameHost(String url){
        try { return "vietnamnet.vn".equalsIgnoreCase(java.net.URI.create(url).getHost()); }
        catch (Exception e){ return false; }
    }

    public Document fetch(String url){
        try {
            return Jsoup.connect(url).userAgent("Mozilla/5.0").timeout(15000).get();
        } catch (Exception e) {
            throw new RuntimeException("Fetch fail: " + url, e);
        }
    }

    public Element choose(Document doc, String prefer, String fallback){
        if (prefer != null && !prefer.isBlank()) {
            Element el = doc.selectFirst(prefer);
            if (el != null) return el;
        }
        return doc.selectFirst(fallback);
    }

    public String text(Element el){ return el != null ? el.text() : ""; }

    public String canonical(String raw){
        try {
            var u = java.net.URI.create(raw);
            return new java.net.URI(u.getScheme(), u.getAuthority(), u.getPath(), null, null).toString();
        } catch(Exception e){ return ""; }
    }

    public String slugOf(String absUrl){
        try {
            var p = java.net.URI.create(absUrl).getPath();
            if (p == null) return null;
            String[] parts = java.util.Arrays.stream(p.split("/")).filter(s->!s.isBlank()).toArray(String[]::new);
            return parts.length == 0 ? null : parts[0];    // "chinh-tri"
        } catch(Exception e){ return null; }
    }

    public boolean isArticle(String url) {
        if (url == null) return false;
        // canonical() đã bỏ query/fragment rồi nên chỉ cần .html là đủ
        return url.matches("https?://[^/]+/[^\\s]+-\\d+\\.html$");
    }

    public String sha1(String s){
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] d = md.digest(s.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : d) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception ex){ return Integer.toHexString(s.hashCode()); }
    }
}
