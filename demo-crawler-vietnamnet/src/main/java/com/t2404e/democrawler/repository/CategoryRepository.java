package com.t2404e.democrawler.repository;

import com.t2404e.democrawler.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
}
