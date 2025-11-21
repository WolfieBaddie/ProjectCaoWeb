package com.t2404e.democrawler.config;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Table(name = "crawler_bot_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CrawlerBotConfig {
    @Id
    private Long id = 1L;  // chỉ 1 dòng duy nhất

    private boolean linkCrawlerEnabled = true;
    private boolean contentCrawlerEnabled = true;
}
