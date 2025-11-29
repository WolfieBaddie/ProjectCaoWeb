package com.t2404e.democrawler.repository;

import com.t2404e.democrawler.common.ArticleStatus;
import com.t2404e.democrawler.entity.ArticleCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ArticleCategoryRepository extends JpaRepository<ArticleCategory, Long> {
    // Lấy các category chưa bị xóa mềm
    List<ArticleCategory> findByDeletedFalse(Sort sort);

    @Query("""
        SELECT c
        FROM ArticleCategory c
        WHERE c.deleted = false
          AND (:keyword IS NULL OR :keyword = '' 
               OR LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
        """)
    Page<ArticleCategory> searchByName(
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
