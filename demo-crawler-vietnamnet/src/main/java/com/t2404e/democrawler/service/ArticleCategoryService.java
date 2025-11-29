package com.t2404e.democrawler.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.t2404e.democrawler.common.ArticleStatus;
import com.t2404e.democrawler.dto.ArticleCategoryDto;
import com.t2404e.democrawler.dto.ArticleCategoryPageResponse;
import com.t2404e.democrawler.entity.ArticleCategory;
import com.t2404e.democrawler.repository.ArticleCategoryRepository;
import com.t2404e.democrawler.repository.ArticleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class ArticleCategoryService {

    private final ArticleCategoryRepository articleCategoryRepository;
    private final ArticleRepository articleRepository;
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    private String buildCacheKey(String keyword, int page, int size) {
        String kw = (keyword == null ? "" : keyword.trim().toLowerCase());
        return "admin:articleCategories:kw=" + kw + ":p=" + page + ":s=" + size;
    }

    public ArticleCategoryPageResponse searchCategories(String keyword, int page, int size) {
        String normalizedKeyword = (keyword == null) ? "" : keyword.trim().toLowerCase();
        String cacheKey = buildCacheKey(normalizedKeyword, page, size);

        // 1. Thử đọc từ cache Redis
        try {
            String cachedJson = stringRedisTemplate.opsForValue().get(cacheKey);
            if (cachedJson != null) {
                return objectMapper.readValue(cachedJson, ArticleCategoryPageResponse.class);
            }
        } catch (Exception e) {
            log.warn("Không đọc được cache category: {}", e.getMessage());
        }

        // 2. Query DB
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "name"));
        Page<ArticleCategory> categoryPage =
                articleCategoryRepository.searchByName(
                        StringUtils.hasText(normalizedKeyword) ? normalizedKeyword : "",
                        pageable
                );

        List<ArticleCategoryDto> dtos = categoryPage.getContent().stream()
                .map(cat -> {
                    long cnt = articleRepository
                            .countByArticleCategoryIdAndStatusNot(cat.getId(), ArticleStatus.DELETED);

                    return ArticleCategoryDto.builder()
                            .id(cat.getId())
                            .name(cat.getName())
                            .articleCount(cnt)
                            .build();
                })
                .toList();

        ArticleCategoryPageResponse response = ArticleCategoryPageResponse.builder()
                .content(dtos)
                .page(categoryPage.getNumber())
                .size(categoryPage.getSize())
                .totalElements(categoryPage.getTotalElements())
                .totalPages(categoryPage.getTotalPages())
                .build();

        // 3. Ghi cache Redis
        try {
            String json = objectMapper.writeValueAsString(response);
            stringRedisTemplate.opsForValue()
                    .set(cacheKey, json, Duration.ofMinutes(5));
        } catch (Exception e) {
            log.warn("Không ghi được cache category: {}", e.getMessage());
        }

        return response;
    }

    /**
     * Gọi khi create/update/delete category hoặc khi xóa mềm category.
     */
    public void clearCategoryCache() {
        try {
            Set<String> keys = stringRedisTemplate.keys("admin:articleCategories:*");
            if (keys != null && !keys.isEmpty()) {
                stringRedisTemplate.delete(keys);
            }
        } catch (Exception e) {
            log.warn("Không xóa được cache category: {}", e.getMessage());
        }
    }
}
