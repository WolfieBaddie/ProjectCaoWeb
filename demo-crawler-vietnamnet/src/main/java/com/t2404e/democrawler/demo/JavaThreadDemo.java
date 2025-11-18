package com.t2404e.democrawler.demo;
import java.util.*;
import org.jsoup.*;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

public class JavaThreadDemo {
    public static void main(String[] args)
    {
        long start = System.currentTimeMillis();
        System.out.println("Starting Java Thread");

        String url = "https://vnexpress.net/thethao";
        System.out.println("Crawling: " + url);

        try
        {
            HashSet<String> links = new HashSet<>();
            Document doc = Jsoup.connect(url).get();
            Elements els = doc.select("a[href]");
            for(Element el : els)
            {
                String href = el.attr("href");
                if(href.startsWith("https://vnexpress.net")) links.add(href);
            }
            List<CrawlerThread> threads = new ArrayList<>();
            for(String link : links)
            {
                CrawlerThread crawlerThread = new CrawlerThread();
                crawlerThread.setUrl(link);
                threads.add(crawlerThread);
            }

            for(CrawlerThread thread : threads)
            {
                thread.start();
            }

            for(CrawlerThread thread : threads)
            {
                thread.join();
            }

        }catch(Exception e)
        {
            System.out.println("Error while crawling: ");
            System.err.println(e.getMessage());
        }

        long end = System.currentTimeMillis();
        System.out.println("Total: " + (end - start));
    }
}
