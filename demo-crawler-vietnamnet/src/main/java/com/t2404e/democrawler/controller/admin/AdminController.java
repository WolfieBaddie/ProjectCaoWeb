package com.t2404e.democrawler.controller.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
@RequestMapping("/admin")
public class AdminController {

    // Trang dashboard cũ (nếu bạn đang dùng)
    @GetMapping("/news")
    public String newsDashboard() {
        // view: resources/templates/admin/news-dashboard.html
        // hoặc index React cho dashboard
        return "admin/news-dashboard";
    }

    // Trang EDIT riêng
    @GetMapping("/news/edit/{id}")
    public String editArticlePage(@PathVariable Long id) {
        // view: resources/templates/admin/news-edit.html
        // hoặc cũng có thể dùng chung 1 index React, tuỳ bạn
        return "admin/news-edit";
    }
}
