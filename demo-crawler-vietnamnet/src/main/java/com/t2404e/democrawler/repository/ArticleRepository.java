package com.t2404e.democrawler.repository;

import com.t2404e.democrawler.common.ArticleStatus;
import com.t2404e.democrawler.entity.Article;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ArticleRepository extends JpaRepository<Article, Long> {
    @Query(value = "select * from article where is_crawled = 0", nativeQuery = true)
    List<Article> findNotCrawledArticle();

    Optional<Article> findByUrl(String url);

    /**
     * Search các bài viết ĐÃ CRAWL (is_crawled = 1) có phân trang.
     *
     * - keyword: tìm trong title / description (LIKE %keyword%)
     * - categoryId: lọc theo category nếu != null
     * - status: lọc theo status nếu != null
     *
     * Luôn có điều kiện a.isCrawled = true.
     */
    @Query("""
           SELECT a
           FROM Article a
           WHERE a.isCrawled = true
             AND (:keyword IS NULL OR :keyword = '' OR
                  lower(a.title) LIKE lower(concat('%', :keyword, '%')) OR
                  lower(a.description) LIKE lower(concat('%', :keyword, '%')))
             AND (:categoryId IS NULL OR a.articleCategory.id = :categoryId)
             AND (:status IS NULL OR a.status = :status)
           ORDER BY a.id DESC
           """)
    Page<Article> searchLatestArticles(
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId,
            @Param("status") ArticleStatus status,
            Pageable pageable
    );
}
