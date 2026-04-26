package com.makeitweb.coursiteapi.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Component
@Service
public class Keys {
    @Value("${security.jwt.secret:change-me-in-production}")
    private String secret;
    @Value("${security.jwt.start:Bearer}")
    private String start;
    @Value("${security.jwt.jwtDuration:86400000}")
    private int jwtDuration;
    @Value("${send.grid.api.key:disabled}")
    private String sendgridApiKey;
    @Value("${send.grid.email:no-reply@caleiro.online}")
    private String sendgridEmail;
    @Value("${app.url:https://caleiro.online}")
    private String appUrl;
    @Value("${app.cors.allowed-origins:https://caleiro.online,https://www.caleiro.online,http://localhost:3000}")
    private String corsAllowedOrigins;

    public String getSecret() {
        return secret;
    }
    public String getStart() {
        if (start == null) {
            return "Bearer ";
        }
        return start.endsWith(" ") ? start : start + " ";
    }
    public int getJwtDuration() {
        return jwtDuration;
    }
    public String getSendgridApiKey() {
        return sendgridApiKey;
    }
    public String getSendgridEmail() {
        return sendgridEmail;
    }
    public String getAppUrl() {
        return appUrl;
    }
    public List<String> getCorsAllowedOrigins() {
        return Arrays.stream(corsAllowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .collect(Collectors.toList());
    }
}
