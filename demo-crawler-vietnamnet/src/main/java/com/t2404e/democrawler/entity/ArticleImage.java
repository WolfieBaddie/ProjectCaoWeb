package com.t2404e.democrawler.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "article_image")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArticleImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nhiều ảnh thuộc về 1 bài viết
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "article_id", nullable = false)
    private Article article;

    @Column(nullable = false, length = 1000)
    private String url;          // ảnh full (data-original / src / og:image)

    @Column(length = 500)
    private String alt;          // thuộc tính alt của <img>

    @Column(length = 1000)
    private String caption;      // text trong <figcaption>

    @Column(name = "thumb_small", length = 1000)
    private String thumbSmall;   // data-thumb-small-src

    @Column(name = "thumb", length = 1000)
    private String thumb;        // data-thumb-src

    @Column(name = "sort_order")
    private Integer sortOrder;   // thứ tự xuất hiện trong bài
}
