package com.t2404e.democrawler.repository;

import com.t2404e.democrawler.entity.CrawlerLog;
import com.t2404e.democrawler.entity.CrawlerLog.BotType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CrawlerLogRepository   extends JpaRepository<CrawlerLog, Long>,
        JpaSpecificationExecutor<CrawlerLog> {

    @Query("""
        select l.sourceId as sourceId,
               count(l)   as totalLogs,
               max(l.createdAt) as lastRun
        from CrawlerLog l
        where l.botType = :botType
          and l.sourceId is not null
        group by l.sourceId
    """)
    List<CrawlerLogSourceStats> findSourceStatsByBotType(@Param("botType") BotType botType);
}
