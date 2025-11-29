package com.t2404e.democrawler.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ArticleCategoryPageResponse {
    private List<ArticleCategoryDto> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
}
