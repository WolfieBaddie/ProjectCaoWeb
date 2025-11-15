package com.t2404e.springagaint2404e.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "categories")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToMany(
            mappedBy = "category",
            cascade = CascadeType.ALL, // Thao tác trên User sẽ ảnh hưởng đến các Post của nó
            orphanRemoval = true // Nếu một Dish bị xóa khỏi list này, nó sẽ bị xóa khỏi DB
    )
    @JsonManagedReference
    private List<Dish> dishes = new ArrayList<>();

    @Column(name = "name", nullable = false, unique = true, length = 100, columnDefinition = "VARCHAR(100)")
    private String name;
}
