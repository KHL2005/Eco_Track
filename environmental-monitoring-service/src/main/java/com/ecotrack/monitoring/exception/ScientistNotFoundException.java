package com.ecotrack.monitoring.exception;

public class ScientistNotFoundException extends RuntimeException {
    public ScientistNotFoundException(Long scientistId) {
        super("No analysis records found for scientist with id: " + scientistId);
    }
    public ScientistNotFoundException(String message) {
        super(message);
    }
}

