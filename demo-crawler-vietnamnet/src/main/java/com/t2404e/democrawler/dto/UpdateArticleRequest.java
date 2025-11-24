package com.t2404e.democrawler.dto;
import com.t2404e.democrawler.common.ArticleStatus;
import lombok.Data;
@Data
public class UpdateArticleRequest {
    private String title;
    private String description;
    private String content;
    private String imageUrl;
    private ArticleStatus status;
}
