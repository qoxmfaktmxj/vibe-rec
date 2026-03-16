package com.viberec.api.recruitment.attachment.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "image/png",
            "image/jpeg"
    );

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

    private final Path baseDir;

    public FileStorageService(@Value("${app.upload.base-dir:./uploads}") String baseDirPath) {
        this.baseDir = Path.of(baseDirPath).toAbsolutePath().normalize();
    }

    public StoredFileResult store(MultipartFile file) {
        validateFile(file);

        String originalFilename = file.getOriginalFilename() != null
                ? file.getOriginalFilename()
                : "unknown";
        String extension = extractExtension(originalFilename);
        String storedFilename = UUID.randomUUID() + extension;
        String dateFolder = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
        String relativePath = dateFolder + "/" + storedFilename;

        Path targetDir = baseDir.resolve(dateFolder);
        Path targetFile = targetDir.resolve(storedFilename);

        try {
            Files.createDirectories(targetDir);
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetFile, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "파일 저장에 실패했습니다.");
        }

        return new StoredFileResult(
                originalFilename,
                storedFilename,
                file.getContentType() != null ? file.getContentType() : "application/octet-stream",
                file.getSize(),
                relativePath
        );
    }

    public Resource loadAsResource(String storagePath) {
        try {
            Path filePath = baseDir.resolve(storagePath).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "파일을 찾을 수 없습니다.");
            }
            return resource;
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "파일을 찾을 수 없습니다.");
        }
    }

    public void delete(String storagePath) {
        try {
            Path filePath = baseDir.resolve(storagePath).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // Log and continue — best effort deletion.
        }
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "업로드할 파일이 비어 있습니다.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파일 크기는 10MB를 초과할 수 없습니다.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "허용되지 않는 파일 형식입니다. PDF, PNG, JPEG만 업로드 가능합니다.");
        }
    }

    private String extractExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        return dotIndex >= 0 ? filename.substring(dotIndex) : "";
    }

    public record StoredFileResult(
            String originalFilename,
            String storedFilename,
            String contentType,
            long fileSizeBytes,
            String storagePath
    ) {
    }
}
