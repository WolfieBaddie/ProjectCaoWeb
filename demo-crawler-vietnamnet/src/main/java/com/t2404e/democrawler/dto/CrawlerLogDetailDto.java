package com.t2404e.democrawler.dto;

import java.time.LocalDateTime;

public record CrawlerLogDetailDto(
        Long id,
        String botType,
        String level,
        String message,
        String url,
        Long sourceId,
        Long articleId,
        Long categoryId,
        String categoryName,
        String exception,     // stacktrace / message lỗi đầy đủ
        LocalDateTime createdAt
) {
}