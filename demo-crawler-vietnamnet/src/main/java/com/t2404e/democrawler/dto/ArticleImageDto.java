package com.t2404e.democrawler.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ArticleImageDto {
    private Long id;
    private String url;
    private String alt;
    private String caption;
    private String thumbSmall;
    private String thumb;
    private Integer sortOrder;
}
