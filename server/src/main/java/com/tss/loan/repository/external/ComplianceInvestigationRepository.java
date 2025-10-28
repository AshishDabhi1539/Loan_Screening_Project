package com.tss.loan.repository.external;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.ParameterMode;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.StoredProcedureQuery;

/**
 * Repository for executing compliance investigation stored procedures
 * Uses external database (external_authority_db) for compliance investigations
 */
@Repository
public class ComplianceInvestigationRepository {
    
    @PersistenceContext(unitName = "external")
    @Qualifier("externalEntityManagerFactory")
    private EntityManager externalEntityManager;
    
    /**
     * Execute comprehensive compliance investigation stored procedure
     * Returns the complete JSON response from the stored procedure
     * 
     * @param aadhaarNumber Applicant's Aadhaar number
     * @param panNumber Applicant's PAN number
     * @return JSON string containing the complete investigation result
     */
    public String executeComprehensiveInvestigation(String aadhaarNumber, String panNumber) {
        StoredProcedureQuery query = externalEntityManager.createStoredProcedureQuery("SP_ComprehensiveComplianceInvestigation");
        
        // Register input parameters
        query.registerStoredProcedureParameter("p_aadhaar", String.class, ParameterMode.IN);
        query.registerStoredProcedureParameter("p_pan", String.class, ParameterMode.IN);
        
        // Set parameter values
        query.setParameter("p_aadhaar", aadhaarNumber);
        query.setParameter("p_pan", panNumber);
        
        // Execute the stored procedure
        query.execute();
        
        // Get the result set
        Object result = query.getSingleResult();
        
        // Return the JSON result as string
        return result != null ? result.toString() : "{}";
    }
}
