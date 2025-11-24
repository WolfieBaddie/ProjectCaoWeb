package com.t2404e.democrawler.util;

import com.t2404e.democrawler.dto.ImageInfo;
import com.t2404e.democrawler.service.CrawlerNetworkProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class CrawlHelper {

    private final CrawlerNetworkProfileService networkProfileService;

    // ====== Common helpers ======

    public String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v;
            }
        }
        return null;
    }

    // ====== Fetch HTML ======

    public Document fetch(String url) {
        String ua = networkProfileService.nextUserAgent();
        String ip = networkProfileService.nextFakeIp();
        CrawlerNetworkProfileService.ProxyConfig proxy = networkProfileService.nextProxy();

        // Log profile được chọn cho URL này
        log.info("[PROFILE] url={} ua={} ip={} proxy={}",
                url,
                ua,
                ip,
                proxy != null ? proxy.getHost() + ":" + proxy.getPort() : "none"
        );

        int maxRetries = 3;
        IOException lastEx = null;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                log.info("[FETCH] attempt {}/{} for url={}", attempt, maxRetries, url);

                Connection conn = Jsoup.connect(url)
                        .userAgent(ua)
                        .timeout(15_000)
                        .header("X-Forwarded-For", ip)
                        .header("X-Real-IP", ip)
                        .header("Client-IP", ip)
                        .header("Accept-Language", "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7")
                        .ignoreContentType(true)
                        .ignoreHttpErrors(true);

                // Nếu có proxy cấu hình thì dùng
                if (proxy != null) {
                    conn.proxy(proxy.getHost(), proxy.getPort());

                    if (proxy.hasAuth()) {
                        String creds = proxy.getUsername() + ":" + proxy.getPassword();
                        String encoded = Base64.getEncoder()
                                .encodeToString(creds.getBytes(StandardCharsets.UTF_8));
                        conn.header("Proxy-Authorization", "Basic " + encoded);
                    }
                }

                Document doc = conn.get();

                log.info("[FETCH] SUCCESS attempt {}/{} for url={} ua={} ip={} proxy={}",
                        attempt, maxRetries, url, ua, ip,
                        proxy != null ? proxy.getHost() + ":" + proxy.getPort() : "none"
                );

                return doc;
            } catch (IOException e) {
                lastEx = e;
                log.warn("[FETCH] FAILED attempt {}/{} for url={} ua={} ip={} proxy={} - {}",
                        attempt, maxRetries, url, ua, ip,
                        proxy != null ? proxy.getHost() + ":" + proxy.getPort() : "none",
                        e.getMessage()
                );
            }
        }

        throw new RuntimeException("Fetch failed after " + maxRetries + " attempts for url=" + url, lastEx);
    }

    // ====== Extract images ======

    public List<ImageInfo> extractImages(Document doc, String imageSelectorFromDb) {
        // Dùng LinkedHashMap để:
        // - Duy trì thứ tự
        // - Dedupe theo URL
        Map<String, ImageInfo> imagesByUrl = new LinkedHashMap<>();

        int sortOrder = 0;

        // 1) Tầng 1: selector từ DB (ưu tiên)
        if (imageSelectorFromDb != null && !imageSelectorFromDb.isBlank()) {
            Elements els = doc.select(imageSelectorFromDb);
            sortOrder = addImagesFromElements(els, imagesByUrl, sortOrder);
        }

        // 2) Tầng 2: chuẩn Vietnamnet cho figure ảnh
        if (imagesByUrl.isEmpty()) {
            Elements figures = doc.select(
                    "figure.image.vnn-content-image," +
                            "figure.vnn-content-image," +
                            "figure.image"
            );
            sortOrder = addImagesFromElements(figures, imagesByUrl, sortOrder);
        }

        // 3) Tầng 3: ảnh trong khu vực nội dung chính
        if (imagesByUrl.isEmpty()) {
            Elements bodyImgs = doc.select(
                    "article img," +
                            ".maincontent img," +
                            ".content-detail img," +
                            ".content_fck img"
            );
            sortOrder = addImagesFromElements(bodyImgs, imagesByUrl, sortOrder);
        }

        // 4) Tầng 4: fallback meta og:image (luôn thử, nhưng không overwrite URL đã có)
        Element og = doc.selectFirst("meta[property=og:image]");
        if (og != null) {
            String url = firstNonBlank(
                    og.absUrl("content"),
                    og.attr("content")
            );
            if (url != null && !url.isBlank()) {
                url = canonical(url);
                if (!imagesByUrl.containsKey(url)) {
                    imagesByUrl.put(url, new ImageInfo(url, null, null, null, null));
                }
            }
        }

        return new ArrayList<>(imagesByUrl.values());
    }

    // ====== URL / HTML helpers (bê từ chỗ cũ sang) ======

    public boolean isSameHost(String url) {
        try {
            return "vietnamnet.vn".equalsIgnoreCase(java.net.URI.create(url).getHost());
        } catch (Exception e) {
            return false;
        }
    }

    public Element choose(Document doc, String prefer, String fallback) {
        if (prefer != null && !prefer.isBlank()) {
            Element el = doc.selectFirst(prefer);
            if (el != null) return el;
        }
        return doc.selectFirst(fallback);
    }

    public String text(Element el) {
        return el != null ? el.text() : "";
    }

    public String canonical(String raw) {
        try {
            var u = java.net.URI.create(raw);
            return new java.net.URI(
                    u.getScheme(),
                    u.getAuthority(),
                    u.getPath(),
                    null,
                    null
            ).toString();
        } catch (Exception e) {
            return "";
        }
    }

    public String slugOf(String absUrl) {
        try {
            var p = java.net.URI.create(absUrl).getPath();
            if (p == null) return null;
            String[] parts = java.util.Arrays.stream(p.split("/"))
                    .filter(s -> !s.isBlank())
                    .toArray(String[]::new);
            return parts.length == 0 ? null : parts[0];    // "chinh-tri"
        } catch (Exception e) {
            return null;
        }
    }

    public boolean isArticle(String url) {
        if (url == null) return false;
        // canonical() đã bỏ query/fragment rồi nên chỉ cần .html là đủ
        return url.matches("https?://[^/]+/[^\\s]+-\\d+\\.html$");
    }

    public String sha1(String s) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] d = md.digest(s.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : d) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception ex) {
            return Integer.toHexString(s.hashCode());
        }
    }

    private int addImagesFromElements(Elements elements,
                                      Map<String, ImageInfo> imagesByUrl,
                                      int sortOrderStart) {
        int order = sortOrderStart;

        for (Element el : elements) {
            Element img = el;
            Element figure = null;

            // Nếu el không phải img (thường là figure) → tìm img bên trong
            if (!"img".equalsIgnoreCase(el.tagName())) {
                figure = el;
                img = el.selectFirst("img");
                if (img == null) continue;
            } else {
                // el là img → thử tìm figure cha để lấy caption
                figure = el.parent();
                while (figure != null && !"figure".equalsIgnoreCase(figure.tagName())) {
                    figure = figure.parent();
                }
            }

            // Lấy URL từ các attribute quen thuộc của Vietnamnet
            String url = firstNonBlank(
                    img.absUrl("data-original"),
                    img.absUrl("data-src"),
                    img.absUrl("data-srcset"),
                    img.absUrl("src"),
                    img.attr("data-original"),
                    img.attr("src")
            );
            if (url == null || url.isBlank()) continue;

            url = canonical(url);

            // Bỏ qua ảnh rác: gif, sprite, icon nhỏ
            String lower = url.toLowerCase();
            if (lower.endsWith(".gif")
                    || lower.contains("sprite")
                    || lower.contains("icon")
                    || lower.contains("logo")) {
                continue;
            }

            // Nếu có width/height và quá nhỏ thì skip (tracking pixel, spacer)
            try {
                int w = img.hasAttr("width") ? Integer.parseInt(img.attr("width")) : -1;
                int h = img.hasAttr("height") ? Integer.parseInt(img.attr("height")) : -1;
                if (w > 0 && h > 0 && (w < 50 || h < 50)) {
                    continue;
                }
            } catch (NumberFormatException ignore) {
                // nếu width/height không parse được thì kệ
            }

            // Dedupe theo URL
            if (imagesByUrl.containsKey(url)) {
                continue;
            }

            String alt        = img.attr("alt");
            String thumbSmall = img.absUrl("data-thumb-small-src");
            String thumb      = img.absUrl("data-thumb-src");

            String caption = null;
            if (figure != null) {
                Element capEl = figure.selectFirst("figcaption");
                if (capEl != null) {
                    caption = capEl.text();
                }
            }

            ImageInfo info = new ImageInfo(url, alt, caption, thumbSmall, thumb);
            imagesByUrl.put(url, info);
            order++;
        }

        return order;
    }

    public LocalDateTime parseVietnamnetTime(String raw) {
        if (raw == null) return null;
        raw = raw.trim();
        if (raw.isEmpty()) return null;

        try {
            // Tách bỏ phần "Thứ Hai," nếu có
            String[] parts = raw.split(",", 2);
            String datePart = parts.length == 2 ? parts[1].trim() : raw;

            // "24/11/2025 - 16:47" -> "24/11/2025 16:47"
            datePart = datePart.replace(" - ", " ").trim();

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            return LocalDateTime.parse(datePart, formatter);
        } catch (DateTimeParseException e) {
            // Không parse được thì log + trả null, không sập app
            log.warn("Không parse được publish time: '{}'", raw, e);
            return null;
        }
    }
}
