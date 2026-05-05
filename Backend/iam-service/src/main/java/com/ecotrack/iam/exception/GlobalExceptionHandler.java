package com.ecotrack.iam.exception;

import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFound(ResourceNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, "Not Found", ex.getMessage());
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(BadRequestException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, "Bad Request", ex.getMessage());
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicate(DuplicateResourceException ex) {
        return buildResponse(HttpStatus.CONFLICT, "Conflict", ex.getMessage());
    }

    /**
     * Handle validation errors from @Valid annotation.
     * Returns field-level error messages in the format:
     * {
     *   "error": "Validation Failed",
     *   "messages": {
     *     "email": "Please provide a valid email address",
     *     "password": "Password must have min 8 chars..."
     *   },
     *   "status": 400,
     *   "timestamp": "2026-05-03T10:00:00"
     * }
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        
        // Collect field-level error messages
        ex.getBindingResult().getFieldErrors().forEach(error -> {
            String fieldName = error.getField();
            String errorMessage = error.getDefaultMessage();
            // If multiple errors on same field, append them
            fieldErrors.merge(fieldName, errorMessage, (existing, newMsg) -> existing + "; " + newMsg);
        });

        Map<String, Object> body = new HashMap<>();
        body.put("error", "Validation Failed");
        body.put("messages", fieldErrors);
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("timestamp", LocalDateTime.now().format(DATE_FORMATTER));
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return buildResponse(HttpStatus.FORBIDDEN, "Access Denied", "You do not have permission");
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        return buildResponse(HttpStatus.UNAUTHORIZED, "Unauthorized", "Invalid email or password");
    }

    /**
     * Handles missing required headers (e.g. X-User-Role not forwarded).
     * Returns 400 instead of letting it fall to the generic 500 handler.
     */
    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<Map<String, Object>> handleMissingHeader(MissingRequestHeaderException ex) {
        log.warn("Missing required header: {}", ex.getHeaderName());
        return buildResponse(HttpStatus.BAD_REQUEST, "Bad Request",
                "Required header '" + ex.getHeaderName() + "' is missing");
    }

    /**
     * Handles invalid enum values in path variables or request parameters
     * (e.g. GET /api/v1/users/role/INVALID_ROLE).
     * Returns 400 instead of 500.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        log.warn("Type mismatch for parameter '{}': value='{}'", ex.getName(), ex.getValue());
        String message = "Invalid value '" + ex.getValue() + "' for parameter '" + ex.getName() + "'";
        if (ex.getRequiredType() != null && ex.getRequiredType().isEnum()) {
            String accepted = Arrays.stream(ex.getRequiredType().getEnumConstants())
                    .map(Object::toString)
                    .collect(Collectors.joining(", "));
            message += ". Accepted values: " + accepted;
        }
        return buildResponse(HttpStatus.BAD_REQUEST, "Bad Request", message);
    }

    /**
     * Handles JSON deserialization failures — e.g. sending an unrecognised enum value
     * such as a role string that does not exist in UserRole.
     * Returns 400 Bad Request instead of 500, preventing circuit-breaker trips.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadableMessage(HttpMessageNotReadableException ex) {
        log.warn("Unreadable HTTP message: {}", ex.getMessage());
        String message = "Invalid request body. Please check the values provided.";
        Throwable cause = ex.getCause();
        if (cause instanceof InvalidFormatException ife && ife.getTargetType() != null && ife.getTargetType().isEnum()) {
            String accepted = Arrays.stream(ife.getTargetType().getEnumConstants())
                    .map(Object::toString)
                    .collect(Collectors.joining(", "));
            message = "Invalid value '" + ife.getValue() + "' for field '" + ife.getPath().get(0).getFieldName()
                    + "'. Accepted values: " + accepted;
        }
        return buildResponse(HttpStatus.BAD_REQUEST, "Bad Request", message);
    }

    /**
     * Handles IllegalArgumentException thrown by UserRole.valueOf() when an
     * unrecognised role string is received in the X-User-Role header.
     * Returns 400 Bad Request instead of 500.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Illegal argument: {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, "Bad Request", ex.getMessage());
    }

    /**
     * Handles DB constraint violations (e.g. unique email race condition).
     * Returns 409 instead of 500 so this never trips the circuit breaker.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex) {
        log.warn("Data integrity violation: {}", ex.getMostSpecificCause().getMessage());
        String message = "A resource with the provided details already exists";
        return buildResponse(HttpStatus.CONFLICT, "Conflict", message);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error", "An unexpected error occurred");
    }

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String error, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().format(DATE_FORMATTER));
        body.put("status", status.value());
        body.put("error", error);
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}

