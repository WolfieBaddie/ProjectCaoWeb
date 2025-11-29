package com.t2404e.democrawler.controller.client;

import com.t2404e.democrawler.dto.ArticleDetailDto;
import com.t2404e.democrawler.dto.ArticleListItemDto;
import com.t2404e.democrawler.service.ArticleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/client/api/articles")
public class ClientArticleController {

    private final ArticleService articleService;

    /**
     * Search bài viết public cho client:
     *  - Luôn ép status = PUBLISHED trong ArticleService.searchClientArticles()
     *  - Không yêu cầu JWT (nếu dùng cookie / session vẫn gửi bình thường)
     *
     * GET /client/api/articles/search
     */
    @GetMapping("/search")
    public Page<ArticleListItemDto> searchPublicArticles(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            // nếu có filter nguồn:
            @RequestParam(required = false) String source,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate toDate
    ) {
        log.info("[CLIENT] searchPublicArticles kw={} catId={} source={} page={} size={} from={} to={}",
                keyword, categoryId, source, page, size, fromDate, toDate);

        Pageable pageable = PageRequest.of(page, size);

        LocalDateTime fromDateTime = (fromDate != null)
                ? fromDate.atStartOfDay()
                : null;
        LocalDateTime toDateTime = (toDate != null)
                ? toDate.atTime(23, 59, 59)
                : null;

        // Hiện tại ArticleService.searchClientArticles chưa dùng source,
        // nếu sau này muốn filter theo source thì bổ sung vào repository + service.
        return articleService.searchClientArticles(
                keyword,
                categoryId,
                fromDateTime,
                toDateTime,
                pageable
        );
    }

    /**
     * Lấy chi tiết 1 bài cho client. Chỉ nên trả về bài PUBLISHED.
     *
     * GET /client/api/articles/{id}
     */
    @GetMapping("/{id}")
    public ArticleDetailDto getPublicArticleDetail(@PathVariable Long id) {
        return articleService.getClientArticleDetail(id);
    }

    /**
     * Lấy N bài mới nhất cho trang chủ client.
     *
     * GET /client/api/articles/latest?limit=3
     */
    @GetMapping("/latest")
    public List<ArticleListItemDto> getLatestPublicArticles(
            @RequestParam(defaultValue = "3") int limit
    ) {
        return articleService.getClientLatestArticles(limit);
    }
}
