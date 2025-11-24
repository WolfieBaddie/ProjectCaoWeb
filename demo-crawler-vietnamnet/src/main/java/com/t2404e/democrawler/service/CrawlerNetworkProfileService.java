package com.t2404e.democrawler.service;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
public class CrawlerNetworkProfileService {

    private final List<String> userAgents = new CopyOnWriteArrayList<>();
    private final List<String> fakeIps    = new CopyOnWriteArrayList<>();
    private final List<ProxyConfig> proxies = new CopyOnWriteArrayList<>();

    private final AtomicInteger uaIdx  = new AtomicInteger(0);
    private final AtomicInteger ipIdx  = new AtomicInteger(0);
    private final AtomicInteger prxIdx = new AtomicInteger(0);

    private final Random random = new Random();

    // ----- cấu hình file path -----
    @Value("${crawler.network.user-agent-file:}")
    private String userAgentFilePath;

    @Value("${crawler.network.ip-file:}")
    private String ipFilePath;

    @Value("${crawler.network.proxy-file:}")
    private String proxyFilePath;

    // ----- cấu hình inline (từ env / properties) -----
    @Value("${crawler.network.user-agents-inline:}")
    private String userAgentsInline;     // ví dụ "UA1|UA2|UA3"

    @Value("${crawler.network.fake-ips-inline:}")
    private String fakeIpsInline;        // ví dụ "1.1.1.1,2.2.2.2"

    @PostConstruct
    public void init() {
        // 1) Load từ inline trước
        loadUserAgentsInline();
        loadFakeIpsInline();

        // 2) Load thêm từ file nếu có
        loadUserAgentsFromFile();
        loadFakeIpsFromFile();
        loadProxiesFromFile();

        // 3) Fallback default nếu vẫn trống UA
        if (userAgents.isEmpty()) {
            userAgents.addAll(defaultUserAgents());
            log.warn("User-Agent list is empty, using in-code defaults");
        }

        log.info("Network profile init: UA={}, IPs={}, proxies={}",
                userAgents.size(), fakeIps.size(), proxies.size());
    }

    private void loadUserAgentsInline() {
        if (userAgentsInline == null || userAgentsInline.isBlank()) return;
        Arrays.stream(userAgentsInline.split("[|;,]"))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .forEach(userAgents::add);
        log.info("Loaded {} inline user agents", userAgents.size());
    }

    private void loadFakeIpsInline() {
        if (fakeIpsInline == null || fakeIpsInline.isBlank()) return;
        Arrays.stream(fakeIpsInline.split("[|;,]"))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .forEach(fakeIps::add);
        log.info("Loaded {} inline fake IPs", fakeIps.size());
    }

    private void loadUserAgentsFromFile() {
        log.info("Working dir = {}", new java.io.File(".").getAbsolutePath());
        if (userAgentFilePath == null || userAgentFilePath.isBlank()) return;
        userAgents.addAll(loadLines(userAgentFilePath));
        log.info("Loaded {} user agents from file {}", userAgents.size(), userAgentFilePath);
    }

    private void loadFakeIpsFromFile() {
        log.info("Working dir = {}", new java.io.File(".").getAbsolutePath());
        if (ipFilePath == null || ipFilePath.isBlank()) return;
        fakeIps.addAll(loadLines(ipFilePath));
        log.info("Loaded {} fake IPs from file {}", fakeIps.size(), ipFilePath);
    }

    private void loadProxiesFromFile() {
        if (proxyFilePath == null || proxyFilePath.isBlank()) return;
        List<String> lines = loadLines(proxyFilePath);
        for (String line : lines) {
            String[] parts = line.split(":");
            if (parts.length < 2) continue;
            String host = parts[0].trim();
            int port;
            try {
                port = Integer.parseInt(parts[1].trim());
            } catch (NumberFormatException e) {
                log.warn("Invalid proxy port in line: {}", line);
                continue;
            }
            String username = parts.length >= 3 ? parts[2].trim() : null;
            String password = parts.length >= 4 ? parts[3].trim() : null;
            proxies.add(new ProxyConfig(host, port, username, password));
        }
        log.info("Loaded {} proxies from file {}", proxies.size(), proxyFilePath);
    }

    private List<String> loadLines(String filePath) {
        try {
            return Files.readAllLines(Path.of(filePath), StandardCharsets.UTF_8).stream()
                    .map(String::trim)
                    .filter(s -> !s.isBlank() && !s.startsWith("#"))
                    .toList();
        } catch (IOException e) {
            log.error("Failed to load file {}: {}", filePath, e.getMessage());
            return Collections.emptyList();
        }
    }

    private List<String> defaultUserAgents() {
        return List.of(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
                "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0"
        );
    }

    // ===== API dùng trong crawler =====

    public String nextUserAgent() {
        if (userAgents.isEmpty()) {
            List<String> defaults = defaultUserAgents();
            return defaults.get(random.nextInt(defaults.size()));
        }
        int idx = Math.abs(uaIdx.getAndIncrement() % userAgents.size());
        return userAgents.get(idx);
    }

    public String nextFakeIp() {
        if (!fakeIps.isEmpty()) {
            int idx = Math.abs(ipIdx.getAndIncrement() % fakeIps.size());
            return fakeIps.get(idx);
        }
        int a = random.nextInt(223) + 1;
        int b = random.nextInt(255);
        int c = random.nextInt(255);
        int d = random.nextInt(255);
        return a + "." + b + "." + c + "." + d;
    }

    public ProxyConfig nextProxy() {
        if (proxies.isEmpty()) return null;
        int idx = Math.abs(prxIdx.getAndIncrement() % proxies.size());
        return proxies.get(idx);
    }

    // ===== API cho "dữ liệu truyền vào" (DB / UI) =====

    /** Ghi đè toàn bộ danh sách UA hiện tại bằng list mới */
    public void overwriteUserAgents(List<String> uas) {
        userAgents.clear();
        if (uas != null) {
            uas.stream()
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .forEach(userAgents::add);
        }
        uaIdx.set(0);
        log.info("Overwrote user agents list, size={}", userAgents.size());
    }

    /** Ghi đè toàn bộ fake IP hiện tại bằng list mới */
    public void overwriteFakeIps(List<String> ips) {
        fakeIps.clear();
        if (ips != null) {
            ips.stream()
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .forEach(fakeIps::add);
        }
        ipIdx.set(0);
        log.info("Overwrote fake IPs list, size={}", fakeIps.size());
    }

    @Getter
    public static class ProxyConfig {
        private final String host;
        private final int port;
        private final String username;
        private final String password;
        public ProxyConfig(String host, int port, String username, String password) {
            this.host = host;
            this.port = port;
            this.username = username;
            this.password = password;
        }
        public boolean hasAuth() {
            return username != null && !username.isBlank();
        }
    }
}
