// src/main/java/com/t2404e/democrawler/config/WebCorsConfig.java
package com.t2404e.democrawler.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebCorsConfig implements WebMvcConfigurer {

    private static final String[] ALLOWED_ORIGINS = new String[] {
            "http://localhost:3000",
            "http://localhost:5173",
            "http://192.168.1.62:3000",
            "http://172.23.32.1:3000",
            "http://172.31.0.1:3000"
    };

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Admin APIs
        registry.addMapping("/admin/**")
                .allowedOrigins(ALLOWED_ORIGINS)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);

        // 🔥 Client APIs
        registry.addMapping("/client/**")
                .allowedOrigins(ALLOWED_ORIGINS)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
