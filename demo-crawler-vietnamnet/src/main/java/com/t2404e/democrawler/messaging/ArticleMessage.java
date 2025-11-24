package com.t2404e.democrawler.messaging;
import java.io.Serializable;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ArticleMessage implements Serializable {
    private String url;
    private Long sourceId; // mapping tới ArticleSource
    private Long categoryId;
    private String titleSelector;
    private String descriptionSelector;
    private String contentSelector;
    private String imageSelector;

}
