package com.t2404e.democrawler.repository;

import com.t2404e.democrawler.config.CrawlerBotConfig;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CrawlerBotConfigRepository extends JpaRepository<CrawlerBotConfig, Long> {
}
