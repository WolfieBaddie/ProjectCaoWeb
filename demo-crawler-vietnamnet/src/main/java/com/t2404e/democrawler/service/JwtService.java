package com.t2404e.democrawler.service;

import com.t2404e.democrawler.entity.Account;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms:3600000}") // 1h
    private long jwtExpirationMs;

    // Tạo JWT cho admin
    public String generateToken(Account admin) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setSubject(admin.getUsername())                         // 👈 dùng setSubject
                .setIssuedAt(now)                                        // 👈 dùng setIssuedAt
                .setExpiration(expiry)                                   // 👈 dùng setExpiration
                .signWith(
                        SignatureAlgorithm.HS256,
                        jwtSecret.getBytes(StandardCharsets.UTF_8)       // key ký
                )
                .compact();
    }

    // Lấy username từ token
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Hàm chung để lấy claim bất kỳ
    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = Jwts.parser()                                    // 👈 dùng parser() cũ
                .setSigningKey(jwtSecret.getBytes(StandardCharsets.UTF_8))
                .parseClaimsJws(token)
                .getBody();

        return resolver.apply(claims);
    }

    public boolean isTokenValid(String token, Account admin) {
        String username = extractUsername(token);
        return username.equals(admin.getUsername()) && !isTokenExpired(token);
    }

    public boolean isTokenExpired(String token) {
        Date expiration = extractClaim(token, Claims::getExpiration);
        return expiration.before(new Date());
    }
}
