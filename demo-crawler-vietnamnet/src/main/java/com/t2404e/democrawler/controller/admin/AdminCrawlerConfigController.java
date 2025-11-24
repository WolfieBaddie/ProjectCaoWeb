package com.t2404e.democrawler.controller.admin;


import com.t2404e.democrawler.service.CrawlerBotConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/api")
public class AdminCrawlerConfigController {
    private final CrawlerBotConfigService configService;

    // POST /admin/api/link?enabled=true|false
    @PostMapping("/link")
    public void setLink(@RequestParam boolean enabled) {
        configService.setLinkCrawlerEnabled(enabled);
    }

    // POST /admin/api/content?enabled=true|false
    @PostMapping("/content")
    public void setContent(@RequestParam boolean enabled) {
        configService.setContentCrawlerEnabled(enabled);
    }
}
