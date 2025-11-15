package com.t2404e.springagaint2404e.repository;

import com.t2404e.springagaint2404e.entity.Article;
import com.t2404e.springagaint2404e.entity.ArticleSource;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ArticleSourceRepository extends JpaRepository<ArticleSource, Long> {
}
