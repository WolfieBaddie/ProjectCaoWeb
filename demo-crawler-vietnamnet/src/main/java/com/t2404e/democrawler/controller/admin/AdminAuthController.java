package com.t2404e.democrawler.controller.admin;
import com.t2404e.democrawler.dto.AccountAuthResponse;
import com.t2404e.democrawler.dto.AccountLoginRequest;
import com.t2404e.democrawler.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AccountAuthResponse> login(
            @Valid @RequestBody AccountLoginRequest request,
            HttpServletResponse response
    ) {
        // Gọi service sinh JWT
        AccountAuthResponse auth = authService.login(request);

        // Set cookie AUTH_TOKEN cho JwtAuthenticationFilter đọc
        ResponseCookie cookie = ResponseCookie.from("AUTH_TOKEN", auth.getAccessToken())
                .path("/")               // để /admin/** đều dùng được
                .httpOnly(true)
                .secure(false)           // true nếu chạy HTTPS
                .sameSite("None")
                .maxAge(Duration.ofHours(4))
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        // Vẫn trả về body để FE có username / token nếu muốn dùng
        return ResponseEntity.ok(auth);
    }
}
