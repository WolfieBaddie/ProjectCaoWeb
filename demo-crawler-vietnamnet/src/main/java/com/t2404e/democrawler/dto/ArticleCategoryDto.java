package com.t2404e.democrawler.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ArticleCategoryDto {
    private Long id;
    private String name;
    private long articleCount; // số bài thuộc category này (optional)
}
