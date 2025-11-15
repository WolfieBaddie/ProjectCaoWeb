package com.t2404e.springagaint2404e.service;

import com.t2404e.springagaint2404e.entity.Category;
import com.t2404e.springagaint2404e.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public List<Category> findAll() {
        // bổ sung logic sau vào đây.
        return categoryRepository.findAll();
    }
}
