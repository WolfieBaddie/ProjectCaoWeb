package com.t2404e.democrawler.messaging;

import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import static com.t2404e.democrawler.config.CrawlRabbitConfig.EX;

@Component
@RequiredArgsConstructor
public class CrawlProducer {
    private final RabbitTemplate tpl;

    public void send(CrawlTask t) {
        String rk = switch (t.getKind()) {
            case CATEGORY -> "cat";
            case LISTING  -> "list";
            case ARTICLE  -> "article";
        };
        tpl.convertAndSend(EX, rk, t);
    }
}
