package com.t2404e.democrawler.service;

import com.t2404e.democrawler.dto.ImageInfo;
import com.t2404e.democrawler.entity.Article;
import com.t2404e.democrawler.entity.ArticleCategory;
import com.t2404e.democrawler.entity.ArticleImage;
import com.t2404e.democrawler.entity.ArticleSource;
import com.t2404e.democrawler.messaging.LinkCrawlerProducer;
import com.t2404e.democrawler.messaging.CrawlMessage;
import com.t2404e.democrawler.repository.ArticleRepository;
import com.t2404e.democrawler.repository.ArticleSourceRepository;
import com.t2404e.democrawler.util.CrawlHelper;
import lombok.RequiredArgsConstructor;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.util.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContentCrawlerService {

    private final ArticleRepository articleRepo;
    private final ArticleSourceRepository sourceRepo;
    private final LinkCrawlerProducer producer;
    private final CrawlHelper crawlHelper;
    // ====== PUBLIC API cho Consumer ======

    // CATEGORY: lấy link trong nav (swiper) cùng slug -> enqueue LISTING
    public void handleCategory(CrawlMessage t){
        String slug = t.getSlug() != null ? t.getSlug() : crawlHelper.slugOf(t.getUrl());
        Document doc = crawlHelper.fetch(t.getUrl());

        Set<String> listings = new LinkedHashSet<>();

        // các sub-category trong nav bạn đã gửi
        doc.select("nav.breadcrumb__main .swiper-wrapper a[href]").forEach(a -> {
            String abs = crawlHelper.canonical(a.absUrl("href"));
            if (!abs.isEmpty() && crawlHelper.isSameHost(abs) && slug.equals(crawlHelper.slugOf(abs))) listings.add(abs);
        });

        // chính trang /chinh-tri cũng là 1 listing
        listings.add(t.getUrl());

        for (String l : listings) {
            CrawlMessage nx = new CrawlMessage(CrawlMessage.Kind.LISTING, l, slug, t.getDepth()+1, t.getSourceId());
            producer.send(nx);
        }
    }

    // LISTING: lấy link bài dạng ...-<id>.html -> enqueue ARTICLE
    // bên trong CrawlService
    public void handleListing(CrawlMessage t) {
        String slug = t.getSlug() != null ? t.getSlug() : crawlHelper.slugOf(t.getUrl());
        org.jsoup.nodes.Document doc = crawlHelper.fetch(t.getUrl());

        java.util.Set<String> articles = new java.util.LinkedHashSet<>();
        java.util.Set<String> subListings = new java.util.LinkedHashSet<>();

        for (org.jsoup.nodes.Element a : doc.select("a[href]")) {
            String abs = crawlHelper.canonical(a.absUrl("href"));
            if ((abs.isEmpty() || !crawlHelper.isSameHost(abs)))
                continue;

            if(crawlHelper.isArticle(abs))
            {
                articles.add(abs);
                continue;
            }

            if(slug.equals(crawlHelper.slugOf(abs)))
            {
                subListings.add(abs);
            }
        }


        // 1) Đẩy các bài sang queue ARTICLE
        for (String u : articles) {
            producer.send(new CrawlMessage(CrawlMessage.Kind.ARTICLE, u, slug, t.getDepth() + 1, t.getSourceId()));
        }

        // 2) Đẩy các listing con (phân trang/nhánh con) để quét cạn
        for (String l : subListings) {
            if (!l.equals(t.getUrl())) {
                producer.send(new CrawlMessage(CrawlMessage.Kind.LISTING, l, slug, t.getDepth() + 1, t.getSourceId()));
            }
        }

        // 3) (tuỳ chọn) bắt link "next page"
        var next = doc.selectFirst("a.next, .pagination a.next, a[rel=next]");
        if (next != null) {
            String nxt = crawlHelper.canonical(next.absUrl("href"));
            if (!nxt.isEmpty() && crawlHelper.isSameHost(nxt) && slug.equals(crawlHelper.slugOf(nxt))) {
                producer.send(new CrawlMessage(CrawlMessage.Kind.LISTING, nxt, slug, t.getDepth() + 1, t.getSourceId()));
            }
        }
    }

    // ARTICLE: parse + save + liên quan -> enqueue ARTICLE (depth <= 3)
    // ARTICLE: parse + save + liên quan -> enqueue ARTICLE (depth <= 3)
    public void handleArticle(CrawlMessage t){
        ArticleSource src = sourceRepo.findById(t.getSourceId()).orElseThrow();
        ArticleCategory category = src.getArticleCategory();
        Document doc = crawlHelper.fetch(t.getUrl());

        // 1) Remove rác nếu có cấu hình
        if (src.getRemoveSelector() != null && !src.getRemoveSelector().isBlank()) {
            doc.select(src.getRemoveSelector()).forEach(Element::remove);
        }

        // 2) Lấy title / desc / content
        Element titleEl = crawlHelper.choose(
                doc,
                src.getTitleSelector(),
                "div.content-detail h1.content-detail-title, h1, .main-title, .title-detail"
        );
        Element descEl  = crawlHelper.choose(
                doc,
                src.getDescriptionSelector(),
                "h2.content-detail-sapo.sm-sapo-mb-0, .summary, .sapo, .description, meta[name=description], meta[property=og:description]"
        );
        Element contEl  = crawlHelper.choose(
                doc,
                src.getContentSelector(),
                "article, .maincontent, .content-detail, .content_fck"
        );

        // 3) Lấy image element theo selector
        Element imgEl = crawlHelper.choose(
                doc,
                src.getImageSelector(),
                "figure.image.vnn-content-image img, meta[property=og:image], article img[src]"
        );

        String title   = crawlHelper.text(titleEl);
        String desc    = crawlHelper.text(descEl);
        String content = contEl != null ? contEl.text() : "";

        // 5) Lấy danh sách ảnh trong bài
        List<ImageInfo> images = crawlHelper.extractImages(doc, src.getImageSelector());
        String mainImageUrl = null;
        if (!images.isEmpty()) {
            mainImageUrl = images.get(0).getUrl();  // lấy ảnh đầu làm ảnh chính
        }

        // 4) Upsert Article theo URL
        Article a = articleRepo.findByUrl(t.getUrl())
                .orElseGet(Article::new);
        a.setUrl(t.getUrl());
        a.setTitle(title);
        a.setDescription(desc);
        a.setContent(content);

        if (mainImageUrl != null && !mainImageUrl.isBlank()) {
            a.setImageUrl(mainImageUrl);
        }

        if (category != null) {
            a.setArticleCategory(category);
        }

        a.setCrawled(true);
        a.setStatus(1);

        a.getImages().clear();

        // 7) Map ImageInfo -> ArticleImage và add vào article
        int sortOrder = 0;
        for (ImageInfo info : images) {
            ArticleImage ai = ArticleImage.builder()
                    .article(a)
                    .url(info.getUrl())
                    .alt(info.getAlt())
                    .caption(info.getCaption())
                    .thumbSmall(info.getThumbSmall())
                    .thumb(info.getThumb())
                    .sortOrder(sortOrder++)
                    .build();
            a.getImages().add(ai);
        }

        articleRepo.save(a);

        try {
            a.getClass()
                    .getMethod("setPublishedAt", java.time.LocalDateTime.class)
                    .invoke(a, java.time.LocalDateTime.now());
        } catch (Exception ignore) {}

        articleRepo.save(a);

        // 5) Bắt các bài liên quan nếu depth < 3
        if (t.getDepth() < 3) {
            Elements rel = doc.select("article a[href], .box-relate a[href], .related a[href], .relate-list a[href]");
            String slug = t.getSlug() != null ? t.getSlug() : crawlHelper.slugOf(t.getUrl());
            for (Element e : rel) {
                String abs = crawlHelper.canonical(e.absUrl("href"));
                if (crawlHelper.isArticle(abs)){
                    producer.send(new CrawlMessage(CrawlMessage.Kind.ARTICLE, abs, slug, t.getDepth()+1, t.getSourceId()));
                }
            }
        }
    }



}
