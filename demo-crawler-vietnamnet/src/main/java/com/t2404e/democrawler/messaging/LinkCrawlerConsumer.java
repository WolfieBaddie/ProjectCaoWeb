package com.t2404e.democrawler.messaging;

import com.t2404e.democrawler.service.ContentCrawlerService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

import static com.t2404e.democrawler.config.CrawlRabbitConfig.Q_LIST;

@Component
@RequiredArgsConstructor
public class LinkCrawlerConsumer {
    private static final Logger log = LoggerFactory.getLogger(LinkCrawlerConsumer.class);

    private final StringRedisTemplate redis;
    private final ContentCrawlerService contentCrawlerService;

    // TTL cho dedupe trang listing
    private static final Duration TTL_LISTING = Duration.ofDays(1);

    @RabbitListener(queues = Q_LIST, concurrency = "3-6")
    public void onListing(CrawlMessage t) {
        if (t == null || t.getUrl() == null) return;

        String key = "dedupe:listing:" + t.getUrl();
        Boolean first = redis.opsForValue().setIfAbsent(key, "1", TTL_LISTING);

        if (Boolean.FALSE.equals(first)) {
            log.debug("Skip LISTING (duplicate): {}", t.getUrl());
            return;
        }

        try {
            // Ủy quyền business cho service: lấy link bài -> enqueue ARTICLE
            contentCrawlerService.handleListing(t);
            log.info("LISTING OK: {} (slug={}, depth={})", t.getUrl(), t.getSlug(), t.getDepth());
        } catch (Exception e) {
            log.error("LISTING error {}: {}", t.getUrl(), e.getMessage(), e);
            // Cho phép retry lần sau nếu lỗi parse/tải trang
            redis.delete(key);
        }
    }
}
