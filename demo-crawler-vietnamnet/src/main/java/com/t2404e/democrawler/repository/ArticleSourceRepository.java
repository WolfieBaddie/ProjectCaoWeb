package com.t2404e.democrawler.repository;

import com.t2404e.democrawler.entity.ArticleSource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ArticleSourceRepository extends JpaRepository<ArticleSource, Long> {
    Optional<ArticleSource> findByArticleCategory_Id(Long categoryId);
    boolean existsByArticleCategory_Id(Long categoryId);
}
