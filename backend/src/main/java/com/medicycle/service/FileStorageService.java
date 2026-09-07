package com.medicycle.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Map<String, String> ALLOWED_EXTENSIONS = Map.of(
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg",
            "png", "image/png",
            "webp", "image/webp",
            "gif", "image/gif",
            "pdf", "application/pdf"
    );

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"
    );

    private final Path uploadDir;
    private final long maxFileSizeBytes;

    public FileStorageService(
            @Value("${file.upload-dir}") String uploadDir,
            @Value("${file.max-size:5242880}") long maxFileSizeBytes) {
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.maxFileSizeBytes = maxFileSizeBytes;
        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create upload directory", e);
        }
    }

    public String storeFile(MultipartFile file, String subfolder) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No file provided");
        }

        if (file.getSize() > maxFileSizeBytes) {
            throw new IllegalArgumentException("File exceeds the maximum allowed size of " + (maxFileSizeBytes / 1024 / 1024) + "MB");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex + 1).toLowerCase();
        }

        String expectedType = ALLOWED_EXTENSIONS.get(extension);
        if (expectedType == null) {
            throw new IllegalArgumentException("File type ." + extension + " is not allowed. Allowed: "
                    + String.join(", ", ALLOWED_EXTENSIONS.keySet().stream().sorted().toList()));
        }

        String contentType = file.getContentType();
        if (contentType != null && !contentType.isBlank() && !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("File content type '" + contentType + "' is not allowed");
        }

        if (subfolder == null || subfolder.isBlank() || !subfolder.matches("[a-zA-Z0-9_-]+")) {
            throw new IllegalArgumentException("Invalid upload folder: '" + subfolder + "'");
        }

        String filename = UUID.randomUUID() + "." + extension;

        try {
            Path targetDir = uploadDir.resolve(subfolder).normalize();
            if (!targetDir.startsWith(uploadDir)) {
                throw new IllegalArgumentException("Invalid upload folder: '" + subfolder + "'");
            }
            Files.createDirectories(targetDir);
            Path targetPath = targetDir.resolve(filename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/" + subfolder + "/" + filename;
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store file: " + originalFilename, e);
        }
    }
}