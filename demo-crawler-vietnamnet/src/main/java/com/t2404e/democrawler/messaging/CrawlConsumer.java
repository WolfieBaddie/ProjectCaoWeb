package com.t2404e.democrawler.messaging;

import com.t2404e.democrawler.service.ContentCrawlerService;
import com.t2404e.democrawler.service.CrawlerBotConfigService;
import com.t2404e.democrawler.util.CrawlHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

import static com.t2404e.democrawler.config.CrawlRabbitConfig.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class CrawlConsumer {

    private final StringRedisTemplate redis;
    private final CrawlHelper crawlHelper;
    private final ContentCrawlerService contentCrawlerService;
    private final CrawlerBotConfigService botConfigService; // <-- đấu thêm service config

    // ==========================
    // CATEGORY (LinkCrawlerBot)
    // ==========================
    @RabbitListener(queues = Q_CAT, concurrency = "2-4")
    public void onCategory(CrawlMessage t) {

        // 1) Check công tắc global LinkCrawler
        if (!botConfigService.isLinkCrawlerEnabled()) {
            log.info("LinkCrawler is DISABLED by config, skip CATEGORY url={}", t.getUrl());
            return;
        }

        // 2) Dedupe + handle như cũ
        String slug = (t.getSlug() != null) ? t.getSlug() : crawlHelper.slugOf(t.getUrl());
        String key = (slug != null)
                ? "dedupe:cat:" + t.getSourceId() + ":" + slug
                : "dedupe:cat:" + t.getSourceId() + ":url:" + crawlHelper.sha1(crawlHelper.canonical(t.getUrl()));

        Boolean first = redis.opsForValue().setIfAbsent(key, "1", Duration.ofHours(1)); // dev: 1h
        log.info("CAT  key={} first={} slug={} url={}", key, first, slug, t.getUrl());
        if (Boolean.FALSE.equals(first)) return;

        contentCrawlerService.handleCategory(t);
    }

    // ==========================
    // LISTING (LinkCrawlerBot)
    // ==========================
    @RabbitListener(queues = Q_LIST, concurrency = "2-4")
    public void onListing(CrawlMessage t) {

        // 1) Check công tắc global LinkCrawler
        if (!botConfigService.isLinkCrawlerEnabled()) {
            log.info("LinkCrawler is DISABLED by config, skip LISTING url={}", t.getUrl());
            return;
        }

        String slug = (t.getSlug() != null) ? t.getSlug() : crawlHelper.slugOf(t.getUrl());

        // DEDUPE THEO URL, KHÔNG THEO SLUG NỮA
        String urlKey = crawlHelper.canonical(t.getUrl()); // bỏ query, anchor
        String key = "dedupe:list:" + t.getSourceId() + ":" + crawlHelper.sha1(urlKey);

        Boolean first = redis.opsForValue().setIfAbsent(key, "1",Duration.ofMinutes(1));
        log.info("LIST key={} first={} slug={} url={}", key, first, slug, t.getUrl());
        if (Boolean.FALSE.equals(first)) return;

        contentCrawlerService.handleListing(t);
    }


    // ==========================
    // ARTICLE (ContentCrawlerBot)
    // ==========================
    @RabbitListener(queues = Q_ART, concurrency = "2-6") // giảm để thấy log
    public void onArticle(CrawlMessage t){

        // 1) Check công tắc global ContentCrawler
        if (!botConfigService.isContentCrawlerEnabled()) {
            log.info("ContentCrawler is DISABLED by config, skip ARTICLE url={}", t.getUrl());
            return;
        }

        // 2) Dedupe + handle như cũ
        String urlKey = crawlHelper.canonical(t.getUrl()); // đề phòng có query, anchor
        String key = "dedupe:article:" + t.getSourceId() + ":" + crawlHelper.sha1(urlKey);

        Boolean first = redis.opsForValue().setIfAbsent(key, "1", Duration.ofMinutes(1));
        log.info("ART  key={} first={} url={}", key, first, urlKey);
        if (Boolean.FALSE.equals(first)) return;

        contentCrawlerService.handleArticle(t);
    }
}
