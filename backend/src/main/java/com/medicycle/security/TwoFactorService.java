package com.medicycle.security;

import com.medicycle.entity.User;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import org.springframework.stereotype.Service;

import java.util.Base64;

import static dev.samstevens.totp.util.Utils.getDataUriForImage;

@Service
public class TwoFactorService {

    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();

    public String generateSecret() {
        return secretGenerator.generate();
    }

    public String getQrCodeUri(String secret, String email) {
        QrData data = new QrData.Builder()
                .label(email)
                .secret(secret)
                .issuer("MediCycle")
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();

        try {
            QrGenerator generator = new ZxingPngQrGenerator();
            byte[] imageData = generator.generate(data);
            return getDataUriForImage(imageData, generator.getImageMimeType());
        } catch (QrGenerationException e) {
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }

    public boolean verifyCode(String secret, String code) {
        TimeProvider timeProvider = new SystemTimeProvider();
        CodeGenerator codeGenerator = new DefaultCodeGenerator();
        CodeVerifier verifier = new DefaultCodeVerifier(codeGenerator, timeProvider);
        return verifier.isValidCode(secret, code);
    }

    public boolean isTotpEnabled(User user) {
        return Boolean.TRUE.equals(user.getIsTwoFactorEnabled()) && user.getTwoFactorSecret() != null;
    }
}
