package com.t2404e.springagaint2404e.controller;

import com.t2404e.springagaint2404e.entity.Category;
import com.t2404e.springagaint2404e.repository.CategoryRepository;
import com.t2404e.springagaint2404e.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(path = "api/v1/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @RequestMapping(method = RequestMethod.GET)
    public List<Category> getAll() {
        List<Category> categories = categoryService.findAll();
        return categories;
    }
}
