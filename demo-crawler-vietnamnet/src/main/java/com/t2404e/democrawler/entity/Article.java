package com.t2404e.democrawler.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Article {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String url;
    @ManyToOne(fetch = FetchType.LAZY) // LAZY: chỉ load User khi thực sự cần đến
    @JoinColumn(name = "category_id") // Tạo cột author_id trong bảng posts
    @JsonBackReference
    private ArticleCategory articleCategory;
    private String title;
    private String description;
    @Column(columnDefinition = "TEXT")
    private String content;
    // Ảnh chính (ảnh đầu tiên)
    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @Column(name = "is_crawled")
    private boolean isCrawled;
    private int status;

    @OneToMany(mappedBy = "article", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ArticleImage> images = new java.util.ArrayList<>();

}
