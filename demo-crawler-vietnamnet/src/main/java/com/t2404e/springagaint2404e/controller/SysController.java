package com.t2404e.springagaint2404e.controller;

import com.t2404e.springagaint2404e.messaging.CrawlProducer;
import com.t2404e.springagaint2404e.messaging.CrawlTask;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/sys")
public class SysController {

    private final CrawlProducer producer;
    private final AmqpAdmin amqpAdmin;
    private final StringRedisTemplate redis;
    private final RabbitTemplate rt;

    // ====== Seed theo category (href kiểu /chinh-tri). Thêm force để chạy lại.
    // GET /sys/seed-category?href=/chinh-tri&sourceId=1[&force=true]
    @GetMapping("/seed-category")
    public String seedCategory(@RequestParam String href,
                               @RequestParam Long sourceId,
                               @RequestParam(defaultValue = "false") boolean force) {
        String url = href.startsWith("http") ? canonical(href) : "https://vietnamnet.vn" + href;
        String slug = slugFirst(url);

        // dedupe theo sourceId + sluggit init
        String key = "dedupe:cat:" + sourceId + ":" + slug;
        if (force) redis.delete(key);

        producer.send(new CrawlTask(CrawlTask.Kind.CATEGORY, url, slug, 0, sourceId));
        return "queued CATEGORY: slug=" + slug + ", url=" + url + ", force=" + force;
    }

    // ====== Seed 1 LISTING cụ thể (ví dụ /chinh-tri/su-kien)
    // GET /sys/seed-listing?href=/chinh-tri/su-kien&sourceId=1
    @GetMapping("/seed-listing")
    public String seedListing(@RequestParam String href,
                              @RequestParam Long sourceId,
                              @RequestParam(defaultValue = "0") int depth) {
        // FIX: luôn có đúng 1 dấu "/" sau host
        String url = href.startsWith("http")
                ? canonical(href)
                : "https://vietnamnet.vn" + (href.startsWith("/") ? href : "/" + href);

        String slug = slugFirst(url);
        producer.send(new CrawlTask(CrawlTask.Kind.LISTING, url, slug, depth, sourceId));
        return "queued LISTING: slug=" + slug + ", url=" + url + ", depth=" + depth;
    }

    // ====== Đẩy 1 bài viết cụ thể để smoke-test ARTICLE
    // GET /sys/rabbit/ping?url=https://vietnamnet.vn/...-2462040.html&sourceId=1
    @GetMapping("/rabbit/ping")
    public String pingOneArticle(@RequestParam String url,
                                 @RequestParam Long sourceId,
                                 @RequestParam(defaultValue = "0") int depth) {
        String abs = url.startsWith("http") ? canonical(url) : "https://vietnamnet.vn" + url;
        String slug = slugFirst(abs);
        producer.send(new CrawlTask(CrawlTask.Kind.ARTICLE, abs, slug, depth, sourceId));
        return "queued ARTICLE: slug=" + slug + ", url=" + abs + ", depth=" + depth;
    }

    // ====== Chẩn đoán nhanh Rabbit/Redis & queue tồn tại không
    // GET /sys/diag
    @GetMapping("/diag")
    public Map<String, Object> diag() {
        Map<String, Object> m = new LinkedHashMap<>();
        try { rt.execute(c -> { m.put("rabbitConnected", true); return null; }); }
        catch (Exception e){ m.put("rabbitConnected", false); m.put("rabbitErr", e.getMessage()); }

        try {
            m.put("q_cat_exists",  amqpAdmin.getQueueProperties("crawl.cat") != null);
            m.put("q_list_exists", amqpAdmin.getQueueProperties("crawl.list") != null);
            m.put("q_art_exists",  amqpAdmin.getQueueProperties("crawl.article") != null);
        } catch (Exception e) { m.put("queueCheckErr", e.getMessage()); }

        try { m.put("redisPing", redis.getConnectionFactory().getConnection().ping()); }
        catch (Exception e){ m.put("redisErr", e.getMessage()); }

        return m;
    }

    // ====== Publish thử trực tiếp vào exchange để kiểm tra binding
    @GetMapping("/debug/publish-task")
    public String debugPublishTask(@RequestParam String kind,            // cat | list | article
                                   @RequestParam(required=false) String href, // ví dụ /chinh-tri
                                   @RequestParam(required=false) String url,  // ví dụ https://vietnamnet.vn/...-2462040.html
                                   @RequestParam Long sourceId,
                                   @RequestParam(defaultValue="0") int depth) {
        // chuẩn hoá url/slug
        String abs = (url != null && !url.isBlank())
                ? canonical(url)
                : ("https://vietnamnet.vn" + (href.startsWith("/") ? href : ("/" + href)));
        String slug = slugFirst(abs);

        // map kind -> routing key
        CrawlTask.Kind k = switch (kind.toLowerCase()) {
            case "cat", "category"    -> CrawlTask.Kind.CATEGORY;
            case "list", "listing"    -> CrawlTask.Kind.LISTING;
            case "art", "article"     -> CrawlTask.Kind.ARTICLE;
            default -> throw new IllegalArgumentException("kind must be cat|list|article");
        };
        String rk = (k == CrawlTask.Kind.CATEGORY) ? "cat" :
                (k == CrawlTask.Kind.LISTING)  ? "list" : "article";

        CrawlTask t = new CrawlTask(k, abs, slug, depth, sourceId);
        rt.convertAndSend("crawl.ex", rk, t);  // <-- gửi object, không gửi String
        return "sent " + k + " rk=" + rk + " url=" + abs + " slug=" + slug;
    }

    // ====== Helpers ======
    private String canonical(String raw){
        try {
            var u = java.net.URI.create(raw);
            return new java.net.URI(u.getScheme(), u.getAuthority(), u.getPath(), null, null).toString();
        } catch (Exception e){ return raw; }
    }

    private String slugFirst(String abs){
        try {
            var p = java.net.URI.create(abs).getPath();
            if (p == null) return null;
            String[] parts = Arrays.stream(p.split("/"))
                    .filter(s -> !s.isBlank()).toArray(String[]::new);
            return parts.length == 0 ? null : parts[0];
        } catch (Exception e){ return null; }
    }
}
