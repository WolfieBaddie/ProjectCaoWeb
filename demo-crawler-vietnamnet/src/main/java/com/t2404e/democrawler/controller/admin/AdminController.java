package com.t2404e.democrawler.controller.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequiredArgsConstructor
@RequestMapping("/admin")
public class AdminController {

    /**
     * TẤT CẢ các route chính của admin SPA đều trả về cùng 1 view "news-dashboard"
     * trong đó sẽ mount React app, React Router sẽ render đúng component
     */

    // /admin hoặc /admin/ hoặc /admin/news
    @GetMapping({ "", "/", "/news" })
    public String newsDashboard() {
        // templates/admin/news-dashboard.html
        return "admin/news-dashboard";
    }

    // /admin/contents
    @GetMapping("/contents")
    public String contentsPage() {
        return "admin/news-dashboard";
    }

    // /admin/categories
    @GetMapping("/categories")
    public String categoriesPage() {
        return "admin/news-dashboard";
    }

    // /admin/logs
    @GetMapping("/logs")
    public String logsPage() {
        return "admin/news-dashboard";
    }

    // /admin/bots
    @GetMapping("/bots")
    public String botsPage() {
        return "admin/news-dashboard";
    }

    /**
     * Trang EDIT riêng cho bài viết, nếu ông muốn tách view khác
     */
    @GetMapping("/news/edit/{id}")
    public String editArticlePage(@PathVariable Long id) {
        // templates/admin/news-edit.html
        return "admin/news-edit";
    }
}
