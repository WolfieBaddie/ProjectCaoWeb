package com.t2404e.democrawler.dto;

public record RunSourceRequest(
        boolean includeLink,
        boolean includeContent
) {}
