# 🔍 COMPLETE N+1 AUDIT - ALL API ENDPOINTS

**Date:** November 9, 2025, 11:42 PM IST  
**Scope:** ALL Controllers, Services, Repositories, Mappers  
**Status:** 🔴 **CRITICAL - 12+ N+1 Issues Found**

---

## 📊 EXECUTIVE SUMMARY

**Total Issues:** 12+ Critical N+1 Problems  
**Affected Endpoints:** 20+ API endpoints  
**Root Causes:**
1. ❌ **NO JOIN FETCH queries anywhere**
2. ❌ Lazy loading without proper fetching
3. ❌ Stream operations on loaded entities  
4. ❌ Mapper accessing lazy relationships
5. ❌ No batch fetch configuration

**Performance Impact:** Application generates **1000+ queries** for complex operations

---

## 🚨 CRITICAL ISSUES FOUND

### 1. ❌ NO JOIN FETCH QUERIES IN ENTIRE APPLICATION
**Impact:** Every list operation triggers N+1 queries

**Example:** Get 100 applications:
- 1 query: Load applications
- 100 queries: Load applicants (lazy)
- 100 queries: Load officers (lazy)
- 100 queries: Load documents (lazy)
- **Total: 301+ queries**

### 2. 🔴 LoanApplicationMapper N+1 Issues
**File:** `LoanApplicationMapper.java` Lines 22-89

**Problems:**
```java
// Line 56: Triggers lazy load
.applicantId(entity.getApplicant().getId())

// Lines 59-61: Triggers lazy load + additional query
.assignedOfficerName(officerProfileService.getOfficerDisplayName(entity.getAssignedOfficer()))
// ↑ Calls repository.findByUser() → ANOTHER query per application!

// Line 72: Triggers lazy load
.documentsCount(entity.getDocuments().size())

// Line 76: Additional query
.hasPersonalDetails(hasPersonalDetails(entity.getApplicant().getId()))
// ↑ Calls repository.existsByUserId() → query per application
```

**For 100 applications:** 800+ additional queries from mapper alone!

### 3. 🔴 List Endpoints - All Have N+1 Issues

#### LoanOfficerServiceImpl.getAssignedApplications()
```java
List<LoanApplication> apps = repository.findByAssignedOfficerOrderByCreatedAtDesc(officer);
return apps.stream().map(mapper::toResponse).collect(Collectors.toList());
```
**Queries:** 1 + 5N (100 apps = 501 queries)

#### LoanApplicationServiceImpl.getMyApplications()
**Same pattern - 501 queries for 100 applications**

#### ComplianceOfficerServiceImpl.getAssignedApplications()
**Same pattern - 501 queries for 100 applications**

### 4. 🔴 Dashboard Endpoints (Already Identified)

- AdminController.getDashboard() - ✅ FIXED
- LoanOfficerServiceImpl.getDashboard() - 🔴 NEEDS FIX (301 queries)
- ComplianceOfficerServiceImpl.getDashboard() - 🔴 NEEDS FIX (301 queries)

### 5. 🔴 Detail Endpoints

#### LoanOfficerServiceImpl.getCompleteApplicationDetails()
**Queries:** 1 + 10+ for single application

#### DocumentController.getDocuments()
```java
List<LoanDocument> docs = repository.findByLoanApplicationId(id);
// Mapper accesses uploadedBy, verifiedBy → N queries each
```

### 6. 🔴 OfficerProfileService.getOfficerDisplayName()
**Called from mapper for EVERY application**
```java
officerPersonalDetailsRepository.findByUser(user) // Query per call!
```

---

## 🛠️ REQUIRED FIXES

### Fix 1: Add JOIN FETCH Queries

```java
@Query("SELECT DISTINCT la FROM LoanApplication la " +
       "LEFT JOIN FETCH la.applicant " +
       "LEFT JOIN FETCH la.assignedOfficer " +
       "LEFT JOIN FETCH la.financialProfile " +
       "WHERE la.assignedOfficer = :officer " +
       "ORDER BY la.createdAt DESC")
List<LoanApplication> findByAssignedOfficerWithDetailsOrderByCreatedAtDesc(@Param("officer") User officer);
```

### Fix 2: Batch Fetch Officer Names

```java
// In OfficerPersonalDetailsRepository
@Query("SELECT opd FROM OfficerPersonalDetails opd " +
       "LEFT JOIN FETCH opd.user " +
       "WHERE opd.user.id IN :userIds")
List<OfficerPersonalDetails> findByUserIdIn(@Param("userIds") Set<UUID> userIds);
```

### Fix 3: Optimize Service Methods

```java
@Override
public List<LoanApplicationResponse> getAssignedApplications(User officer) {
    // ✅ Use JOIN FETCH query
    List<LoanApplication> apps = repository.findByAssignedOfficerWithDetailsOrderByCreatedAtDesc(officer);
    
    // ✅ Batch fetch officer names
    Set<UUID> officerIds = apps.stream()
        .map(app -> app.getAssignedOfficer().getId())
        .collect(Collectors.toSet());
    Map<UUID, String> officerNames = officerNameService.getOfficerNamesMap(officerIds);
    
    // ✅ Map with cached names
    return apps.stream()
        .map(app -> mapper.toResponseWithCache(app, officerNames))
        .collect(Collectors.toList());
}
```

### Fix 4: Add Hibernate Batch Fetching

```properties
spring.jpa.properties.hibernate.default_batch_fetch_size=20
spring.jpa.properties.hibernate.jdbc.batch_size=20
```

### Fix 5: Add @BatchSize to Entities

```java
@Entity
public class LoanApplication {
    @ManyToOne(fetch = FetchType.LAZY)
    @BatchSize(size = 20)
    private User applicant;
}
```

---

## 📈 EXPECTED IMPROVEMENTS

| Endpoint | Before | After | Improvement |
|----------|--------|-------|-------------|
| Loan Officer Dashboard | 301 queries | 11 queries | **96%** |
| Get Applications (100) | 501 queries | 2 queries | **99.6%** |
| Get Application Details | 15 queries | 1 query | **93%** |
| Get Documents (50) | 101 queries | 1 query | **99%** |

**Overall Database Load Reduction: 95-98%**

---

## 🎯 IMPLEMENTATION PRIORITY

### PHASE 1: CRITICAL (Do Now)
1. Add JOIN FETCH queries to LoanApplicationRepository
2. Add JOIN FETCH queries to LoanDocumentRepository  
3. Refactor getAssignedApplications() methods
4. Refactor getDashboard() methods

### PHASE 2: HIGH (This Week)
5. Create OfficerNameCacheService
6. Optimize LoanApplicationMapper
7. Add @BatchSize annotations
8. Configure Hibernate batch fetching

### PHASE 3: MEDIUM (Next Week)
9. Optimize document verification
10. Add caching for frequent queries
11. Add performance tests
12. Monitor production queries

---

## 📝 FILES THAT NEED CHANGES

### Repositories (Add JOIN FETCH):
- ✅ LoanApplicationRepository.java
- ❌ LoanDocumentRepository.java
- ❌ OfficerPersonalDetailsRepository.java

### Services (Refactor):
- ❌ LoanOfficerServiceImpl.java
- ❌ ComplianceOfficerServiceImpl.java
- ❌ LoanApplicationServiceImpl.java

### Mappers (Optimize):
- ❌ LoanApplicationMapper.java
- ❌ LoanDocumentMapper.java

### Configuration:
- ❌ application.properties (add batch fetch config)

### Entities (Add @BatchSize):
- ❌ LoanApplication.java
- ❌ LoanDocument.java

---

**NEXT STEP:** Implement Phase 1 critical fixes immediately!
