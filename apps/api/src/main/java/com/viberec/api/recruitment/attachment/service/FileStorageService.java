package com.viberec.api.recruitment.attachment.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
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

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    private final Path baseDir;

    public FileStorageService(@Value("${app.upload.base-dir:./uploads}") String baseDirPath) {
        this.baseDir = Path.of(baseDirPath).toAbsolutePath().normalize();
    }

    public StoredFileResult store(MultipartFile file) {
        validateFileEnvelope(file);
        byte[] content = readContent(file);
        DetectedFileType detectedType = detectFileType(content);
        if (!detectedType.contentType().equals(file.getContentType())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "The declared file type does not match the file contents."
            );
        }

        String originalName = sanitizeOriginalName(file.getOriginalFilename(), detectedType.extension());
        String fileName = UUID.randomUUID() + detectedType.extension();
        String dateFolder = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
        String relativePath = dateFolder + "/" + fileName;
        Path targetFile = resolveStoragePath(relativePath);

        try {
            Files.createDirectories(targetFile.getParent());
            Files.write(targetFile, content, StandardOpenOption.CREATE_NEW);
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store the uploaded file.");
        }

        return new StoredFileResult(
                fileName,
                originalName,
                detectedType.contentType(),
                content.length,
                relativePath,
                sha256(content)
        );
    }

    public Resource loadAsResource(String storagePath) {
        try {
            Path filePath = resolveStoragePath(storagePath);
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found.");
            }
            return resource;
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found.");
        }
    }

    public void delete(String storagePath) {
        try {
            Files.deleteIfExists(resolveStoragePath(storagePath));
        } catch (IOException | ResponseStatusException exception) {
            // Best-effort cleanup. The database record remains authoritative.
        }
    }

    private void validateFileEnvelope(MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The uploaded file is empty.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The uploaded file exceeds the 10 MB limit.");
        }
    }

    private byte[] readContent(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The uploaded file could not be read.");
        }
    }

    private DetectedFileType detectFileType(byte[] content) {
        if (startsWith(content, new int[] {0x25, 0x50, 0x44, 0x46, 0x2D})) {
            return new DetectedFileType("application/pdf", ".pdf");
        }
        if (startsWith(content, new int[] {0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A})) {
            return new DetectedFileType("image/png", ".png");
        }
        if (startsWith(content, new int[] {0xFF, 0xD8, 0xFF})) {
            return new DetectedFileType("image/jpeg", ".jpg");
        }
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Only files with valid PDF, PNG, or JPEG signatures are allowed."
        );
    }

    private boolean startsWith(byte[] content, int[] signature) {
        if (content.length < signature.length) {
            return false;
        }
        for (int index = 0; index < signature.length; index++) {
            if ((content[index] & 0xFF) != signature[index]) {
                return false;
            }
        }
        return true;
    }

    private String sanitizeOriginalName(String originalName, String extension) {
        String candidate = originalName == null ? "" : originalName.replace('\\', '/');
        int lastSeparator = candidate.lastIndexOf('/');
        if (lastSeparator >= 0) {
            candidate = candidate.substring(lastSeparator + 1);
        }
        candidate = candidate.replaceAll("[\\p{Cntrl}\\\"]", "_").trim();
        if (candidate.isEmpty() || candidate.equals(".") || candidate.equals("..")) {
            candidate = "attachment" + extension;
        }
        return candidate.length() <= 255 ? candidate : candidate.substring(0, 255);
    }

    private String sha256(byte[] content) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(content));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available.", exception);
        }
    }

    private Path resolveStoragePath(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found.");
        }
        Path resolved = baseDir.resolve(storagePath).normalize();
        if (!resolved.startsWith(baseDir)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found.");
        }
        return resolved;
    }

    public record StoredFileResult(
            String fileName,
            String originalName,
            String contentType,
            long fileSize,
            String storagePath,
            String sha256
    ) {
    }

    private record DetectedFileType(String contentType, String extension) {
    }
}
