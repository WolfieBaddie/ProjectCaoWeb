package com.t2404e.springagaint2404e.messaging;

import java.io.Serializable;

public class CrawlTask implements Serializable {
    public enum Kind { CATEGORY, LISTING, ARTICLE }

    private Kind kind;
    private String url;     // absolute URL
    private String slug;    // segment đầu tiên sau domain, vd: "chinh-tri"
    private int depth;      // để hạn độ sâu mở rộng
    private Long sourceId;  // id của ArticleSource

    public CrawlTask() {}

    public CrawlTask(Kind kind, String url, String slug, int depth, Long sourceId) {
        this.kind = kind; this.url = url; this.slug = slug; this.depth = depth; this.sourceId = sourceId;
    }

    public Kind getKind() { return kind; }
    public void setKind(Kind kind) { this.kind = kind; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public int getDepth() { return depth; }
    public void setDepth(int depth) { this.depth = depth; }
    public Long getSourceId() { return sourceId; }
    public void setSourceId(Long sourceId) { this.sourceId = sourceId; }
}
