package com.t2404e.springagaint2404e.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "dishes")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Dish {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- Many-to-One ---
    // Dish là bên sở hữu quan hệ (chứa khóa ngoại)
    @ManyToOne(fetch = FetchType.LAZY) // LAZY: chỉ load User khi thực sự cần đến
    @JoinColumn(name = "category_id") // Tạo cột author_id trong bảng posts
    @JsonBackReference
    private Category category;

    @Column(name = "name", nullable = false, length = 150, columnDefinition = "VARCHAR(150)")
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "price", nullable = false, columnDefinition = "DECIMAL")
    private Double price;

    @Column(name = "start_date", columnDefinition = "DATETIME")
    private Date startDate;

    @Column(name = "last_modified_date", columnDefinition = "DATETIME")
    private Date lastModifiedDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false, columnDefinition = "VARCHAR(20)")
    private DishStatus status;
}
