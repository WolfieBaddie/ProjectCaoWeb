package com.t2404e.democrawler.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "account")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    @Column(name = "password_hash")   // 👈 map tới cột password_hash
    private String password_hash;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
