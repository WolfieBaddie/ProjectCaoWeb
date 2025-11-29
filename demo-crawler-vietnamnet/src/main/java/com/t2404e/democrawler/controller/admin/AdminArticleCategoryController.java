package com.t2404e.democrawler.controller.admin;

import com.t2404e.democrawler.common.ArticleStatus;
import com.t2404e.democrawler.dto.ArticleCategoryDto;
import com.t2404e.democrawler.dto.ArticleCategoryPageResponse;
import com.t2404e.democrawler.dto.UpdateArticleCategoryRequest;
import com.t2404e.democrawler.entity.ArticleCategory;
import com.t2404e.democrawler.exception.ArticleOperationException;
import com.t2404e.democrawler.repository.ArticleCategoryRepository;
import com.t2404e.democrawler.repository.ArticleRepository;
import com.t2404e.democrawler.service.ArticleCategoryService;
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
    private final ArticleCategoryService articleCategoryService;

    // ====== LIST full (không phân trang, nếu vẫn muốn giữ) ======
    @GetMapping
    public List<ArticleCategoryDto> getAllCategories() {
        return articleCategoryRepository
                .findByDeletedFalse(Sort.by(Sort.Direction.ASC, "name"))
                .stream()
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
    }

    // ====== LIST phân trang + search theo tên ======
    @GetMapping("/paging")
    public ArticleCategoryPageResponse searchCategories(
            @RequestParam(name = "keyword", required = false, defaultValue = "") String keyword,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "10") int size
    ) {
        return articleCategoryService.searchCategories(keyword, page, size);
    }

    // ====== UPDATE category ======
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

        // Clear cache vì dữ liệu danh mục đã thay đổi
        articleCategoryService.clearCategoryCache();

        long cnt = articleRepository
                .countByArticleCategoryIdAndStatusNot(saved.getId(), ArticleStatus.DELETED);

        return ArticleCategoryDto.builder()
                .id(saved.getId())
                .name(saved.getName())
                .articleCount(cnt)
                .build();
    }

    // ====== SOFT DELETE category ======
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

        category.setDeleted(true);
        articleCategoryRepository.save(category);

        // Set DELETED cho toàn bộ article thuộc category này
        articleRepository.updateStatusByCategoryId(id, ArticleStatus.DELETED);

        // Xóa cache
        articleCategoryService.clearCategoryCache();
    }
}
