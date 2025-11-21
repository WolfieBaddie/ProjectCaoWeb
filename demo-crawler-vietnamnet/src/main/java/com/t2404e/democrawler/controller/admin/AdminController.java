package com.t2404e.democrawler.controller.admin;

import com.t2404e.democrawler.dto.ArticleSourceForm;
import com.t2404e.democrawler.entity.ArticleSource;
import com.t2404e.democrawler.messaging.LinkCrawlerProducer;
import com.t2404e.democrawler.messaging.CrawlMessage;
import com.t2404e.democrawler.repository.ArticleCategoryRepository;
import com.t2404e.democrawler.repository.ArticleSourceRepository;
import com.t2404e.democrawler.service.ArticleSourceService;
import com.t2404e.democrawler.service.CrawlerNetworkProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/api")
public class AdminController {

    private final LinkCrawlerProducer producer;
    private final AmqpAdmin amqpAdmin;
    private final StringRedisTemplate redis;
    private final RabbitTemplate rt;
    private final ArticleSourceRepository articleSourceRepository;
    private final ArticleCategoryRepository articleCategoryRepository;
    private final ArticleSourceService  articleSourceService;
    private final CrawlerNetworkProfileService crawlerNetworkProfileService;

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

        producer.send(new CrawlMessage(CrawlMessage.Kind.CATEGORY, url, slug, 0, sourceId));
        return "queued CATEGORY: slug=" + slug + ", url=" + url + ", force=" + force;
    }


    @PostMapping("/seed-article-source")
    public String seedArticleSource(@RequestBody @Valid ArticleSourceForm form) {

        // 1) Lưu / cập nhật ArticleSource trong DB
        ArticleSource saved = articleSourceService.seedArticleSource(form);
        return "Seed article source: " + saved.getTitle();
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
        producer.send(new CrawlMessage(CrawlMessage.Kind.LISTING, url, slug, depth, sourceId));
        return "queued LISTING: slug=" + slug + ", url=" + url + ", depth=" + depth;
    }

    //Api chỉnh sửa trạng thái nguồn crawler
    @PatchMapping("/sources/{id}/status")
    public void updateSourceStatus(@PathVariable Long id,
                                   @RequestParam("enabled") boolean enabled) {
        ArticleSource src = articleSourceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Not found ArticleSource id=" + id));

        src.setStatus(enabled ? 1 : 0);
        articleSourceRepository.save(src);
    }


    // ====== Đẩy 1 bài viết cụ thể để smoke-test ARTICLE
    // GET /sys/rabbit/ping?url=https://vietnamnet.vn/...-2462040.html&sourceId=1
    @GetMapping("/rabbit/ping")
    public String pingOneArticle(@RequestParam String url,
                                 @RequestParam Long sourceId,
                                 @RequestParam(defaultValue = "0") int depth) {
        String abs = url.startsWith("http") ? canonical(url) : "https://vietnamnet.vn" + url;
        String slug = slugFirst(abs);
        producer.send(new CrawlMessage(CrawlMessage.Kind.ARTICLE, abs, slug, depth, sourceId));
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
        CrawlMessage.Kind k = switch (kind.toLowerCase()) {
            case "cat", "category"    -> CrawlMessage.Kind.CATEGORY;
            case "list", "listing"    -> CrawlMessage.Kind.LISTING;
            case "art", "article"     -> CrawlMessage.Kind.ARTICLE;
            default -> throw new IllegalArgumentException("kind must be cat|list|article");
        };
        String rk = (k == CrawlMessage.Kind.CATEGORY) ? "cat" :
                (k == CrawlMessage.Kind.LISTING)  ? "list" : "article";

        CrawlMessage t = new CrawlMessage(k, abs, slug, depth, sourceId);
        rt.convertAndSend("crawl.ex", rk, t);  // <-- gửi object, không gửi String
        return "sent " + k + " rk=" + rk + " url=" + abs + " slug=" + slug;
    }

    @PostMapping("/network/user-agents")
    public String overwriteUserAgents(@RequestBody List<String> userAgents) {
        crawlerNetworkProfileService.overwriteUserAgents(userAgents);
        return "OK - overwrote user agents, size=" + userAgents.size();
    }

    @PostMapping("/network/fake-ips")
    public String overwriteFakeIps(@RequestBody List<String> fakeIps) {
        crawlerNetworkProfileService.overwriteFakeIps(fakeIps);
        return "OK - overwrote fake IPs, size=" + fakeIps.size();
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
