package com.medicycle.controller;

import com.medicycle.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "general") String folder) {
        String url = fileStorageService.storeFile(file, folder);
        return ResponseEntity.ok(Map.of("url", url, "filename", file.getOriginalFilename()));
    }

    @PostMapping("/upload/multiple")
    public ResponseEntity<Map<String, Object>> uploadMultipleFiles(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "folder", defaultValue = "general") String folder) {
        java.util.List<String> urls = new java.util.ArrayList<>();
        for (MultipartFile file : files) {
            urls.add(fileStorageService.storeFile(file, folder));
        }
        return ResponseEntity.ok(Map.of("urls", urls, "count", urls.size()));
    }
}
