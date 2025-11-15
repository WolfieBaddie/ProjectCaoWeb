package com.t2404e.springagaint2404e.controller;

import com.t2404e.springagaint2404e.entity.ArticleSource;
import com.t2404e.springagaint2404e.repository.ArticleSourceRepository;
import com.t2404e.springagaint2404e.service.CrawlService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/sources")
public class ArticleSourceController {
    private final ArticleSourceRepository sourceRepo;
    private final CrawlService crawlService;
    private final com.t2404e.springagaint2404e.messaging.CrawlProducer producer;

    // CRUD tối giản cho Source (create/update/list)
    @PostMapping
    public ArticleSource upsert(@RequestBody ArticleSource src) {
        return sourceRepo.save(src);
    }

    @GetMapping
    public List<ArticleSource> list() {
        return sourceRepo.findAll();
    }

}
