package com.ecotrack.monitoring.exception;

@Deprecated(forRemoval = true)
public class ScientistNotFoundException extends RuntimeException {
    @Deprecated(forRemoval = true)
    public ScientistNotFoundException(Long scientistId) {
        super("Use AgencyOfficerNotFoundException instead. No analysis records found for agency officer with id: " + scientistId);
    }
    @Deprecated(forRemoval = true)
    public ScientistNotFoundException(String message) {
        super("Use AgencyOfficerNotFoundException instead. " + message);
    }
}

