package com.t2404e.democrawler.auth.security;

import com.t2404e.democrawler.entity.Account;
import com.t2404e.democrawler.repository.AccountRepository;
import com.t2404e.democrawler.service.JwtService;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final AccountRepository accountRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getServletPath();

        // 1. Bỏ qua toàn bộ request KHÔNG phải /admin/**
        if (!path.startsWith("/admin/")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Bỏ qua chính /admin/login để luôn login lại được
        if ("/admin/login".equals(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = resolveToken(request);

        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                String username = jwtService.extractUsername(token);

                Account account = accountRepository
                        .findByUsername(username)
                        .orElse(null);

                if (account != null && jwtService.isTokenValid(token, account)) {
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(
                                    account,
                                    null,
                                    List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                            );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }

            } catch (ExpiredJwtException ex) {
                // Token HẾT HẠN -> trả 401 + mã lỗi rõ ràng cho frontend
                log.warn("JWT đã hết hạn: {}", ex.getMessage());
                SecurityContextHolder.clearContext();
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"error\":\"TOKEN_EXPIRED\"}");
                return; // dừng filter, không đi tiếp nữa

            } catch (Exception ex) {
                // Các lỗi JWT khác: signature sai, format lỗi...
                log.warn("JWT không hợp lệ: {}", ex.getMessage());
                // Không ghi response ở đây, để Spring Security xử lý (có thể trả 401)
            }
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        // Ưu tiên Authorization: Bearer ... (để test Postman)
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        // Nếu không có header thì lấy từ cookie AUTH_TOKEN
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if ("AUTH_TOKEN".equals(c.getName())) {
                    return c.getValue();
                }
            }
        }

        return null;
    }
}
