package com.t2404e.democrawler.dto;

import com.t2404e.democrawler.common.ArticleStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DeleteArticleResponse {
    private Long id;
    private ArticleStatus status;
    private String message;
}
