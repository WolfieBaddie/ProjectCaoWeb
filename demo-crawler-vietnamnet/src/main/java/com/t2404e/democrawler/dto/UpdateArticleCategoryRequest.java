package com.t2404e.democrawler.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateArticleCategoryRequest {
    // Cho phép: chữ (có dấu), số, khoảng trắng, . , ; : ! ? " ' ( ) - _ /
    private static final String SAFE_TEXT_REGEX =
            "^[\\p{L}\\p{N}\\s.,;:!?\"'()\\-_/]+$";

    @NotBlank(message = "Tên danh mục không được để trống")
    @Pattern(
            regexp = SAFE_TEXT_REGEX,
            message = "Tên danh mục không được chứa ký tự đặc biệt"
    )
    private String name;
}
