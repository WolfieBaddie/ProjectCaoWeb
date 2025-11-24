package com.t2404e.democrawler.service;

import com.t2404e.democrawler.dto.CrawlerLogDetailDto;
import com.t2404e.democrawler.dto.CrawlerLogDto;
import com.t2404e.democrawler.entity.CrawlerLog;
import com.t2404e.democrawler.entity.CrawlerLog.BotType;
import com.t2404e.democrawler.repository.CrawlerLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CrawlerLogService {

    private final CrawlerLogRepository repo;

    private void save(String level,
                      BotType botType,
                      String message,
                      String url,
                      Long sourceId,
                      Long articleId,
                      Long categoryId,
                      Throwable ex) {

        String exceptionText = null;
        if (ex != null) {
            StringWriter sw = new StringWriter();
            ex.printStackTrace(new PrintWriter(sw));
            exceptionText = sw.toString();
        }

        CrawlerLog log = new CrawlerLog();
        log.setBotType(botType);      // LINK / CONTENT
        log.setLevel(level);          // INFO / WARN / ERROR
        log.setMessage(message);
        log.setUrl(url);
        log.setSourceId(sourceId);
        log.setArticleId(articleId);
        log.setCategoryId(categoryId);
        log.setException(exceptionText);
        log.setCreatedAt(LocalDateTime.now());

        repo.save(log);
    }

    // ==== LinkCrawler (CATEGORY / LISTING / enqueue ARTICLE) ====

    public void infoLink(String message, String url,  Long categoryId) {
        save("INFO", BotType.LINK, message, url, null, null, categoryId, null);
    }

    public void warnLink(String message, String url, Long sourceId, Long categoryId) {
        save("WARN", BotType.LINK, message, url, sourceId, null, categoryId, null);
    }

    public void errorLink(String message, String url, Long sourceId, Long categoryId, Throwable ex) {
        save("ERROR", BotType.LINK, message, url, sourceId, null, categoryId, ex);
    }

    // ==== ContentCrawler (ARTICLE detail) ====

    public void infoContent(String message, String url, Long sourceId, Long articleId, Long categoryId) {
        save("INFO", BotType.CONTENT, message, url, sourceId, articleId, categoryId,null);
    }

    public void warnContent(String message, String url, Long sourceId, Long articleId, Long categoryId) {
        save("WARN", BotType.CONTENT, message, url, sourceId, articleId,  categoryId,null);
    }

    public void errorContent(String message, String url, Long sourceId, Long articleId, Long categoryId, Throwable ex) {
        save("ERROR", BotType.CONTENT, message, url, sourceId, articleId, categoryId, ex);
    }

    //Tìm kiếm logs cho admin

    // =========================
    // PHẦN TÌM KIẾM LOG CHO ADMIN
    // =========================
    private Specification<CrawlerLog> buildLogSpecification(
            CrawlerLog.BotType botType,
            Long sourceId,
            Long categoryId,
            Long articleId,
            String level
    ) {
        return (root, query, cb) -> {

            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();

            if (botType != null) {
                predicates.add(cb.equal(root.get("botType"), botType));
            }

            if (sourceId != null) {
                predicates.add(cb.equal(root.get("sourceId"), sourceId));
            }

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("categoryId"), categoryId));
            }

            if (articleId != null) {
                predicates.add(cb.equal(root.get("articleId"), articleId));
            }

            if (StringUtils.hasText(level)) {
                predicates.add(cb.equal(root.get("level"), level));
            }

            if (predicates.isEmpty()) {
                return null;
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }


    //Tìm kiếm logs cho admin
    public Page<CrawlerLogDto> searchLogs(
            CrawlerLog.BotType botType,
            Long sourceId,
            Long categoryId,
            Long articleId,
            String level,
            int page,
            int size
    ) {
        // Sort createdAt DESC ngay ở đây, không cần withSort
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Specification<CrawlerLog> spec = buildLogSpecification(
                botType,
                sourceId,
                categoryId,
                articleId,
                level
        );

        Page<CrawlerLog> logs = repo.findAll(spec, pageable);

        return logs.map(l -> new CrawlerLogDto(
                l.getId(),
                l.getBotType() != null ? l.getBotType().name() : null,
                l.getLevel(),
                l.getMessage(),
                l.getUrl(),
                l.getSourceId(),
                l.getCategoryId(),
                l.getArticleId(),
                l.getCreatedAt()
        ));
    }

    public Optional<CrawlerLogDetailDto> getLogDetail(Long id) {
        return repo.findById(id)
                .map(l -> new CrawlerLogDetailDto(
                        l.getId(),
                        l.getBotType() != null ? l.getBotType().name() : null,
                        l.getLevel(),
                        l.getMessage(),
                        l.getUrl(),
                        l.getSourceId(),
                        l.getArticleId(),
                        l.getException(),// stacktrace / exceptionText
                        l.getCreatedAt()
                ));
    }

}
