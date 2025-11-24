package com.t2404e.democrawler.controller.admin;
import com.t2404e.democrawler.dto.ArticleSourceForm;
import com.t2404e.democrawler.entity.ArticleSource;
import com.t2404e.democrawler.messaging.CrawlMessage;
import com.t2404e.democrawler.messaging.LinkCrawlerProducer;
import com.t2404e.democrawler.repository.ArticleSourceRepository;
import com.t2404e.democrawler.service.ArticleSourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/api")
public class AdminArticleSourceController {
    private final LinkCrawlerProducer producer;
    private final StringRedisTemplate redis;
    private final ArticleSourceRepository articleSourceRepository;
    private final ArticleSourceService articleSourceService;

    // ====== Seed theo category (href kiểu /chinh-tri). Thêm force để chạy lại.
    // GET /admin/api/seed-category?href=/chinh-tri&sourceId=1[&force=true]
    @GetMapping("/seed-category")
    public String seedCategory(@RequestParam String href,
                               @RequestParam Long sourceId,
                               @RequestParam(defaultValue = "false") boolean force) {

        String url = href.startsWith("http") ? canonical(href) : "https://vietnamnet.vn" + href;
        String slug = slugFirst(url);

        // dedupe theo sourceId + slug
        String key = "dedupe:cat:" + sourceId + ":" + slug;
        if (force) {
            redis.delete(key);
        }

        producer.send(new CrawlMessage(CrawlMessage.Kind.CATEGORY, url, slug, 0, sourceId));
        return "queued CATEGORY: slug=" + slug + ", url=" + url + ", force=" + force;
    }

    // Seed / upsert ArticleSource trong DB
    // POST /admin/api/seed-article-source
    @PostMapping("/seed-article-source")
    public String seedArticleSource(@RequestBody @Valid ArticleSourceForm form) {
        ArticleSource saved = articleSourceService.seedArticleSource(form);
        return "Seed article source: " + saved.getTitle();
    }

    // ====== Seed 1 LISTING cụ thể (ví dụ /chinh-tri/su-kien)
    // GET /admin/api/seed-listing?href=/chinh-tri/su-kien&sourceId=1&categoryId=...&depth=0
    @GetMapping("/seed-listing")
    public String seedListing(@RequestParam String href,
                              @RequestParam Long sourceId,
                              @RequestParam Long categoryId,
                              @RequestParam(defaultValue = "0") int depth) {

        // luôn có đúng 1 dấu "/" sau host
        String url = href.startsWith("http")
                ? canonical(href)
                : "https://vietnamnet.vn" + (href.startsWith("/") ? href : "/" + href);

        String slug = slugFirst(url);

        producer.send(new CrawlMessage(
                CrawlMessage.Kind.LISTING,
                url,
                slug,
                depth,
                sourceId,
                categoryId
        ));

        return "queued LISTING: slug=" + slug + ", url=" + url + ", depth=" + depth;
    }

    // Api chỉnh sửa trạng thái nguồn crawler
    // PATCH /admin/api/sources/{id}/status?enabled=true|false
    @PatchMapping("/sources/{id}/status")
    public void updateSourceStatus(@PathVariable Long id,
                                   @RequestParam("enabled") boolean enabled) {

        ArticleSource src = articleSourceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Not found ArticleSource id=" + id));

        src.setStatus(enabled ? 1 : 0);
        articleSourceRepository.save(src);
    }

    // ====== Helpers (giống hệt bản cũ) ======
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
