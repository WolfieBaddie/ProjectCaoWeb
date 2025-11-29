package com.t2404e.democrawler.controller.admin;

import com.t2404e.democrawler.dto.AccountAuthResponse;
import com.t2404e.democrawler.dto.AccountLoginRequest;
import com.t2404e.democrawler.entity.Account;
import com.t2404e.democrawler.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AuthService authService;

    /**
     * Đăng nhập admin:
     * - Nhận username/password
     * - Gọi AuthService.login
     * - Set cookie AUTH_TOKEN (httpOnly) chứa JWT
     * - Trả về AccountAuthResponse (username + accessToken)
     */
    @PostMapping("/login")
    public ResponseEntity<AccountAuthResponse> login(
            @Valid @RequestBody AccountLoginRequest request,
            HttpServletResponse response
    ) {
        AccountAuthResponse auth = authService.login(request);

        // Lưu JWT vào cookie AUTH_TOKEN để FE không phải tự lưu token
        ResponseCookie cookie = ResponseCookie.from("AUTH_TOKEN", auth.getAccessToken())
                .httpOnly(true)
                .secure(false)        // để false cho localhost, deploy thật thì để true (https)
                .path("/")
                .maxAge(Duration.ofHours(1))
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(auth);
    }

    /**
     * Check phiên đăng nhập hiện tại.
     * - Nếu JWT hợp lệ -> trả 200 + username
     * - Nếu chưa login / token sai -> 401
     */
    @GetMapping("/me")
    public ResponseEntity<AccountAuthResponse> me(
            @AuthenticationPrincipal Account account
    ) {
        if (account == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        AccountAuthResponse res = new AccountAuthResponse();
        res.setUsername(account.getUsername());
        return ResponseEntity.ok(res);
    }
}
