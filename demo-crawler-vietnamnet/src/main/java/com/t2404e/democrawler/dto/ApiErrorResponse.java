package com.t2404e.democrawler.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Map;

@Data
@AllArgsConstructor
public class ApiErrorResponse {
    // Message chung (dùng để hiện toast/snackbar)
    private String message;

    // Lỗi theo từng field: "title" -> "Tiêu đề không được để trống"
    private Map<String, String> errors;
}
