package com.t2404e.democrawler.service;
import com.t2404e.democrawler.dto.AccountAuthResponse;
import com.t2404e.democrawler.dto.AccountLoginRequest;
import com.t2404e.democrawler.entity.Account;
import com.t2404e.democrawler.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AccountAuthResponse login(AccountLoginRequest request) {
        Account account = accountRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Sai username hoặc password"));

        if (!account.getActive()) {
            throw new RuntimeException("Tài khoản đã bị khóa");
        }

        if (!passwordEncoder.matches(request.getPassword(), account.getPassword_hash())) {
            throw new RuntimeException("Sai username hoặc password");
        }

        String token = jwtService.generateToken(account);

        AccountAuthResponse response = new AccountAuthResponse();
        response.setUsername(account.getUsername());
        response.setAccessToken(token);
        return response;
    }
}
