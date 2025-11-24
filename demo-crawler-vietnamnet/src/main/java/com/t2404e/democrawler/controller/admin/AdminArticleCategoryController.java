package com.t2404e.democrawler.controller.admin;

import com.t2404e.democrawler.dto.ArticleCategoryDto;
import com.t2404e.democrawler.entity.ArticleCategory;
import com.t2404e.democrawler.repository.ArticleCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin/api/article-categories")
@RequiredArgsConstructor
public class AdminArticleCategoryController {

    private final ArticleCategoryRepository articleCategoryRepository;

    @GetMapping
    public List<ArticleCategoryDto> getAllCategories() {
        List<ArticleCategory> categories =
                articleCategoryRepository.findAll(Sort.by(Sort.Direction.ASC, "name"));

        return categories.stream()
                .map(cat -> ArticleCategoryDto.builder()
                        .id(cat.getId())
                        .name(cat.getName())
                        .build())
                .toList();
    }
}
