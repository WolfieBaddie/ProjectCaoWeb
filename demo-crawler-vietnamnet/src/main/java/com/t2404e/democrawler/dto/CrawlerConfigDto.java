package com.t2404e.democrawler.dto;

public record CrawlerConfigDto(
        boolean linkCrawlerEnabled,
        boolean contentCrawlerEnabled
) {}
