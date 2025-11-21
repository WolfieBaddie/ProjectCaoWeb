package com.t2404e.democrawler.dto;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor

public class ImageInfo {
    private String url;
    private String alt;
    private String caption;
    private String thumbSmall;
    private String thumb;
}
