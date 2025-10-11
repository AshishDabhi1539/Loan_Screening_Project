package com.tss.loan.service;

import com.tss.loan.dto.request.ExternalScoreRequest;
import com.tss.loan.dto.response.ExternalScoreResponse;
import com.tss.loan.entity.external.BankDetails;
import com.tss.loan.entity.external.LoanHistory;
import com.tss.loan.repository.external.BankDetailsRepository;
import com.tss.loan.repository.external.LoanHistoryRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test for External Score Service with stored procedure
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class ExternalScoreServiceIntegrationTest {

    @Autowired
    private ExternalScoreService externalScoreService;

    @Autowired
    private BankDetailsRepository bankDetailsRepository;

    @Autowired
    private LoanHistoryRepository loanHistoryRepository;

    private static final String TEST_AADHAAR = "123456789012";
    private static final String TEST_PAN = "ABCDE1234F";
    private static final String DIFFERENT_AADHAAR = "987654321098";

    @BeforeEach
    void setUp() {
        // Clean up test data
        bankDetailsRepository.deleteAll();
        loanHistoryRepository.deleteAll();
    }

    @Test
    void testCalculateScores_WithValidData_ShouldReturnScores() {
        // Arrange
        createTestBankDetails(TEST_AADHAAR, TEST_PAN, new BigDecimal("50000"), true, 0);
        createTestLoanHistory(TEST_AADHAAR, TEST_PAN, new BigDecimal("200000"), "Active", 1, false);

        ExternalScoreRequest request = new ExternalScoreRequest();
        request.setAadhaarNumber(TEST_AADHAAR);
        request.setPanNumber(TEST_PAN);

        // Act
        ExternalScoreResponse response = externalScoreService.calculateScores(request);

        // Assert
        assertNotNull(response);
        assertTrue(response.getDataFound());
        assertNotNull(response.getCreditScore());
        assertNotNull(response.getRiskScore());
        assertNotNull(response.getRiskScoreNumeric());
        assertNotNull(response.getRedAlertFlag());
        assertTrue(response.getCreditScore() >= 300 && response.getCreditScore() <= 850);
        assertTrue(response.getRiskScoreNumeric() >= 0 && response.getRiskScoreNumeric() <= 100);
        
        System.out.println("Test Result - Credit Score: " + response.getCreditScore() + 
                          ", Risk Score: " + response.getRiskScore() + 
                          ", Numeric Risk: " + response.getRiskScoreNumeric());
    }

    @Test
    void testCalculateScores_WithNoData_ShouldReturnNoDataResponse() {
        // Arrange
        ExternalScoreRequest request = new ExternalScoreRequest();
        request.setAadhaarNumber("999999999999");
        request.setPanNumber("XXXXX0000X");

        // Act
        ExternalScoreResponse response = externalScoreService.calculateScores(request);

        // Assert
        assertNotNull(response);
        assertFalse(response.getDataFound());
        assertNull(response.getCreditScore());
        assertEquals("UNKNOWN", response.getRiskScore());
        assertEquals(0, response.getRiskScoreNumeric());
        assertFalse(response.getRedAlertFlag());
    }

    @Test
    void testCalculateScores_WithIdentityMismatch_ShouldReturnInvalidResponse() {
        // Arrange - Create data for different people
        createTestBankDetails(TEST_AADHAAR, "VALID1234P", new BigDecimal("30000"), false, 1);
        createTestLoanHistory(DIFFERENT_AADHAAR, TEST_PAN, new BigDecimal("100000"), "Active", 0, false);

        ExternalScoreRequest request = new ExternalScoreRequest();
        request.setAadhaarNumber(TEST_AADHAAR);
        request.setPanNumber(TEST_PAN); // This PAN belongs to different person

        // Act
        ExternalScoreResponse response = externalScoreService.calculateScores(request);

        // Assert
        assertNotNull(response);
        assertFalse(response.getDataFound());
        assertEquals("INVALID", response.getRiskScore());
        assertEquals(100, response.getRiskScoreNumeric());
        assertTrue(response.getRedAlertFlag());
        assertTrue(response.getRiskFactors().contains("CRITICAL ERROR"));
    }

    @Test
    void testCalculateScores_WithHighRiskProfile_ShouldTriggerRedAlert() {
        // Arrange - Create high-risk profile
        createTestBankDetails(TEST_AADHAAR, TEST_PAN, new BigDecimal("2000"), false, 5); // Low balance, many bounces
        createTestLoanHistory(TEST_AADHAAR, TEST_PAN, new BigDecimal("3000000"), "Active", 10, true); // High outstanding, many missed payments, defaults

        ExternalScoreRequest request = new ExternalScoreRequest();
        request.setAadhaarNumber(TEST_AADHAAR);
        request.setPanNumber(TEST_PAN);

        // Act
        ExternalScoreResponse response = externalScoreService.calculateScores(request);

        // Assert
        assertNotNull(response);
        assertTrue(response.getDataFound());
        assertNotNull(response.getCreditScore());
        assertTrue(response.getCreditScore() < 400); // Should be very low
        assertTrue(response.getRiskScoreNumeric() >= 80); // Should be high risk
        // May or may not trigger red alert depending on exact score, but should be high risk
        assertTrue("HIGH".equals(response.getRiskScore()) || response.getRedAlertFlag());
    }

    @Test
    void testCalculateScores_WithGoodProfile_ShouldReturnLowRisk() {
        // Arrange - Create good profile
        createTestBankDetails(TEST_AADHAAR, TEST_PAN, new BigDecimal("150000"), true, 0); // High balance, salary account, no bounces
        createTestLoanHistory(TEST_AADHAAR, TEST_PAN, new BigDecimal("50000"), "Active", 0, false); // Low outstanding, no missed payments, no defaults

        ExternalScoreRequest request = new ExternalScoreRequest();
        request.setAadhaarNumber(TEST_AADHAAR);
        request.setPanNumber(TEST_PAN);

        // Act
        ExternalScoreResponse response = externalScoreService.calculateScores(request);

        // Assert
        assertNotNull(response);
        assertTrue(response.getDataFound());
        assertNotNull(response.getCreditScore());
        assertTrue(response.getCreditScore() > 600); // Should be good
        assertTrue(response.getRiskScoreNumeric() < 50); // Should be low-medium risk
        assertFalse(response.getRedAlertFlag());
        assertTrue("LOW".equals(response.getRiskScore()) || "MEDIUM".equals(response.getRiskScore()));
    }

    private void createTestBankDetails(String aadhaar, String pan, BigDecimal balance, boolean salaryAccount, int bounces) {
        BankDetails bankDetails = new BankDetails();
        bankDetails.setAadhaarNumber(aadhaar);
        bankDetails.setPanNumber(pan);
        bankDetails.setBankName("Test Bank");
        bankDetails.setAccountNumber("ACC" + System.currentTimeMillis());
        bankDetails.setAccountType("SAVINGS");
        bankDetails.setAverageMonthlyBalance(balance);
        bankDetails.setSalaryAccountFlag(salaryAccount);
        bankDetails.setChequeBounceCount(bounces);
        bankDetails.setOverdraftUsed(false);
        bankDetails.setAccountAgeYears(new BigDecimal("3.5"));
        
        bankDetailsRepository.save(bankDetails);
    }

    private void createTestLoanHistory(String aadhaar, String pan, BigDecimal outstanding, String status, int missedPayments, boolean hasDefaults) {
        LoanHistory loanHistory = new LoanHistory();
        loanHistory.setAadhaarNumber(aadhaar);
        loanHistory.setPanNumber(pan);
        loanHistory.setLoanType("Personal");
        loanHistory.setCurrentOutstanding(outstanding);
        loanHistory.setLoanStatus(status);
        loanHistory.setMissedPayments(missedPayments);
        loanHistory.setDefaultFlag(hasDefaults);
        loanHistory.setSecuredFlag(false);
        loanHistory.setClosedLoansCount(2);
        
        loanHistoryRepository.save(loanHistory);
    }
}
