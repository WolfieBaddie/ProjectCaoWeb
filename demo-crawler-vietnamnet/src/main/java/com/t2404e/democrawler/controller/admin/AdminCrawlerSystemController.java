package com.t2404e.democrawler.controller.admin;

import com.t2404e.democrawler.messaging.CrawlMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/api")
public class AdminCrawlerSystemController {
    private final AmqpAdmin amqpAdmin;
    private final StringRedisTemplate redis;
    private final RabbitTemplate rt;

    // ====== Chẩn đoán nhanh Rabbit/Redis & queue tồn tại không
    // GET /admin/api/diag
    @GetMapping("/diag")
    public Map<String, Object> diag() {
        Map<String, Object> m = new LinkedHashMap<>();

        try {
            rt.execute(c -> { m.put("rabbitConnected", true); return null; });
        } catch (Exception e) {
            m.put("rabbitConnected", false);
            m.put("rabbitErr", e.getMessage());
        }

        try {
            m.put("q_cat_exists",  amqpAdmin.getQueueProperties("crawl.cat") != null);
            m.put("q_list_exists", amqpAdmin.getQueueProperties("crawl.list") != null);
            m.put("q_art_exists",  amqpAdmin.getQueueProperties("crawl.article") != null);
        } catch (Exception e) {
            m.put("queueCheckErr", e.getMessage());
        }

        try {
            m.put("redisPing", redis.getConnectionFactory().getConnection().ping());
        } catch (Exception e) {
            m.put("redisErr", e.getMessage());
        }

        return m;
    }

    // ====== Publish thử trực tiếp vào exchange để kiểm tra binding
    // GET /admin/api/debug/publish-task?kind=list&href=/chinh-tri&sourceId=1&depth=0
    @GetMapping("/debug/publish-task")
    public String debugPublishTask(@RequestParam String kind,            // cat | list | article
                                   @RequestParam(required = false) String href,
                                   @RequestParam(required = false) String url,
                                   @RequestParam Long sourceId,
                                   @RequestParam(defaultValue = "0") int depth) {

        // chuẩn hoá url/slug
        String abs = (url != null && !url.isBlank())
                ? canonical(url)
                : "https://vietnamnet.vn" + (href.startsWith("/") ? href : ("/" + href));

        String slug = slugFirst(abs);

        // map kind -> routing key
        CrawlMessage.Kind k = switch (kind.toLowerCase()) {
            case "cat", "category" -> CrawlMessage.Kind.CATEGORY;
            case "list", "listing" -> CrawlMessage.Kind.LISTING;
            case "art", "article"  -> CrawlMessage.Kind.ARTICLE;
            default -> throw new IllegalArgumentException("kind must be cat|list|article");
        };

        String rk = (k == CrawlMessage.Kind.CATEGORY) ? "cat"
                : (k == CrawlMessage.Kind.LISTING) ? "list"
                : "article";

        CrawlMessage t = new CrawlMessage(k, abs, slug, depth, sourceId);
        rt.convertAndSend("crawl.ex", rk, t);  // gửi object
        return "sent " + k + " rk=" + rk + " url=" + abs + " slug=" + slug;
    }

    // ====== Helpers (copy y chang) ======
    private String canonical(String raw) {
        try {
            var u = java.net.URI.create(raw);
            return new java.net.URI(u.getScheme(), u.getAuthority(), u.getPath(), null, null).toString();
        } catch (Exception e) {
            return raw;
        }
    }

    private String slugFirst(String abs) {
        try {
            var p = java.net.URI.create(abs).getPath();
            if (p == null) return null;
            String[] parts = Arrays.stream(p.split("/"))
                    .filter(s -> !s.isBlank())
                    .toArray(String[]::new);
            return parts.length == 0 ? null : parts[0];
        } catch (Exception e) {
            return null;
        }
    }
}
