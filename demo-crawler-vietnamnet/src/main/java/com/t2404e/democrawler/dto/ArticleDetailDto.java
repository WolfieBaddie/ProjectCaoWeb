package com.t2404e.democrawler.dto;

import com.t2404e.democrawler.common.ArticleStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ArticleDetailDto {
    private Long id;
    private String url;
    private String title;
    private String description;
    private String content;

    // metadata
    private String categoryName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime publishedAt;

    // ảnh chính của article (Article.imageUrl)
    private String imageUrl;

    // trạng thái workflow
    private ArticleStatus status;

    // danh sách ảnh chi tiết (ArticleImage)
    private List<ArticleImageDto> images;
}
