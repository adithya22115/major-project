package com.medicycle.service;

import com.medicycle.dto.response.DemandForecastResponse;
import com.medicycle.entity.MedicineRequest;
import com.medicycle.repository.MedicineRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DemandForecastService {
    private final MedicineRequestRepository requestRepository;

    @Transactional(readOnly = true)
    public DemandForecastResponse forecast(int months, String city) {
        int monthsAnalyzed = Math.max(1, Math.min(months, 24));
        YearMonth cutoff = YearMonth.now().minusMonths(monthsAnalyzed - 1L);
        List<MedicineRequest> requests = requestRepository.findAll().stream()
                .filter(r -> r.getCreatedAt() != null && !YearMonth.from(r.getCreatedAt()).isBefore(cutoff))
                .filter(r -> city == null || city.isBlank() || city.equalsIgnoreCase(r.getRecipient().getCity()))
                .toList();
        Map<String, List<MedicineRequest>> grouped = requests.stream().collect(Collectors.groupingBy(
                r -> r.getMedicine().getId() + "|" + r.getMedicine().getMedicineName()));
        List<DemandForecastResponse.MedicineForecast> forecasts = grouped.values().stream().map(items -> {
            MedicineRequest first = items.get(0);
            long total = items.stream().mapToLong(r -> r.getRequestedQuantity()).sum();
            long average = Math.round((double) total / monthsAnalyzed);
            return DemandForecastResponse.MedicineForecast.builder()
                    .medicineId(first.getMedicine().getId())
                    .medicineName(first.getMedicine().getMedicineName())
                    .totalRequested(total)
                    .averageMonthlyDemand(average)
                    .projectedNextMonthDemand(Math.max(average, Math.round(average * 1.1)))
                    .city(city)
                    .build();
        }).sorted(Comparator.comparingLong(DemandForecastResponse.MedicineForecast::getProjectedNextMonthDemand).reversed()).toList();
        return DemandForecastResponse.builder().monthsAnalyzed(monthsAnalyzed).forecasts(forecasts).build();
    }
}
