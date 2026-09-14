package com.medicycle.service;

import com.medicycle.repository.MedicineDonationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class DonationExpiryService {
    private final MedicineDonationRepository donationRepository;

    @Scheduled(cron = "${app.cleanup.donation-expiry-cron:0 15 3 * * *}")
    @Transactional
    public void markExpiredDonations() {
        int updated = donationRepository.markExpired(LocalDate.now());
        if (updated > 0) {
            log.info("Marked {} approved donations as expired", updated);
        }
    }
}
