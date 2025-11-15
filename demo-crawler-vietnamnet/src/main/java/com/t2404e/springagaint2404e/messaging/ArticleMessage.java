package com.t2404e.springagaint2404e.messaging;
import java.io.Serializable;
public class ArticleMessage implements Serializable {
    private String url;
    private Long sourceId; // mapping tới ArticleSource


    public ArticleMessage() {}
    public ArticleMessage(String url, Long sourceId) { this.url = url; this.sourceId = sourceId; }


    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public Long getSourceId() { return sourceId; }
    public void setSourceId(Long sourceId) { this.sourceId = sourceId; }
}
