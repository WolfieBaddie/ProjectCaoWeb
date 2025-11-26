package com.t2404e.democrawler.controller.admin;
import com.t2404e.democrawler.common.ArticleStatus;
import com.t2404e.democrawler.dto.ArticleCategoryDto;
import com.t2404e.democrawler.dto.UpdateArticleCategoryRequest;
import com.t2404e.democrawler.entity.ArticleCategory;
import com.t2404e.democrawler.exception.ArticleOperationException;
import com.t2404e.democrawler.repository.ArticleCategoryRepository;
import com.t2404e.democrawler.repository.ArticleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/api/article-categories")
@RequiredArgsConstructor
public class AdminArticleCategoryController {

    private final ArticleCategoryRepository articleCategoryRepository;
    private final ArticleRepository articleRepository;

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

    // ====== SỬA category ======
    @PutMapping("/{id}")
    @Transactional
    public ArticleCategoryDto updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody UpdateArticleCategoryRequest request
    ) {
        ArticleCategory category = articleCategoryRepository.findById(id)
                .orElseThrow(() -> new ArticleOperationException(
                        "Danh mục không tồn tại",
                        Map.of("id", "Không tìm thấy danh mục với id = " + id)
                ));

        if (category.isDeleted()) {
            throw new ArticleOperationException(
                    "Danh mục đã bị xóa mềm",
                    Map.of("id", "Không thể sửa danh mục đã bị xóa")
            );
        }

        category.setName(request.getName().trim());

        ArticleCategory saved = articleCategoryRepository.save(category);

        return ArticleCategoryDto.builder()
                .id(saved.getId())
                .name(saved.getName())
                .build();
    }

    // ====== XÓA MỀM category + set DELETED cho tất cả article thuộc category ======
    @DeleteMapping("/{id}")
    @Transactional
    public void softDeleteCategory(@PathVariable Long id) {
        ArticleCategory category = articleCategoryRepository.findById(id)
                .orElseThrow(() -> new ArticleOperationException(
                        "Danh mục không tồn tại",
                        Map.of("id", "Không tìm thấy danh mục với id = " + id)
                ));

        if (category.isDeleted()) {
            throw new ArticleOperationException(
                    "Danh mục đã bị xóa trước đó",
                    Map.of("id", "Danh mục đã ở trạng thái deleted")
            );
        }

        // 1) Xóa mềm trên bảng article_category
        category.setDeleted(true);
        articleCategoryRepository.save(category);

        // 2) Set status DELETED cho tất cả Article có category_id = id
        articleRepository.updateStatusByCategoryId(id, ArticleStatus.DELETED);
    }
}
