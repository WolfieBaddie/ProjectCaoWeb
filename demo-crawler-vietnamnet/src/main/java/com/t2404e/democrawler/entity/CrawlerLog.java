package com.t2404e.democrawler.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "crawler_log",
        indexes = {
                @Index(name = "idx_crawler_log_bot_created_at", columnList = "botType, createdAt"),
                @Index(name = "idx_crawler_log_source", columnList = "sourceId"),
                @Index(name = "idx_crawler_log_article", columnList = "articleId")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrawlerLog {
    public enum BotType {
        LINK,    // LinkCrawlerBot
        CONTENT  // ContentCrawlerBot
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BotType botType;

    @Column(nullable = false, length = 10)
    private String level; // INFO, WARN, ERROR

    @Column(nullable = false, length = 2000)
    private String message;

    @Column(length = 1000)
    private String url;      // URL đang xử lý (listing hoặc article)

    private Long sourceId;   // ArticleSource.id nếu có

    private Long articleId;  // Article.id nếu có

    @Column(columnDefinition = "TEXT")
    private String exception; // stacktrace / message lỗi (optional)

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
