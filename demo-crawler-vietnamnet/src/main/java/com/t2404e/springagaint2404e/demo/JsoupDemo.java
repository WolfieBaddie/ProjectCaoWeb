package com.t2404e.springagaint2404e.demo;

import com.t2404e.springagaint2404e.entity.Article;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.io.IOException;
import java.util.Calendar;
import java.util.HashMap;
import java.util.HashSet;

public class JsoupDemo {
    public static void main(String[] args) {
        long startTime = Calendar.getInstance().getTimeInMillis();
        String url = "https://vnexpress.net/the-thao ";
        System.out.println("Crawling url: " + url);
        try {
            HashSet<String> links = new HashSet<>();
            Document document = Jsoup.connect(url).get();
            Elements els = document.select("a[href]");
            for (Element el : els) {
                String href = el.attr("href");
                if (href.startsWith("https://vnexpress.net/")) {
                    links.add(href);
                }
            }
            for (String link : links) {
                System.out.println(link);
            }
            System.out.println(links.size());
            long endTime = Calendar.getInstance().getTimeInMillis();
            long prossTime = endTime - startTime;
            System.out.println("Processing time: " + prossTime + " mls");
        } catch (Exception e) {
            System.out.println("Error when fetching data");
            System.err.println(e.getMessage());
        }
    }
}
