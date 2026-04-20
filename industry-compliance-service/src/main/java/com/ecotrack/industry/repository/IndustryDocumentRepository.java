package com.ecotrack.industry.repository;

import com.ecotrack.industry.entity.IndustryDocument;
import com.ecotrack.industry.enums.DocType;
import com.ecotrack.industry.enums.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IndustryDocumentRepository extends JpaRepository<IndustryDocument, Long> {
    List<IndustryDocument> findByIndustryId(Long industryId);
    List<IndustryDocument> findByVerificationStatus(VerificationStatus status);
    List<IndustryDocument> findByDocType(DocType docType);
    List<IndustryDocument> findByIndustryIdAndVerificationStatus(Long industryId, VerificationStatus status);
}
