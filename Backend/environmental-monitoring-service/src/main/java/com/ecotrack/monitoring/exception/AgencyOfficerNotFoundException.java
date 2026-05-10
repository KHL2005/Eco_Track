package com.ecotrack.monitoring.exception;

public class AgencyOfficerNotFoundException extends RuntimeException {
    public AgencyOfficerNotFoundException(Long agencyOfficerId) {
        super("No analysis records found for agency officer with id: " + agencyOfficerId);
    }
    public AgencyOfficerNotFoundException(String message) {
        super(message);
    }
}

