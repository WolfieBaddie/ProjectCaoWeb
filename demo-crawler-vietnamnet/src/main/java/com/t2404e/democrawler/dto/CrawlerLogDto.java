package com.t2404e.democrawler.dto;

import java.time.LocalDateTime;

public record CrawlerLogDto (
        Long id,
        String botType,   // "LINK" / "CONTENT"
        String level,     // "INFO" / "WARN" / "ERROR"
        String message,
        String url,
        Long sourceId,
        Long articleId,
        Long categoryId,
        LocalDateTime createdAt
)
{}
