package com.t2404e.democrawler.auth.security;

import com.t2404e.democrawler.entity.Account;
import com.t2404e.democrawler.repository.AccountRepository;
import com.t2404e.democrawler.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

// 👇 thêm import này
import io.jsonwebtoken.ExpiredJwtException;

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

        String token = null;

        // 1) Ưu tiên đọc từ header (nếu muốn giữ tương thích Postman)
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        // 2) Nếu không có header -> đọc từ cookie AUTH_TOKEN
        if (token == null && request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                if ("AUTH_TOKEN".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }

        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                String username = jwtService.extractUsername(token);

                Account admin = accountRepository.findByUsername(username).orElse(null);
                if (admin != null && jwtService.isTokenValid(token, admin)) {
                    var authorities = List.of(new SimpleGrantedAuthority("ROLE_ADMIN"));

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(admin, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }

            } catch (ExpiredJwtException ex) {
                // ✅ Token hết hạn → trả 401 + mã lỗi cho FE biết
                log.warn("JWT đã hết hạn: {}", ex.getMessage());
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"error\":\"TOKEN_EXPIRED\"}");
                return; // dừng filter chain, không đi tiếp nữa

            } catch (Exception ex) {
                // Các lỗi JWT khác: sai signature, sai format,...
                log.warn("JWT không hợp lệ: {}", ex.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }
}
