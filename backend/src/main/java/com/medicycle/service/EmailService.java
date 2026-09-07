package com.medicycle.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@medicycle.com}")
    private String fromEmail;

    @Value("${app.base-url:http://localhost:5173}")
    private String baseUrl;

    @Async
    public void sendVerificationEmail(String to, String name, String token) {
        String verificationLink = baseUrl + "/api/auth/verify?token=" + token;
        String subject = "Verify your MediCycle account";
        String body = String.format("""
                Hello %s,
                
                Thank you for registering with MediCycle.
                
                Please verify your email address by clicking the link below:
                %s
                
                This link will expire in 24 hours.
                
                If you did not create an account, please ignore this email.
                
                Best regards,
                MediCycle Team
                """, name, verificationLink);

        sendEmail(to, subject, body);
    }

    @Async
    public void sendPasswordResetEmail(String to, String name, String token) {
        String resetLink = baseUrl + "/reset-password?token=" + token;
        String subject = "Reset your MediCycle password";
        String body = String.format("""
                Hello %s,
                
                We received a request to reset your MediCycle password.
                
                Click the link below to set a new password:
                %s
                
                This link will expire in 1 hour.
                
                If you did not request a password reset, please ignore this email. Your password will remain unchanged.
                
                Best regards,
                MediCycle Team
                """, name, resetLink);

        sendEmail(to, subject, body);
    }

    @Async
    public void sendTwoFactorCodeEmail(String to, String code) {
        String subject = "Your MediCycle 2FA Code";
        String body = String.format("""
                Your verification code is: %s
                
                This code will expire in 5 minutes.
                
                If you did not request this code, please ignore this email.
                """, code);

        sendEmail(to, subject, body);
    }

    private void sendEmail(String to, String subject, String text) {
        if (mailSender == null) {
            log.warn("JavaMailSender is not configured. Email will NOT be delivered.");
            log.info("=== EMAIL (console fallback — mail not configured) ===");
            log.info("To: {}", to);
            log.info("Subject: {}", subject);
            log.info("Body:\n{}", text);
            log.info("=====================================================");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            log.info("Email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            log.warn("Falling back to console logging for email content");
            log.info("=== EMAIL (console fallback — send failed) ===");
            log.info("To: {}", to);
            log.info("Subject: {}", subject);
            log.info("Body:\n{}", text);
            log.info("===============================================");
        }
    }
}

