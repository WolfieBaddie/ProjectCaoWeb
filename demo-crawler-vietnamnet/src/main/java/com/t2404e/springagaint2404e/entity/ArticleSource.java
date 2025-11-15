package com.t2404e.springagaint2404e.entity;

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
    private String titleSelector;       // <-- sửa chính tả từ tilteSelector
    private String descriptionSelector;
    private String contentSelector;
    private String imageSelector;

    private String removeSelector; // selector để loại ads/box-relate/script...
    private int status;
}
