package com.t2404e.democrawler.service;

import com.t2404e.democrawler.entity.ArticleCategory;
import com.t2404e.democrawler.dto.ArticleSourceDto;
import com.t2404e.democrawler.dto.CrawlerLogDetailDto;
import com.t2404e.democrawler.dto.CrawlerLogDto;
import com.t2404e.democrawler.entity.ArticleSource;
import com.t2404e.democrawler.entity.CrawlerLog;
import com.t2404e.democrawler.entity.CrawlerLog.BotType;
import com.t2404e.democrawler.repository.ArticleCategoryRepository;
import com.t2404e.democrawler.repository.ArticleSourceRepository;
import com.t2404e.democrawler.repository.CrawlerLogRepository;
import com.t2404e.democrawler.repository.CrawlerLogSourceStats;
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
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CrawlerLogService {

    private final CrawlerLogRepository repo;
    private final ArticleSourceRepository articleSourceRepository;
    private final ArticleCategoryRepository articleCategoryRepository; // 👈 thêm

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

    /**
     * Danh sách ArticleSource (status = 1) + thống kê log CONTENT
     */
    public List<ArticleSourceDto> getSourceOverviewForContentBot() {
        // 1) Chỉ lấy source đang active (status = 1)
        List<ArticleSource> sources = articleSourceRepository.findByStatus(1);

        if (sources.isEmpty()) {
            return List.of();
        }

        // 2) Lấy thống kê log cho bot CONTENT
        List<CrawlerLogSourceStats> statsList =
                repo.findSourceStatsByBotType(BotType.CONTENT);

        Map<Long, CrawlerLogSourceStats> statsBySourceId = statsList.stream()
                .collect(Collectors.toMap(
                        CrawlerLogSourceStats::getSourceId,
                        Function.identity()
                ));

        // 3) Gộp vào DTO
        return sources.stream()
                .map(src -> {
                    CrawlerLogSourceStats s = statsBySourceId.get(src.getId());
                    long totalLogs = (s != null) ? s.getTotalLogs() : 0L;
                    LocalDateTime lastRun = (s != null) ? s.getLastRun() : null;

                    return ArticleSourceDto.fromEntityWithStats(src, totalLogs, lastRun);
                })
                .toList();
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
            String keyword,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            int page,
            int size
    ) {
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

        Page<CrawlerLog> result = repo.findAll(spec, pageable);

        return result.map(l -> {
            String categoryName = resolveCategoryName(categoryId);

            return new CrawlerLogDto(
                    l.getId(),
                    l.getBotType() != null ? l.getBotType().name() : null,
                    l.getLevel(),
                    l.getMessage(),
                    l.getUrl(),
                    l.getSourceId(),
                    l.getArticleId(),
                    categoryId,
                    categoryName,          // 👈 tên category
                    l.getCreatedAt()
            );
        });
    }


    public Optional<CrawlerLogDetailDto> getLogDetail(Long id) {
        return repo.findById(id)
                .map(l -> {
                    Long categoryId = l.getCategoryId();
                    String categoryName = resolveCategoryName(categoryId);

                    return new CrawlerLogDetailDto(
                            l.getId(),
                            l.getBotType() != null ? l.getBotType().name() : null,
                            l.getLevel(),
                            l.getMessage(),
                            l.getUrl(),
                            l.getSourceId(),
                            l.getArticleId(),
                            categoryId,      // 👈 id
                            categoryName,    // 👈 name
                            l.getException(),
                            l.getCreatedAt()
                    );
                });
    }

    private String resolveCategoryName(Long categoryId) {
        if (categoryId == null) return null;
        return articleCategoryRepository.findById(categoryId)
                .map(ArticleCategory::getName)
                .orElse(null);
    }

}
