package com.t2404e.democrawler.controller;

import com.t2404e.democrawler.entity.Category;
import com.t2404e.democrawler.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
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
