package com.medicycle.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Component
public class PasswordValidator {

    private final int minLength;
    private final int maxLength;
    private final boolean requireUppercase;
    private final boolean requireLowercase;
    private final boolean requireDigit;
    private final boolean requireSpecial;

    public PasswordValidator(
            @Value("${app.password.min-length}") int minLength,
            @Value("${app.password.max-length}") int maxLength,
            @Value("${app.password.require-uppercase}") boolean requireUppercase,
            @Value("${app.password.require-lowercase}") boolean requireLowercase,
            @Value("${app.password.require-digit}") boolean requireDigit,
            @Value("${app.password.require-special}") boolean requireSpecial) {
        this.minLength = minLength;
        this.maxLength = maxLength;
        this.requireUppercase = requireUppercase;
        this.requireLowercase = requireLowercase;
        this.requireDigit = requireDigit;
        this.requireSpecial = requireSpecial;
    }

    public List<String> validate(String password) {
        List<String> errors = new ArrayList<>();

        if (password == null) {
            errors.add("Password is required");
            return errors;
        }

        if (password.length() < minLength) {
            errors.add("Password must be at least " + minLength + " characters");
        }
        if (password.length() > maxLength) {
            errors.add("Password must not exceed " + maxLength + " characters");
        }
        if (requireUppercase && !Pattern.compile("[A-Z]").matcher(password).find()) {
            errors.add("Password must contain at least one uppercase letter");
        }
        if (requireLowercase && !Pattern.compile("[a-z]").matcher(password).find()) {
            errors.add("Password must contain at least one lowercase letter");
        }
        if (requireDigit && !Pattern.compile("[0-9]").matcher(password).find()) {
            errors.add("Password must contain at least one digit");
        }
        if (requireSpecial && !Pattern.compile("[!@#$%^&*()_\\-+=\\[\\]{}|;:'\",.<>/?]").matcher(password).find()) {
            errors.add("Password must contain at least one special character");
        }

        return errors;
    }
}
