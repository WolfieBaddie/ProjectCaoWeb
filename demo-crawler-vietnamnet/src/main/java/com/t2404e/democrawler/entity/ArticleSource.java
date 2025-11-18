package com.t2404e.democrawler.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class ArticleSource {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    @JsonBackReference
    private ArticleCategory articleCategory;

    private String title;          // nếu cần đặt tên nguồn
    private String description;

    // Listing (trang danh sách)
    private String url;           // URL listing (ví dụ 1 chuyên mục của Vietnamnet)
    private String linkSelector;  // CSS để lấy link bài chi tiết từ listing

    // Detail selectors
    private String titleSelector;
    private String descriptionSelector;
    private String contentSelector;
    private String imageSelector;

    private String removeSelector; // selector để loại ads/box-relate/script...
    private int status;

    // convenience method: gán category theo id (không tạo category mới)
    public void addCategory(Long categoryId) {
        if (categoryId == null) {
            this.articleCategory = null;
            return;
        }

        ArticleCategory category = new ArticleCategory();
        category.setId(categoryId);    // quan trọng: set id để JPA hiểu là reference
        this.articleCategory = category;
    }
}
