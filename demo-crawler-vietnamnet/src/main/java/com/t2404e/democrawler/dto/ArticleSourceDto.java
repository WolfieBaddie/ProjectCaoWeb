package com.t2404e.democrawler.dto;

import com.t2404e.democrawler.entity.ArticleSource;

import java.time.LocalDateTime;

public record ArticleSourceDto(
        Long id,
        String name,
        String code,
        String baseUrl,
        int status,
        long totalLogs,          // 🔥 tổng log CONTENT cho source này
        LocalDateTime lastRun    // 🔥 lần chạy (CONTENT) gần nhất
) {

    // Dùng cho các chỗ cũ chưa cần thống kê → totalLogs = 0, lastRun = null
    public static ArticleSourceDto fromEntity(ArticleSource src) {
        return new ArticleSourceDto(
                src.getId(),
                src.getTitle(),
                src.getDescription(),
                src.getUrl(),
                src.getStatus(),
                0L,
                null
        );
    }

    // Dùng cho màn Log overview
    public static ArticleSourceDto fromEntityWithStats(
            ArticleSource src,
            long totalLogs,
            LocalDateTime lastRun
    ) {
        return new ArticleSourceDto(
                src.getId(),
                src.getTitle(),
                src.getDescription(),
                src.getUrl(),
                src.getStatus(),
                totalLogs,
                lastRun
        );
    }
}
