package com.t2404e.democrawler.controller.admin;
import com.t2404e.democrawler.dto.ArticleSourceForm;
import com.t2404e.democrawler.dto.ArticleSourceSummaryDto;
import com.t2404e.democrawler.dto.RunSourceRequest;
import com.t2404e.democrawler.entity.ArticleSource;
import com.t2404e.democrawler.messaging.CrawlMessage;
import com.t2404e.democrawler.messaging.LinkCrawlerProducer;
import com.t2404e.democrawler.repository.ArticleSourceRepository;
import com.t2404e.democrawler.service.ArticleSourceService;
import com.t2404e.democrawler.service.CrawlerAdminSourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/api")
public class AdminArticleSourceController {
    private final LinkCrawlerProducer producer;
    private final StringRedisTemplate redis;
    private final ArticleSourceRepository articleSourceRepository;
    private final ArticleSourceService articleSourceService;
    private final CrawlerAdminSourceService crawlerAdminSourceService;


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
    public ResponseEntity<String> seedArticleSource(
            @Valid @RequestBody ArticleSourceForm form
    ) {
        articleSourceService.seedArticleSource(form);
        return ResponseEntity.ok("Seed article source thành công");
    }

    // ====== Seed 1 LISTING cụ thể (ví dụ /chinh-tri/su-kien)
    // GET /admin/api/seed-listing?href=/chinh-tri/su-kien&sourceId=1&categoryId=...&depth=0
    @PostMapping("/{id}/seed-listing")
    public ResponseEntity<?> seedListing(@PathVariable Long id) {
        log.info("[ADMIN] seed-listing requested for source={}", id);
        crawlerAdminSourceService.triggerSeedListingForSource(id);
        return ResponseEntity.accepted().body(
                Map.of("status", "ACCEPTED", "sourceId", id)
        );
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

    @PostMapping("/{id}/run-full")
    public ResponseEntity<?> runFull(
            @PathVariable Long id,
            @RequestBody(required = false) RunSourceRequest request
    ) {
        boolean includeLink = request == null || request.includeLink();
        boolean includeContent = request == null || request.includeContent();

        log.info("[ADMIN] run-full requested for source={} includeLink={} includeContent={}",
                id, includeLink, includeContent);

        crawlerAdminSourceService.triggerSeedListingForSource(id);

        return ResponseEntity.accepted().body(
                Map.of(
                        "status", "ACCEPTED",
                        "sourceId", id,
                        "includeLink", includeLink,
                        "includeContent", includeContent
                )
        );
    }

    @GetMapping("article-sources")
    public List<ArticleSourceSummaryDto> listSources(
            @RequestParam(defaultValue = "true") boolean activeOnly
    ) {
        List<ArticleSource> entities = activeOnly
                ? articleSourceRepository.findByStatus(1) // chỉ lấy active
                : articleSourceRepository.findAll();

        return entities.stream()
                .map(ArticleSourceSummaryDto::fromEntity)
                .toList();
    }

    // Sửa 1 ArticleSource theo id
    // PUT /admin/api/article-sources/{id}
    @PutMapping("/article-sources/{id}")
    public ResponseEntity<Void> updateArticleSource(
            @PathVariable Long id,
            @Valid @RequestBody ArticleSourceForm form
    ) {
        articleSourceService.updateArticleSource(id, form);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/article-sources/{id}")
    public ResponseEntity<Void> softDeleteArticleSource(@PathVariable Long id) {
        articleSourceService.softDeleteArticleSource(id);
        return ResponseEntity.noContent().build();
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
