package com.t2404e.democrawler.auth.config;
import com.t2404e.democrawler.entity.Account;
import com.t2404e.democrawler.repository.AccountRepository;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@AllArgsConstructor
public class PasswordDebugConfig {

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner debugPassword() {
        return args -> {
            Account acc = accountRepository.findByUsername("admin").orElse(null);
            if (acc == null) {
                System.out.println("Không tìm thấy account admin");
                return;
            }



            // Thử so sánh với mật khẩu bạn đang dùng khi login
            String raw = "admin123"; // ĐÚNG CHUỖI bạn gõ bên Postman
            boolean ok = passwordEncoder.matches(raw, acc.getPassword_hash());

            System.out.println("matches(\"" + raw + "\") = " + ok);
        };
    }
}
