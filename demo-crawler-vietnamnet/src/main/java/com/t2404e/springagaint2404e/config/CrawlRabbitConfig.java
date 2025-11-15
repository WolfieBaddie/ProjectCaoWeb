package com.t2404e.springagaint2404e.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
@EnableRabbit
public class CrawlRabbitConfig {
    public static final String EX = "crawl.ex";
    public static final String Q_CAT = "crawl.cat";
    public static final String Q_LIST = "crawl.list";
    public static final String Q_ART = "crawl.article";

    @Bean TopicExchange ex() { return new TopicExchange(EX, true, false); }
    @Bean Queue qCat() { return new Queue(Q_CAT, true); }
    @Bean Queue qList(){ return new Queue(Q_LIST, true); }
    @Bean Queue qArt() { return new Queue(Q_ART, true); }

    @Bean Binding bCat(){ return BindingBuilder.bind(qCat()).to(ex()).with("cat"); }
    @Bean Binding bList(){ return BindingBuilder.bind(qList()).to(ex()).with("list"); }
    @Bean Binding bArt(){ return BindingBuilder.bind(qArt()).to(ex()).with("article"); }

    @Bean(name = "tpl")
    @Primary
    public RabbitTemplate tpl(ConnectionFactory cf,
                              Jackson2JsonMessageConverter conv) {
        var t = new RabbitTemplate(cf);
        t.setMessageConverter(conv);
        return t;
    }

    @Bean
    public AmqpAdmin amqpAdmin(ConnectionFactory cf) {
        return new RabbitAdmin(cf);
    }
}
