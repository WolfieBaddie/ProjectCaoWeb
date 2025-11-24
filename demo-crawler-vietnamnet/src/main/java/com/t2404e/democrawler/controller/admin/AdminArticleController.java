package com.t2404e.democrawler.controller.admin;

import com.t2404e.democrawler.common.ArticleStatus;
import com.t2404e.democrawler.dto.ArticleListItemDto;
import com.t2404e.democrawler.service.ArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

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
    public Page<ArticleListItemDto> searchArticles(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "categoryId", required = false) Long categoryId,
            @RequestParam(value = "status", required = false) ArticleStatus status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        return articleService.searchCrawledArticles(
                keyword,
                categoryId,
                status,
                PageRequest.of(page, size)
        );
    }
}
