package com.t2404e.springagaint2404e.config;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {
    public static final String EXCHANGE = "crawl.exchange";
    public static final String ROUTING_RAW = "crawl.raw";
    public static final String QUEUE_RAW = "crawl.raw";


    @Bean
    public TopicExchange crawlExchange() { return new TopicExchange(EXCHANGE, true, false); }


    @Bean
    public Queue rawQueue() { return new Queue(QUEUE_RAW, true); }


    @Bean
    public Binding rawBinding() {
        return BindingBuilder.bind(rawQueue()).to(crawlExchange()).with(ROUTING_RAW);
    }

    // Dùng JSON converter để gửi/nhận POJO (ArticleMessage)
    @Bean
    public Jackson2JsonMessageConverter jackson2JsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory cf, Jackson2JsonMessageConverter converter) {
        RabbitTemplate tpl = new RabbitTemplate(cf);
        tpl.setMessageConverter(converter);
        return tpl;
    }
}
