package com.t2404e.democrawler.repository;

import com.t2404e.democrawler.common.ArticleStatus;
import com.t2404e.democrawler.entity.Article;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ArticleRepository extends JpaRepository<Article, Long> {
    @Query(value = "select * from article where is_crawled = 0", nativeQuery = true)
    List<Article> findNotCrawledArticle();

    Optional<Article> findByUrl(String url);

    @Modifying
    @Transactional
    @Query("UPDATE Article a SET a.status = :status WHERE a.articleCategory.id = :categoryId")
    int updateStatusByCategoryId(@Param("categoryId") Long categoryId,
                                 @Param("status") ArticleStatus status);

    @Modifying
    @Transactional
    @Query("""
           UPDATE Article a 
              SET a.status = :status,
                  a.updated_at = :updatedAt
            WHERE a.articleCategory.id = :categoryId
           """)
    int updateStatusAndUpdatedAtByCategoryId(@Param("categoryId") Long categoryId,
                                             @Param("status") ArticleStatus status,
                                             @Param("updatedAt") LocalDateTime updatedAt);

    @Query("select a.url from Article a where a.url in :urls")
    List<String> findAllUrlByUrlIn(Collection<String> urls);
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
         AND (:fromDate IS NULL OR a.created_at >= :fromDate)
         AND (:toDate IS NULL OR a.created_at <= :toDate)
       ORDER BY a.id DESC
       """)
    Page<Article> searchLatestArticles(
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId,
            @Param("status") ArticleStatus status,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable
    );

    /**
     * Lấy danh sách bài viết PUBLISHED mới nhất cho CLIENT,
     * sắp xếp theo created_at DESC.
     * Không filter keyword / category / date, chỉ cần bài đã crawl + publish.
     */
    @Query("""
       SELECT a
       FROM Article a
       WHERE a.isCrawled = true
         AND a.status = :status
       ORDER BY a.created_at DESC
       """)
    Page<Article> findLatestPublishedForClient(
            @Param("status") ArticleStatus status,
            Pageable pageable
    );



    /**
     * Đếm số bài viết thuộc category mà KHÔNG ở trạng thái DELETED.
     */
    long countByArticleCategoryIdAndStatusNot(Long categoryId, ArticleStatus status);
}
