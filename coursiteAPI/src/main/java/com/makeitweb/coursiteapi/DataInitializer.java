package com.makeitweb.coursiteapi;

import com.makeitweb.coursiteapi.entity.users.User;
import com.makeitweb.coursiteapi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.email:irvingpineda684@gmail.com}")
    private String adminEmail;

    @Value("${admin.password:admin123!}")
    private String adminPassword;

    @Value("${admin.name:Irving}")
    private String adminName;

    @Value("${admin.lastname:Pineda}")
    private String adminLastName;

    @Override
    public void run(String... args) {
        if (userRepository.findUserByEmail(adminEmail) == null) {
            User admin = new User();
            admin.setName(adminName);
            admin.setLastName(adminLastName);
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole(3);
            admin.setStatus(1);
            userRepository.save(admin);
            log.info("Admin creado: {}", adminEmail);
        } else {
            log.info("Admin ya existe: {}", adminEmail);
        }
    }
}
