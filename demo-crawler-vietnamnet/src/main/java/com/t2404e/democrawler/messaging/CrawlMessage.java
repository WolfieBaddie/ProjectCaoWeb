package com.t2404e.democrawler.messaging;

import java.io.Serializable;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CrawlMessage implements Serializable {
    public enum Kind { CATEGORY, LISTING, ARTICLE }

    private Kind kind;
    private String url;     // absolute URL
    private String slug;    // segment đầu tiên sau domain, vd: "chinh-tri"
    private int depth;      // để hạn độ sâu mở rộng
    private Long sourceId;  // id của ArticleSource
    private Long categoryId;

    public CrawlMessage(Kind kind, String url, String slug, int depth, Long sourceId)
    {
        this.kind = kind;
        this.url = url;
        this.slug = slug;
        this.depth = depth;
        this.sourceId = sourceId;
    }
}
