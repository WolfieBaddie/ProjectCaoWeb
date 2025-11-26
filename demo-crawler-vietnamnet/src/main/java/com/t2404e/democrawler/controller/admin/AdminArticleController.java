package com.t2404e.democrawler.controller.admin;

import com.t2404e.democrawler.common.ArticleStatus;
import com.t2404e.democrawler.dto.ArticleListItemDto;
import com.t2404e.democrawler.dto.DeleteArticleResponse;
import com.t2404e.democrawler.service.ArticleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import com.t2404e.democrawler.dto.ArticleDetailDto;
import com.t2404e.democrawler.dto.UpdateArticleRequest;
import com.t2404e.democrawler.dto.SeedArticleRequest;
import jakarta.validation.Valid;

import java.time.LocalDateTime;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/api")
public class AdminArticleController {

    private final ArticleService articleService;

    /**
     * API cho section "Latest fetched news" trên dashboard.
     *
     * - Luôn chỉ trả về các bài viết đã crawl xong (is_crawled = 1)
     *   vì ArticleReadService.searchCrawledArticles() / getLatestFetchedNews()
     *   đã query với điều kiện a.isCrawled = true trong Repository.
     *
     * - Mặc định: page=0, size=6 (6 bài mới nhất), bạn chỉnh tùy UI.
     *
     * GET /admin/api/articles/latest?page=0&size=6
     */
    @GetMapping("/articles/latest")
    public Page<ArticleListItemDto> getLatestFetchedNews(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "6") int size
    ) {
        return articleService.getLatestFetchedNews(
                PageRequest.of(page, size)
        );
    }

    /**
     * API search danh sách bài viết (cũng chỉ lấy is_crawled = 1).
     *
     * - keyword: tìm trong title / description (optional)
     * - categoryId: lọc theo category (optional)
     * - status: lọc theo ArticleStatus (optional)
     * - page, size: phân trang dùng cho màn list / quản lý.
     *
     * GET /admin/api/articles?keyword=abc&categoryId=1&status=PUBLISHED&page=0&size=20
     */
    @GetMapping("/articles")
    public Page<ArticleListItemDto> listArticles(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) ArticleStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime toDate
    ) {
        log.info("[ADMIN] listArticles keyword={} catId={} status={} page={} size={} from={} to={}",
                keyword, categoryId, status, page, size, fromDate, toDate);

        PageRequest pageable = PageRequest.of(page, size);

        return articleService.searchCrawledArticles(
                keyword,
                categoryId,
                status,
                fromDate,
                toDate,
                pageable,
                size
        );

    }

    @GetMapping("/articles/{id}")
    public ArticleDetailDto getArticle(@PathVariable Long id) {
        return articleService.getArticleDetail(id);
    }

    @PutMapping("/articles/{id}")
    public ArticleDetailDto updateArticle(
            @PathVariable Long id,
            @Valid @RequestBody UpdateArticleRequest request
    ) {
        return articleService.updateArticle(id, request);
    }

    @DeleteMapping("/articles/{id}")
    public DeleteArticleResponse softDeleteArticle(@PathVariable Long id) {
        return articleService.softDeleteArticle(id);
    }
}
