package com.t2404e.democrawler.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.t2404e.democrawler.common.ArticleStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.time.LocalDateTime;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    @JsonBackReference
    private ArticleCategory articleCategory;

    private String title;

    private String description;

    @Column(columnDefinition = "LONGTEXT")
    private String content;

    // Thời điểm bài viết được đăng trên trang gốc (VD: Vietnamnet)
    @Column(name = "created_at")
    private LocalDateTime created_at;

    @Column(name = "updated_at")
    private LocalDateTime updated_at;

    @Column(name = "published_at")
    private LocalDateTime published_at;

    // Ảnh chính (ảnh đầu tiên)
    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @Column(name = "is_crawled")
    private boolean isCrawled;

    //Lưu enum dưới dạng STRING trong DB
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50, nullable = false)
    private ArticleStatus status;

    @OneToMany(mappedBy = "article", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ArticleImage> images = new java.util.ArrayList<>();
}
