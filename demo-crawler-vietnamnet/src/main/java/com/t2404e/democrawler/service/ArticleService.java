package com.t2404e.democrawler.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.t2404e.democrawler.common.ArticleStatus;
import com.t2404e.democrawler.dto.ArticleListItemDto;
import com.t2404e.democrawler.entity.Article;
import com.t2404e.democrawler.repository.ArticleRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ArticleService {

    private static final Duration SEARCH_CACHE_TTL = Duration.ofSeconds(30);

    private final ArticleRepository articleRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    /**
     * Search các bài ĐÃ CRAWL (is_crawled = 1) có phân trang + cache Redis.
     *
     * Dùng cho:
     *  - màn quản lý article
     *  - dashboard Latest Fetched News (có filter hoặc không)
     */
    public Page<ArticleListItemDto> searchCrawledArticles(
            String keyword,
            Long categoryId,
            ArticleStatus status,
            Pageable pageable
    ) {
        String normalizedKeyword = normalizeKeyword(keyword);
        String cacheKey = buildSearchCacheKey(normalizedKeyword, categoryId, status, pageable);

        // 1) Thử lấy từ Redis trước
        Page<ArticleListItemDto> cached = tryReadPageFromCache(cacheKey);
        if (cached != null) {
            log.debug("Article search cache HIT: key={}", cacheKey);
            return cached;
        }

        log.debug("Article search cache MISS: key={}", cacheKey);

        // 2) Query DB
        Page<Article> dbPage = articleRepository.searchLatestArticles(
                normalizedKeyword,
                categoryId,
                status,
                pageable
        );

        Page<ArticleListItemDto> dtoPage = dbPage.map(this::toListItemDto);

        // 3) Ghi vào Redis (best effort)
        writePageToCache(cacheKey, dtoPage);

        return dtoPage;
    }

    /**
     * Section Latest Fetched News trên dashboard:
     * - Thực chất là searchCrawledArticles với filter đơn giản.
     */
    public Page<ArticleListItemDto> getLatestFetchedNews(Pageable pageable) {
        // Nếu bạn muốn chỉ lấy PUBLISHED:
        // return searchCrawledArticles(null, null, ArticleStatus.PUBLISHED, pageable);
        return searchCrawledArticles(null, null, null, pageable);
    }

    // ============================================================
    // ================   Cache Helpers (Redis)   ==================
    // ============================================================

    private String buildSearchCacheKey(
            String keyword,
            Long categoryId,
            ArticleStatus status,
            Pageable pageable
    ) {
        String k = keyword == null ? "" : keyword.trim().toLowerCase();
        String kwHash = k.isEmpty()
                ? "none"
                : DigestUtils.md5DigestAsHex(k.getBytes(StandardCharsets.UTF_8));

        String cat = (categoryId == null) ? "none" : String.valueOf(categoryId);
        String st = (status == null) ? "none" : status.name();

        return "articles:search:isCrawled1:" +
                "kw:" + kwHash +
                ":cat:" + cat +
                ":status:" + st +
                ":page:" + pageable.getPageNumber() +
                ":size:" + pageable.getPageSize();
    }

    private Page<ArticleListItemDto> tryReadPageFromCache(String cacheKey) {
        try {
            String json = redisTemplate.opsForValue().get(cacheKey);
            if (json == null || json.isBlank()) {
                return null;
            }

            CachedArticlePage cached = objectMapper.readValue(json, CachedArticlePage.class);

            Pageable pageable = PageRequest.of(cached.getPageNumber(), cached.getPageSize(),
                    Sort.unsorted());

            return new PageImpl<>(
                    cached.getContent(),
                    pageable,
                    cached.getTotalElements()
            );
        } catch (Exception ex) {
            log.warn("Failed to read article search cache, key={}", cacheKey, ex);
            return null;
        }
    }

    private void writePageToCache(String cacheKey, Page<ArticleListItemDto> page) {
        try {
            CachedArticlePage cached = new CachedArticlePage(
                    page.getContent(),
                    page.getNumber(),
                    page.getSize(),
                    page.getTotalElements(),
                    page.getTotalPages(),
                    page.isLast()
            );

            String json = objectMapper.writeValueAsString(cached);
            redisTemplate
                    .opsForValue()
                    .set(cacheKey, json, SEARCH_CACHE_TTL);
        } catch (Exception ex) {
            log.warn("Failed to write article search cache, key={}", cacheKey, ex);
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    private static class CachedArticlePage {
        private List<ArticleListItemDto> content;
        private int pageNumber;
        private int pageSize;
        private long totalElements;
        private int totalPages;
        private boolean last;
    }

    // ============================================================
    // ====================   Mappers   ============================
    // ============================================================

    private String normalizeKeyword(String keyword) {
        if (keyword == null) return null;
        String trimmed = keyword.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private ArticleListItemDto toListItemDto(Article article) {
        String categoryName = null;
        if (article.getArticleCategory() != null) {
            categoryName = article.getArticleCategory().getName();
        }

        return ArticleListItemDto.builder()
                .id(article.getId())
                .url(article.getUrl())
                .title(article.getTitle())
                .description(article.getDescription())
                .imageUrl(article.getImageUrl())
                .crawled(article.isCrawled())
                .status(article.getStatus())
                .categoryName(categoryName)
                .build();
    }
}
