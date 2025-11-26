package com.t2404e.democrawler.repository;
import java.time.LocalDateTime;

public interface CrawlerLogSourceStats {
    Long getSourceId();
    long getTotalLogs();
    LocalDateTime getLastRun();
}
