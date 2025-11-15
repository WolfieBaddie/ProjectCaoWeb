package com.t2404e.springagaint2404e.repository;

import com.t2404e.springagaint2404e.entity.Article;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ArticleRepository extends JpaRepository<Article, String> {
    @Query(value = "select * from article where is_crawled = 0",nativeQuery = true)
    List<Article> findNotCrawledArticle();
}
