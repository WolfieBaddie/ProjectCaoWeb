package com.t2404e.democrawler.service;

import com.t2404e.democrawler.entity.Article;
import com.t2404e.democrawler.entity.ArticleCategory;
import com.t2404e.democrawler.entity.ArticleSource;
import com.t2404e.democrawler.messaging.CrawlProducer;
import com.t2404e.democrawler.messaging.CrawlTask;
import com.t2404e.democrawler.repository.ArticleRepository;
import com.t2404e.democrawler.repository.ArticleSourceRepository;
import lombok.RequiredArgsConstructor;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class CrawlService {

    private final ArticleRepository articleRepo;
    private final ArticleSourceRepository sourceRepo;
    private final CrawlProducer producer;
    private final CrawlerNetworkProfileService networkProfileService;
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
    // ARTICLE: parse + save + liên quan -> enqueue ARTICLE (depth <= 3)
    public void handleArticle(CrawlTask t){
        ArticleSource src = sourceRepo.findById(t.getSourceId()).orElseThrow();
        ArticleCategory category = src.getArticleCategory();
        Document doc = fetch(t.getUrl());

        // 1) Remove rác nếu có cấu hình
        if (src.getRemoveSelector() != null && !src.getRemoveSelector().isBlank()) {
            doc.select(src.getRemoveSelector()).forEach(Element::remove);
        }

        // 2) Lấy title / desc / content
        Element titleEl = choose(
                doc,
                src.getTitleSelector(),
                "div.content-detail h1.content-detail-title, h1, .main-title, .title-detail"
        );
        Element descEl  = choose(
                doc,
                src.getDescriptionSelector(),
                "h2.content-detail-sapo.sm-sapo-mb-0, .summary, .sapo, .description, meta[name=description], meta[property=og:description]"
        );
        Element contEl  = choose(
                doc,
                src.getContentSelector(),
                "article, .maincontent, .content-detail, .content_fck"
        );

        // 3) Lấy image element theo selector
        Element imgEl = choose(
                doc,
                src.getImageSelector(),
                "figure.image.vnn-content-image img, meta[property=og:image], article img[src]"
        );

        String title   = text(titleEl);
        String desc    = text(descEl);
        String content = contEl != null ? contEl.text() : "";
        String imageUrl = extractImageUrl(imgEl); // <- MỚI

        // 4) Upsert Article theo URL
        Article a = articleRepo.findByUrl(t.getUrl())
                .orElseGet(Article::new);
        a.setUrl(t.getUrl());
        a.setTitle(title);
        a.setDescription(desc);
        a.setContent(content);

        if (category != null) {
            a.setArticleCategory(category);
        }

        if (imageUrl != null && !imageUrl.isBlank()) {
            a.setImageUrl(imageUrl);   // <- MỚI (đổi tên setter nếu field khác)
        }

        a.setCrawled(true);
        a.setStatus(1);

        // nếu entity của bạn có publishedAt thì set; nếu không, bỏ khối try/catch này
        try {
            a.getClass()
                    .getMethod("setPublishedAt", java.time.LocalDateTime.class)
                    .invoke(a, java.time.LocalDateTime.now());
        } catch (Exception ignore) {}

        articleRepo.save(a);

        // 5) Bắt các bài liên quan nếu depth < 3
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

    private Document fetch(String url) {
        String ua = networkProfileService.nextUserAgent();
        String ip = networkProfileService.nextFakeIp();
        CrawlerNetworkProfileService.ProxyConfig proxy = networkProfileService.nextProxy();

        // Log profile được chọn cho URL này
        log.info("[PROFILE] url={} ua={} ip={} proxy={}",
                url,
                ua,
                ip,
                proxy != null ? proxy.getHost() + ":" + proxy.getPort() : "none"
        );

        int maxRetries = 3;
        IOException lastEx = null;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                log.info("[FETCH] attempt {}/{} for url={}", attempt, maxRetries, url);

                Connection conn = Jsoup.connect(url)
                        .userAgent(ua)
                        .timeout(15_000)
                        .header("X-Forwarded-For", ip)
                        .header("X-Real-IP", ip)
                        .header("Client-IP", ip)
                        .header("Accept-Language", "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7")
                        .ignoreContentType(true)
                        .ignoreHttpErrors(true);

                // Nếu có proxy cấu hình thì dùng
                if (proxy != null) {
                    conn.proxy(proxy.getHost(), proxy.getPort());

                    if (proxy.hasAuth()) {
                        String creds = proxy.getUsername() + ":" + proxy.getPassword();
                        String encoded = Base64.getEncoder()
                                .encodeToString(creds.getBytes(StandardCharsets.UTF_8));
                        conn.header("Proxy-Authorization", "Basic " + encoded);
                    }
                }

                Document doc = conn.get();

                log.info("[FETCH] SUCCESS attempt {}/{} for url={} ua={} ip={} proxy={}",
                        attempt, maxRetries, url, ua, ip,
                        proxy != null ? proxy.getHost() + ":" + proxy.getPort() : "none"
                );

                return doc;
            } catch (IOException e) {
                lastEx = e;
                log.warn("[FETCH] FAILED attempt {}/{} for url={} ua={} ip={} proxy={} - {}",
                        attempt, maxRetries, url, ua, ip,
                        proxy != null ? proxy.getHost() + ":" + proxy.getPort() : "none",
                        e.getMessage()
                );
            }
        }

        throw new RuntimeException("Fetch failed after " + maxRetries + " attempts for url=" + url, lastEx);
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

    private String extractImageUrl(Element el) {
        if (el == null) return null;

        String candidate = null;

        // TH1: thẻ <img>
        if ("img".equalsIgnoreCase(el.tagName())) {
            candidate = firstNonBlank(
                    el.absUrl("data-original"),
                    el.absUrl("data-src"),
                    el.absUrl("data-srcset"),
                    el.absUrl("src"),
                    el.attr("data-original"),
                    el.attr("src")
            );
        }
        // TH2: thẻ <meta property="og:image" ...>
        else if ("meta".equalsIgnoreCase(el.tagName())) {
            candidate = firstNonBlank(
                    el.absUrl("content"),
                    el.attr("content")
            );
        }
        // TH3: fallback cho thẻ khác (ít dùng)
        else {
            candidate = firstNonBlank(
                    el.absUrl("src"),
                    el.absUrl("data-original"),
                    el.absUrl("href")
            );
        }

        if (candidate == null || candidate.isBlank()) return null;

        // Chuẩn hoá lại URL (bỏ query/fragment nếu canonical làm chuyện đó)
        return canonical(candidate);
    }

    private String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v;
            }
        }
        return null;
    }

}
