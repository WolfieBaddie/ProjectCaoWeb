package com.t2404e.democrawler.dto;

import com.t2404e.democrawler.entity.ArticleSource;

public record ArticleSourceSummaryDto(
        Long id,
        String name,
        String baseUrl,
        String defaultCategorySlug,
        boolean active,

        Long categoryId,
        String linkSelector,
        String titleSelector,
        String descriptionSelector,
        String contentSelector,
        String imageSelector,
        String timeSelector,
        String removeSelector
) {
    public static ArticleSourceSummaryDto fromEntity(ArticleSource src) {
        return new ArticleSourceSummaryDto(
                src.getId(),
                src.getTitle(),
                src.getUrl(),
                src.getArticleCategory() != null ? src.getArticleCategory().getName() : null,
                src.getStatus() == 1,

                src.getArticleCategory() != null ? src.getArticleCategory().getId() : null,
                src.getLinkSelector(),
                src.getTitleSelector(),
                src.getDescriptionSelector(),
                src.getContentSelector(),
                src.getImageSelector(),
                src.getTimeSelector(),
                src.getRemoveSelector()
        );
    }
}

