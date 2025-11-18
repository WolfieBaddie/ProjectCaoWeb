package com.t2404e.democrawler.repository;

import com.t2404e.democrawler.entity.Article;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ArticleRepository extends JpaRepository<Article, String> {
    @Query(value = "select * from article where is_crawled = 0",nativeQuery = true)
    List<Article> findNotCrawledArticle();
    Optional<Article> findByUrl(String url);
}
