package com.t2404e.democrawler.controller.client;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ClientController {
    /**
     * Cửa client:
     *  - "/"             -> trang chủ
     *  - "/article/{id}" -> chi tiết bài
     *  - "/search"       -> trang tìm kiếm (query ?q=... để FE đọc)
     *
     * Tất cả cùng trả về 1 view HTML, trong đó mount React client (Client.tsx).
     */
    @GetMapping({"/", "/article/{id}", "/search"})
    public String clientEntry() {
        // Nếu template client của bạn tên là "client/index.html" trong resources/templates:
        return "client/index";

        // Nếu hiện tại bạn đang dùng chung template "admin/news-dashboard.html"
        // cho cả admin + client thì trả về:
        // return "admin/news-dashboard";
    }
}
