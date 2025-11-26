package com.t2404e.democrawler.controller.admin;

import com.t2404e.democrawler.dto.CrawlerLogDetailDto;
import com.t2404e.democrawler.dto.CrawlerLogDto;
import com.t2404e.democrawler.entity.CrawlerLog;
import com.t2404e.democrawler.service.CrawlerLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import com.t2404e.democrawler.dto.ArticleSourceDto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;


@RestController
@RequestMapping("/admin/api")
@RequiredArgsConstructor
public class AdminCrawlerLogController {
    private final CrawlerLogService crawlerLogService;

    /**
     * Overview cho LogsView: danh sách nguồn + tổng log CONTENT + lần chạy CONTENT gần nhất
     */

    @GetMapping("/crawler/logs/sources-overview")
    public List<ArticleSourceDto> listSourcesOverview() {
        // Chỉ lấy source có status = 1, bot CONTENT
        return crawlerLogService.getSourceOverviewForContentBot();
    }

    /**
     * List log với các filter cơ bản:
     * botType, sourceId, categoryId, articleId, level + paging
     */
    @GetMapping("/crawler/logs")
    public Page<CrawlerLogDto> listLogs(
            @RequestParam(value = "bot",        required = false) String bot,
            @RequestParam(value = "sourceId",   required = false) Long sourceId,
            @RequestParam(value = "categoryId", required = false) Long categoryId,
            @RequestParam(value = "articleId",  required = false) Long articleId,
            @RequestParam(value = "level",      required = false) String level,
            @RequestParam(value = "keyword",    required = false) String keyword,
            @RequestParam(value = "fromDate",   required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(value = "toDate",     required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(value = "page",       defaultValue = "0") int page,
            @RequestParam(value = "size",       defaultValue = "50") int size
    ) {
        // Convert bot = String -> enum, bỏ qua "All"
        CrawlerLog.BotType botType = null;
        if (bot != null && !bot.isBlank() && !"All".equalsIgnoreCase(bot)) {
            botType = CrawlerLog.BotType.valueOf(bot.toUpperCase());
        }

        LocalDateTime fromDt = (fromDate != null) ? fromDate.atStartOfDay() : null;
        LocalDateTime toDt   = (toDate   != null) ? toDate.plusDays(1).atStartOfDay() : null;

        return crawlerLogService.searchLogs(
                botType,
                sourceId,
                categoryId,
                articleId,
                level,
                keyword,
                fromDt,
                toDt,
                page,
                size
        );
    }



    /**
     * Xem chi tiết 1 log (kèm exception)
     */
    @GetMapping("/crawler/logs/{id}")
    public CrawlerLogDetailDto getLog(@PathVariable Long id) {
        return crawlerLogService.getLogDetail(id)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Log not found")
                );
    }
}
