package com.t2404e.democrawler.controller.admin;

import com.t2404e.democrawler.dto.CrawlerLogDetailDto;
import com.t2404e.democrawler.dto.CrawlerLogDto;
import com.t2404e.democrawler.entity.CrawlerLog;
import com.t2404e.democrawler.service.CrawlerLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/admin/crawler/logs")
@RequiredArgsConstructor
public class AdminCrawlerLogController {
    private final CrawlerLogService crawlerLogService;

    /**
     * List log với các filter cơ bản:
     * botType, sourceId, categoryId, articleId, level + paging
     */
    @GetMapping
    public Page<CrawlerLogDto> listLogs(
            @RequestParam(value = "bot", required = false) CrawlerLog.BotType botType,
            @RequestParam(value = "sourceId", required = false) Long sourceId,
            @RequestParam(value = "categoryId", required = false) Long categoryId,
            @RequestParam(value = "articleId", required = false) Long articleId,
            @RequestParam(value = "level", required = false) String level,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "50") int size
    ) {
        return crawlerLogService.searchLogs(
                botType,
                sourceId,
                categoryId,
                articleId,
                level,
                page,
                size
        );
    }

    /**
     * Xem chi tiết 1 log (kèm exception)
     */
    @GetMapping("/{id}")
    public CrawlerLogDetailDto getLog(@PathVariable Long id) {
        return crawlerLogService.getLogDetail(id)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Log not found")
                );
    }
}
