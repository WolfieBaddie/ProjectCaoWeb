package com.t2404e.democrawler.messaging;

import com.t2404e.democrawler.service.ContentCrawlerService;
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

    @RabbitListener(queues = Q_CAT, concurrency = "2-4")
    public void onCategory(CrawlMessage t){
        String slug = t.getSlug() != null ? t.getSlug() : crawlHelper.slugOf(t.getUrl());
        String key = (slug != null)
                ? "dedupe:cat:" + t.getSourceId() + ":" + slug
                : "dedupe:cat:" + t.getSourceId() + ":url:" + crawlHelper.sha1(crawlHelper.canonical(t.getUrl()));

        Boolean first = redis.opsForValue().setIfAbsent(key, "1", Duration.ofHours(1)); // dev: 1h
        log.info("CAT  key={} first={} slug={} url={}", key, first, slug, t.getUrl());
        if (Boolean.FALSE.equals(first)) return;

        contentCrawlerService.handleCategory(t);
    }

    @RabbitListener(queues = Q_LIST, concurrency = "2-4") // giảm concurrency để debug cho dễ
    public void onListing(CrawlMessage t){
        String urlKey = crawlHelper.canonical(t.getUrl()); // luôn canonical để key ổn định
        String key = "dedupe:listing:" + t.getSourceId() + ":" + crawlHelper.sha1(urlKey);

        Boolean first = redis.opsForValue().setIfAbsent(key, "1", Duration.ofSeconds(60));
        log.info("LIST key={} first={} url={}", key, first, urlKey);
        if (Boolean.FALSE.equals(first)) return;

        contentCrawlerService.handleListing(t);
    }

    @RabbitListener(queues = Q_ART, concurrency = "2-6") // giảm để thấy log
    public void onArticle(CrawlMessage t){
        String urlKey = crawlHelper.canonical(t.getUrl()); // đề phòng có query, anchor
        String key = "dedupe:article:" + t.getSourceId() + ":" + crawlHelper.sha1(urlKey);

        Boolean first = redis.opsForValue().setIfAbsent(key, "1", Duration.ofDays(7));
        log.info("ART  key={} first={} url={}", key, first, urlKey);
        if (Boolean.FALSE.equals(first)) return;

        contentCrawlerService.handleArticle(t);
    }
}
