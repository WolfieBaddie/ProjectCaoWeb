// src/main/java/com/t2404e/democrawler/service/CrawlerAdminSourceService.java
package com.t2404e.democrawler.service;

import com.t2404e.democrawler.entity.ArticleCategory;
import com.t2404e.democrawler.entity.ArticleSource;
import com.t2404e.democrawler.messaging.CrawlMessage;
import com.t2404e.democrawler.messaging.LinkCrawlerProducer;
import com.t2404e.democrawler.repository.ArticleCategoryRepository;
import com.t2404e.democrawler.repository.ArticleSourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CrawlerAdminSourceService {

    private final ArticleSourceRepository articleSourceRepository;
    private final LinkCrawlerProducer producer;   // <-- dùng lại producer đang bắn LISTING/ARTICLE

    /**
     * Admin trigger seedListing cho 1 nguồn:
     * - Từ 1 ArticleSource -> find các ArticleCategory của source đó
     * - Với mỗi category (vd /chinh-tri) -> gửi 1 message CATEGORY.
     */
    @Transactional(readOnly = true)
    public void triggerSeedListingForSource(Long sourceId) {
        ArticleSource source = articleSourceRepository.findById(sourceId)
                .orElseThrow(() -> new IllegalArgumentException("ArticleSource not found: " + sourceId));

        // Tùy mapping: nếu ArticleCategory có field articleSource
        // thì nên dùng findByArticleSource_Id(sourceId)
        ArticleCategory cat = source.getArticleCategory();
        if (cat == null) {
            log.warn("[ADMIN] triggerSeedListingForSource: source {} has no category set", sourceId);
            return;
        }

            if (cat.getId() == null || cat.getName() == null) {
                log.warn("[ADMIN] Skip category {} of source {} because url/slug is null",
                        cat.getId(), sourceId);
            }

            // Tạo message CATEGORY:
            // url = link gốc (vd https://vietnamnet.vn/chinh-tri)
            // slug = slug category (vd "chinh-tri")
            // depth = 0 (root)
            CrawlMessage msg = new CrawlMessage(
                    CrawlMessage.Kind.CATEGORY,
                    "https://vietnamnet.vn/" + cat.getName(),
                    cat.getName(),
                    0,
                    sourceId
            );

            log.info("[ADMIN] Enqueue CATEGORY seed: sourceId={} catId={} slug={} url={}",
                    sourceId, cat.getId(), cat.getName(), "https://vietnamnet.vn/" + cat.getName());

            producer.send(msg); // dùng LinkCrawlerProducer như trong ContentCrawlerService

    }
}
