package com.t2404e.democrawler.dto;

import com.t2404e.democrawler.common.ArticleStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO dùng cho phần Latest Fetched News / list bài viết ở dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArticleListItemDto {
    private Long id;
    private String url;
    private String title;
    private String description;
    private String imageUrl;

    private boolean crawled;
    private ArticleStatus status;

    // hiển thị tên category cho tiện
    private String categoryName;
}
