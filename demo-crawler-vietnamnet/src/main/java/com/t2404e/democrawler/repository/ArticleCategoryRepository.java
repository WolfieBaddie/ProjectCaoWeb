package com.t2404e.democrawler.repository;

import com.t2404e.democrawler.entity.ArticleCategory;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ArticleCategoryRepository extends JpaRepository<ArticleCategory, Long> {
    // Lấy các category chưa bị xóa mềm
    List<ArticleCategory> findByDeletedFalse(Sort sort);
}
