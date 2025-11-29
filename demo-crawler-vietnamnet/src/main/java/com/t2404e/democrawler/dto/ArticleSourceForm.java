package com.t2404e.democrawler.dto;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data

public class ArticleSourceForm {
    @Positive
    @NotNull(message = "Danh mục là bắt buộc")
    private Long categoryId;

    @Positive
    private Long sourceId;

    @Pattern(regexp = "[a-z0-9\\-]+", message = "Slug chỉ được chứa a-z, 0-9 và dấu '-'")
    private String slug;               // ex: "chinh-tri"

    @NotBlank
    @NotBlank(message = "Tên nguồn không được để trống")
    private String title;

    @NotBlank
    @NotBlank(message = "Mô tả không được để trống")
    private String description;

    @NotBlank(message = "URL không được để trống")
    private String url;

    @Size(max = 500)
    @NotBlank(message = "Link selector không được để trống")
    private String listingSelector;    // "a[href]"

    @Size(max = 1000)
    @NotBlank(message = "Content selector không được để trống")
    private String contentSelector;    // "article, .maincontent, ..."

    @Size(max = 1000)
    @NotBlank(message = "Description selector không được để trống")
    private String descriptionSelector;

    @Size(max = 1000)
    @NotBlank(message = "Title selector không được để trống")
    private String titleSelector;

    @Size(max = 1000)
    @NotBlank(message = "Image selector không được để trống")
    private String imageSelector;

    @Size(max = 1000)
    @NotBlank(message = "Remove selector không được để trống")
    private String removeSelector;

    // THÊM MỚI: selector lấy thời gian bài viết
    @Size(max = 1000)
    @NotBlank(message = "Time selector không được để trống")
    private String timeSelector;

    @Size(max = 500)
    private String note;

    @NotNull
    @Min(0)
    @Max(1)
    private Integer status;
}
