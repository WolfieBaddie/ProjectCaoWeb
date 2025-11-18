package com.t2404e.democrawler.controller;

import com.t2404e.democrawler.entity.Article;
import com.t2404e.democrawler.repository.ArticleRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping(path = "api/v1/demo")
public class DemoController {

    @Autowired
    private ArticleRepository articleRepository;

    @RequestMapping(method = RequestMethod.GET)
    public String getAll(@RequestParam(name = "url") String url) {
        try {
            Document document = Jsoup.connect(url).get();
            String title = document.getElementsByTag("h1").first().text();
            String description = document.getElementsByClass("description").first().text();
            Element e = document.select("picture img").first();
            String imageUrl = e.attr("data-src");
            Elements elementContent = document.select("article.fck_detail");
            elementContent.select(".width-detail-photo").remove();
            elementContent.select(".banner-ads").remove();
            elementContent.select(".btn_guicauhoi_detail").remove();
            String contentHtml = elementContent.html();
            Article article = new Article();
            article.setUrl(url);
            article.setTitle(title);
            article.setDescription(description);
            article.setImageUrl(imageUrl);
            article.setContent(contentHtml);
            articleRepository.save(article);
        } catch (IOException e) {
            System.out.println("Error when fetching data");
            System.err.println(e.getMessage());
        }
        return "OK";
    }
}