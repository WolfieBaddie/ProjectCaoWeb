package com.t2404e.democrawler.service;

import com.t2404e.democrawler.config.CrawlerBotConfig;
import com.t2404e.democrawler.repository.CrawlerBotConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CrawlerBotConfigService {
    private final CrawlerBotConfigRepository repo;

    private CrawlerBotConfig load() {
        return repo.findById(1L)
                .orElseGet(() -> repo.save(new CrawlerBotConfig(1L, true, true)));
    }

    @Transactional(readOnly = true)
    public boolean isLinkCrawlerEnabled() {
        return load().isLinkCrawlerEnabled();
    }

    @Transactional(readOnly = true)
    public boolean isContentCrawlerEnabled() {
        return load().isContentCrawlerEnabled();
    }

    @Transactional
    public void setLinkCrawlerEnabled(boolean enabled) {
        CrawlerBotConfig c = load();
        c.setLinkCrawlerEnabled(enabled);
        repo.save(c);
    }

    @Transactional
    public void setContentCrawlerEnabled(boolean enabled) {
        CrawlerBotConfig c = load();
        c.setContentCrawlerEnabled(enabled);
        repo.save(c);
    }
}
