package com.medicycle.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.Refill;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiterService {

    private final Map<String, Bucket> loginBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> authBuckets = new ConcurrentHashMap<>();

    private final int loginCapacity;
    private final int loginRefillPerMinute;
    private final int authCapacity;
    private final int authRefillPerMinute;

    public RateLimiterService(
            @Value("${app.rate-limit.login-capacity}") int loginCapacity,
            @Value("${app.rate-limit.login-refill-per-minute}") int loginRefillPerMinute,
            @Value("${app.rate-limit.auth-capacity}") int authCapacity,
            @Value("${app.rate-limit.auth-refill-per-minute}") int authRefillPerMinute) {
        this.loginCapacity = loginCapacity;
        this.loginRefillPerMinute = loginRefillPerMinute;
        this.authCapacity = authCapacity;
        this.authRefillPerMinute = authRefillPerMinute;
    }

    public ConsumptionProbe tryConsumeLogin(String key) {
        Bucket bucket = loginBuckets.computeIfAbsent(key, k ->
                Bucket.builder()
                        .addLimit(Bandwidth.classic(loginCapacity, Refill.intervally(loginRefillPerMinute, Duration.ofMinutes(1))))
                        .build()
        );
        return bucket.tryConsumeAndReturnRemaining(1);
    }

    public ConsumptionProbe tryConsumeAuth(String key) {
        Bucket bucket = authBuckets.computeIfAbsent(key, k ->
                Bucket.builder()
                        .addLimit(Bandwidth.classic(authCapacity, Refill.intervally(authRefillPerMinute, Duration.ofMinutes(1))))
                        .build()
        );
        return bucket.tryConsumeAndReturnRemaining(1);
    }

    public void resetLoginBucket(String key) {
        loginBuckets.remove(key);
    }
}
