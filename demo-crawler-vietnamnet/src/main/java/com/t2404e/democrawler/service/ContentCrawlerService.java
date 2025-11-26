package com.t2404e.democrawler.service;

import com.t2404e.democrawler.common.ArticleStatus;
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
    private final CrawlerLogService crawlerLogService;
    private final CrawlerBotConfigService botConfigService;
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
            if (!botConfigService.isLinkCrawlerEnabled()) {
                log.info(
                        "LinkCrawler disabled trong khi handleCategory, dừng enqueue LISTING. slug={} sourceId={}",
                        slug, t.getSourceId()
                );
                break; // thoát vòng for, không đẩy thêm LISTING nữa
            }

            CrawlMessage nx = new CrawlMessage(CrawlMessage.Kind.LISTING, l, slug, t.getDepth()+1, t.getSourceId());
            producer.send(nx);
        }
    }

    // LISTING: lấy link bài dạng ...-<id>.html -> enqueue ARTICLE
    // bên trong CrawlService
    public void handleListing(CrawlMessage t) {
        String slug = t.getSlug() != null ? t.getSlug() : crawlHelper.slugOf(t.getUrl());
        Long categoryId = null;
       try
       {
           if (t.getSourceId() != null) {
               ArticleSource src = sourceRepo.findById(t.getSourceId()).orElse(null);
               if (src != null && src.getArticleCategory() != null) {
                   categoryId = src.getArticleCategory().getId();
               }
           }
           Document doc = crawlHelper.fetch(t.getUrl());

           Set<String> articles = new LinkedHashSet<>();
           Set<String> subListings = new LinkedHashSet<>();

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


           // Bước 1: gom hết URL article vào Set
           for (Element a : doc.select("a[href]")) {
               String abs = crawlHelper.canonical(a.absUrl("href"));
               if (abs.isEmpty() || !crawlHelper.isSameHost(abs)) continue;

               if (crawlHelper.isArticle(abs)) {
                   articles.add(abs);
                   continue;
               }

               if (slug.equals(crawlHelper.slugOf(abs))) {
                   subListings.add(abs);
               }
           }

            // Bước 2: hỏi DB một lần: trong đống này, URL nào đã tồn tại?
           Set<String> existing = new HashSet<>(
                   articleRepo.findAllUrlByUrlIn(articles)  // custom query
           );


           // 1) Đẩy các bài sang queue ARTICLE
           for (String u : articles) {
               if (!botConfigService.isLinkCrawlerEnabled()) {
                   log.info(
                           "LinkCrawler disabled trong khi handleCategory, dừng enqueue LISTING. slug={} sourceId={}",
                           slug, t.getSourceId()
                   );
                   break; // thoát vòng for, không đẩy thêm LISTING nữa
               }

               if (existing.contains(u)) {
                   continue;
               }
               producer.send(new CrawlMessage(
                       CrawlMessage.Kind.ARTICLE,
                       u,
                       slug,
                       t.getDepth() + 1,
                       t.getSourceId()
               ));
           }

           // 2) Đẩy các listing con (phân trang/nhánh con) để quét cạn
           for (String l : subListings) {
               if (!botConfigService.isLinkCrawlerEnabled()) {
                   log.info(
                           "LinkCrawler disabled trong khi handleCategory, dừng enqueue LISTING. slug={} sourceId={}",
                           slug, t.getSourceId()
                   );
                   break; // thoát vòng for, không đẩy thêm LISTING nữa
               }

               if (!l.equals(t.getUrl())) {
                   producer.send(new CrawlMessage(CrawlMessage.Kind.LISTING, l, slug, t.getDepth() + 1, t.getSourceId()));
               }
           }

           // 3) (tuỳ chọn) bắt link "next page"
           if (botConfigService.isLinkCrawlerEnabled()) {
               var next = doc.selectFirst("a.next, .pagination a.next, a[rel=next]");
               if (next != null) {
                   String nxt = crawlHelper.canonical(next.absUrl("href"));
                   if (!nxt.isEmpty()
                           && crawlHelper.isSameHost(nxt)
                           && slug.equals(crawlHelper.slugOf(nxt))) {
                       producer.send(new CrawlMessage(
                               CrawlMessage.Kind.LISTING,
                               nxt,
                               slug,
                               t.getDepth() + 1,
                               t.getSourceId()
                       ));
                   }
               }
           }

           crawlerLogService.infoLink(
                   "LISTING OK url=" + t.getUrl(),
                   t.getUrl(),
                   categoryId
           );
       }catch(Exception ex)
       {
           crawlerLogService.errorLink(
                   "LISTING ERROR: url=" + t.getUrl() + " msg=" + ex.getMessage(),
                   t.getUrl(),
                   t.getSourceId(),
                   categoryId,
                   ex
           );
           throw ex;
       }
    }

    // ARTICLE: parse + save + liên quan -> enqueue ARTICLE (depth <= 3)
    public void handleArticle(CrawlMessage t){
        ArticleSource src = sourceRepo.findById(t.getSourceId()).orElseThrow();
        ArticleCategory category = src.getArticleCategory();
        try
        {
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
            a.setStatus(ArticleStatus.DRAFT);

            // Lấy text thời gian từ selector trong ArticleSource (VD: "div.bread-crumb-detail__time")
            String timeText = crawlHelper.text(doc.selectFirst(src.getTimeSelector()));

            // Parse về LocalDateTime và set vào Article
            a.setCreated_at(crawlHelper.parseVietnamnetTime(timeText));

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

            Article saved = articleRepo.save(a);

            Long categoryId = null;
            if (saved.getArticleCategory() != null) {
                categoryId = saved.getArticleCategory().getId();
            }

            // log OK

            crawlerLogService.infoContent(
                    "ARTICLE OK",
                    t.getUrl(),
                    src.getId(),
                    saved.getId(),
                    categoryId
            );

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

        }catch(Exception ex)
        {
            Long categoryId = null;
            Article saved = null;
            try {
                Optional<Article> opt = articleRepo.findByUrl(t.getUrl());
                if (opt.isPresent()) {
                    saved = opt.get();
                    if (saved.getArticleCategory() != null) {
                        categoryId = saved.getArticleCategory().getId();
                    }
                }
            } catch (Exception ignore) {}

            crawlerLogService.errorContent(
                    "ARTICLE ERROR: " + t.getUrl() + " - " + ex.getMessage(),
                    t.getUrl(),
                    src.getId(),
                    categoryId,
                    (saved != null ? saved.getId() : null),
                    ex
            );
        }
    }



}
