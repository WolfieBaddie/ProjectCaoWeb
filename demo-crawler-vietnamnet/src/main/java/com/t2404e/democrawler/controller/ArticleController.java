package com.t2404e.democrawler.controller;

import com.t2404e.democrawler.entity.Article;
import com.t2404e.democrawler.repository.ArticleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/articles")
public class ArticleController {
    private final ArticleRepository articleRepo;

    @GetMapping
    public List<Article> list() { // demo: trả thẳng, thực tế nên phân trang
        return articleRepo.findAll();
    }

    @GetMapping("/{url}")
    public Article get(@PathVariable String url) {
        return articleRepo.findByUrl(url)
                .orElseThrow(() -> new NoSuchElementException("Article not found"));
    }

    @GetMapping("/not-crawled")
    public List<Article> notCrawled() {
        return articleRepo.findNotCrawledArticle();
    }
}
