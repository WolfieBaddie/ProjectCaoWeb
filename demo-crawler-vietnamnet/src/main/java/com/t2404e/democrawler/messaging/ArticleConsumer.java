package com.t2404e.democrawler.messaging;

import com.t2404e.democrawler.config.CrawlRabbitConfig;
import com.t2404e.democrawler.service.CrawlService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;

@Component
@RequiredArgsConstructor
public class ArticleConsumer {
    private static final Logger log = LoggerFactory.getLogger(ArticleConsumer.class);

    private final StringRedisTemplate redis;
    private final CrawlService crawlService;

    // Giới hạn độ sâu mở rộng liên quan (có thể chỉnh)
    private static final int MAX_DEPTH = 3;

    // TTL cho dedupe bài viết
    private static final Duration TTL_ARTICLE = java.time.Duration.ofDays(7);

    @RabbitListener(queues = CrawlRabbitConfig.Q_ART, concurrency = "2-6")
    public void onArticle(CrawlTask t) {
        if (t == null || t.getUrl() == null) return;

        // Chặn nới rộng quá sâu
        if (t.getDepth() > MAX_DEPTH) {
            log.debug("Skip ARTICLE (depth limit={}): {}", t.getDepth(), t.getUrl());
            return;
        }

        String key = "dedupe:article:" + t.getSourceId() + ":" + crawlService.sha1(t.getUrl());
        Boolean first = redis.opsForValue().setIfAbsent(key, "1", java.time.Duration.ofDays(7));
        log.info("ARTICLE key={} first={} url={}", key, first, t.getUrl());

        if (Boolean.FALSE.equals(first)) {
            log.debug("Skip ARTICLE (duplicate): {}", t.getUrl());
            return;
        }

        try {
            // Ủy quyền business cho service: parse + save + enqueue liên quan (nếu depth còn)
            crawlService.handleArticle(t);
            log.info("ARTICLE OK: {} (slug={}, depth={})", t.getUrl(), t.getSlug(), t.getDepth());
        } catch (Exception e) {
            log.error("ARTICLE error {}: {}", t.getUrl(), e.getMessage(), e);
            // Cho phép retry nếu lỗi
            redis.delete(key);
        }
    }

    private String sha1(String s) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] d = md.digest(s.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : d) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception ex) {
            return Integer.toHexString(s.hashCode());
        }
    }
}
