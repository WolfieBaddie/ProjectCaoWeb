package com.t2404e.democrawler.exception;
import lombok.Getter;

import java.util.Collections;
import java.util.Map;

@Getter
public class ArticleOperationException extends RuntimeException{
    // lỗi theo field, để UI map nếu muốn
    private final Map<String, String> errors;

    public ArticleOperationException(String message) {
        super(message);
        this.errors = Collections.emptyMap();
    }

    public ArticleOperationException(String message, Map<String, String> errors) {
        super(message);
        this.errors = (errors != null) ? errors : Collections.emptyMap();
    }
}
