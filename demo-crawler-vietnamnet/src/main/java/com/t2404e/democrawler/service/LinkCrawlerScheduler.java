package com.t2404e.democrawler.service;

import com.t2404e.democrawler.entity.ArticleSource;
import com.t2404e.democrawler.messaging.CrawlMessage;
import com.t2404e.democrawler.messaging.LinkCrawlerConsumer;
import com.t2404e.democrawler.messaging.LinkCrawlerProducer;
import com.t2404e.democrawler.repository.ArticleSourceRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LinkCrawlerScheduler {
    private static final Logger log = LoggerFactory.getLogger(LinkCrawlerScheduler.class);
    private final CrawlerBotConfigService botConfigService;
    private final ArticleSourceRepository articleSourceRepository;
    private final LinkCrawlerProducer producer;

    @Scheduled(fixedDelay = 60 * 60 * 1000)
    public void scheduleLinkCrawl() {
        if (!botConfigService.isLinkCrawlerEnabled()) {
            log.info("LinkCrawler is disabled by config, skip run");
            return;
        }

        List<ArticleSource> activeSources = articleSourceRepository.findByStatus(1); // 1 = active
        for (ArticleSource src : activeSources) {
            String url  = src.getUrl();
            String slug = "cat-" + src.getId(); // hoặc slugOf(url)

            CrawlMessage msg = new CrawlMessage(
                    CrawlMessage.Kind.CATEGORY,
                    url,
                    slug,
                    0,
                    src.getId()
            );
            producer.send(msg);
        }
    }
}
