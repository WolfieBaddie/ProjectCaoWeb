package com.t2404e.democrawler.repository;

import com.t2404e.democrawler.entity.Article;
import com.t2404e.democrawler.entity.ArticleImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArticleImageRepository {
    List<ArticleImage> findByArticle(Article article);

    void deleteByArticle(Article article);
}
