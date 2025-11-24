package com.t2404e.democrawler.messaging;

import com.t2404e.democrawler.service.CrawlerLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import static com.t2404e.democrawler.config.CrawlRabbitConfig.EX;

@Component
@RequiredArgsConstructor
public class LinkCrawlerProducer {
    private final RabbitTemplate tpl;
    private final CrawlerLogService crawlerLogService;

    public void send(CrawlMessage t) {
        String rk = switch (t.getKind()) {
            case CATEGORY -> "cat";
            case LISTING  -> "list";
            case ARTICLE  -> "article";
        };
        tpl.convertAndSend(EX, rk, t);

        // Ghi log vào DB
        String msg = "Enqueue " + t.getKind() + " task"
                + " url=" + t.getUrl()
                + " sourceId=" + t.getSourceId();
        crawlerLogService.infoLink(msg, t.getUrl(), t.getSourceId());
    }
}
