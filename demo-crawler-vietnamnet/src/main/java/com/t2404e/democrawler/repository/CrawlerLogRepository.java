package com.t2404e.democrawler.repository;

import com.t2404e.democrawler.entity.CrawlerLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface CrawlerLogRepository   extends JpaRepository<CrawlerLog, Long>,
        JpaSpecificationExecutor<CrawlerLog> {

}
