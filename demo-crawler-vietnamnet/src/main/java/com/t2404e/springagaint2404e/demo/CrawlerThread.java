package com.t2404e.springagaint2404e.demo;
import lombok.*;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;

import java.io.IOException;

@Getter
@Setter
public class CrawlerThread extends Thread{
    private String url;

    @Override
    public void run()
    {
        try
        {
            Document d = Jsoup.connect(url).get();
            String title = d.select("h1.title-detail").text();
            String description = d.select("p.description").html();
            String imageUrl = d.select("figure picture img").attr("src");
            String content = d.select("article.fck_detail").html();

        }
        catch(IOException e)
        {
            throw new RuntimeException(e);
        }
    }

}
