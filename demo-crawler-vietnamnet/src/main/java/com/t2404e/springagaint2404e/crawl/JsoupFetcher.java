package com.t2404e.springagaint2404e.crawl;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;


@Component
public class JsoupFetcher {
    public Document fetch(String url) throws Exception {
        return Jsoup.connect(url)
                .userAgent("Mozilla/5.0")
                .timeout(15000)
                .get();
    }


    public String textOrEmpty(Element el) { return el != null ? el.text() : ""; }
}
