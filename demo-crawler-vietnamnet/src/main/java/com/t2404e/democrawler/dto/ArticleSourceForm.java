package com.t2404e.democrawler.dto;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data

public class ArticleSourceForm {
    @NotNull
    @Positive
    private Long categoryId;

    @NotNull
    @Positive
    private Long sourceId;

    // slug chuyên mục: chỉ chữ thường, số, dấu gạch ngang
    @NotBlank
    @Pattern(regexp = "[a-z0-9\\-]+", message = "Slug chỉ được chứa a-z, 0-9 và dấu '-'")
    private String slug;               // ex: "chinh-tri"

    @NotBlank
    private String title;

    @NotBlank
    private String description;

    @NotBlank
    private String url;

    @NotBlank
    @Size(max = 500)
    private String listingSelector;    // "a[href]"

    @NotBlank
    @Size(max = 1000)
    private String contentSelector;    // "article, .maincontent, ..."

    @NotBlank
    @Size(max = 1000)
    private String descriptionSelector;

    @NotBlank
    @Size(max = 1000)
    private String titleSelector;

    @NotBlank
    @Size(max = 1000)
    private String imageSelector;

    @Size(max = 1000)
    private String removeSelector;

    @Size(max = 500)
    private String note;

    @NotNull
    @Min(0)
    @Max(1)
    private Integer status;
}
