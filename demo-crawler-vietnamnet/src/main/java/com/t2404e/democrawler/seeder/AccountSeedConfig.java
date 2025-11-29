package com.t2404e.democrawler.seeder;
import com.t2404e.democrawler.entity.Account;
import com.t2404e.democrawler.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class AccountSeedConfig {
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner seedAdminAccount() {
        return args -> {
            String adminUsername = "admin";
            String rawPassword   = "admin";

            // nếu chưa có user admin thì tạo mới
            Account admin = accountRepository.findByUsername(adminUsername).orElse(null);
            if (admin == null) {
                admin = new Account();
                admin.setUsername(adminUsername);
                admin.setPassword_hash(passwordEncoder.encode(rawPassword)); // HASH ở đây
                // nếu entity của bạn có field active / role... thì set thêm:
                // admin.setActive(true);
                // admin.setRole("ADMIN");
                accountRepository.save(admin);
                System.out.println("===> Seed admin: username=admin, password=" + rawPassword);
            } else {
                System.out.println("===> Admin đã tồn tại, không seed lại.");
            }
        };
    }
}
