package com.ecotrack.industry.repository;

import com.ecotrack.industry.entity.IndustryDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IndustryDocumentRepository extends JpaRepository<IndustryDocument, Long> {
    List<IndustryDocument> findByIndustryName(String industryName);
    List<IndustryDocument> findByIndustryId(Long industryId);
}
