package com.t2404e.democrawler.dto;

import com.t2404e.democrawler.common.ArticleStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class SeedArticleRequest {

    // Giống regex bên UpdateArticleRequest:
    // Cho phép: chữ (có dấu), số, khoảng trắng, . , ; : ! ? " ' ( ) - _ /
    private static final String SAFE_TEXT_REGEX =
            "^[\\p{L}\\p{N}\\s.,;:!?\"'()\\-_/]+$";

    @NotNull(message = "Danh mục không được để trống")
    private Long categoryId;

    @NotBlank(message = "Tiêu đề không được để trống")
    @Pattern(
            regexp = SAFE_TEXT_REGEX,
            message = "Tiêu đề không được chứa ký tự đặc biệt"
    )
    private String title;

    @NotBlank(message = "Mô tả không được để trống")
    @Pattern(
            regexp = SAFE_TEXT_REGEX,
            message = "Mô tả không được chứa ký tự đặc biệt"
    )
    private String description;

    @NotBlank(message = "Nội dung không được để trống")
    @Pattern(
            regexp = SAFE_TEXT_REGEX,
            message = "Nội dung không được chứa ký tự đặc biệt"
    )
    private String content;

    // URL: bắt buộc có nhưng KHÔNG chặn ký tự đặc biệt vì URL vốn cần nhiều ký tự
    @NotBlank(message = "URL không được để trống")
    private String url;

    // Có thể bỏ trống, nên không validate ký tự đặc biệt
    private String imageUrl;

    // Nếu không truyền thì ở Service sẽ default sang DRAFT
    private ArticleStatus status;
}
