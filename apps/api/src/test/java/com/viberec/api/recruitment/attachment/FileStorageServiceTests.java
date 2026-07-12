package com.viberec.api.recruitment.attachment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.viberec.api.recruitment.attachment.service.FileStorageService;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

class FileStorageServiceTests {

    @TempDir
    Path tempDirectory;

    @Test
    void rejectsContentThatDoesNotMatchAnAllowedFileSignature() {
        FileStorageService storageService = new FileStorageService(tempDirectory.toString());
        var disguisedHtml = new MockMultipartFile(
                "file",
                "resume.pdf",
                "application/pdf",
                "<html><script>alert(1)</script></html>".getBytes(StandardCharsets.UTF_8)
        );

        assertBadRequest(() -> storageService.store(disguisedHtml));
    }

    @Test
    void rejectsDeclaredTypeThatDoesNotMatchDetectedSignature() {
        FileStorageService storageService = new FileStorageService(tempDirectory.toString());
        byte[] pngSignature = new byte[] {
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00
        };
        var mismatchedFile = new MockMultipartFile(
                "file",
                "resume.pdf",
                "application/pdf",
                pngSignature
        );

        assertBadRequest(() -> storageService.store(mismatchedFile));
    }

    @Test
    void sanitizesOriginalNameAndStoresVerifiedChecksum() {
        FileStorageService storageService = new FileStorageService(tempDirectory.toString());
        var file = new MockMultipartFile(
                "file",
                "..\\..\\resume\r\nX-Injected: true.pdf",
                "application/pdf",
                "%PDF-1.7\nverified".getBytes(StandardCharsets.UTF_8)
        );

        var stored = storageService.store(file);

        assertThat(stored.originalName())
                .doesNotContain("..", "\\", "/", "\r", "\n", "\"");
        assertThat(stored.fileName()).endsWith(".pdf");
        assertThat(stored.contentType()).isEqualTo("application/pdf");
        assertThat(stored.sha256()).matches("[0-9a-f]{64}");
        assertThat(storageService.loadAsResource(stored.storagePath()).exists()).isTrue();
    }

    @Test
    void rejectsStoragePathsOutsideConfiguredBaseDirectory() {
        FileStorageService storageService = new FileStorageService(tempDirectory.toString());

        assertThatThrownBy(() -> storageService.loadAsResource("../outside.pdf"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    private void assertBadRequest(org.assertj.core.api.ThrowableAssert.ThrowingCallable action) {
        assertThatThrownBy(action)
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
