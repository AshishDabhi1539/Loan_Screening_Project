# Employment Type Specific Tables - Optimized Database Design

## Overview
Instead of having a single bloated table with many nullable fields, we've created **separate normalized tables** for each employment type. This follows database best practices and improves:
- ✅ Data integrity
- ✅ Storage efficiency
- ✅ Query performance
- ✅ Maintainability

## Table Relationships

```
ApplicantFinancialProfile (Main Table)
    │
    ├── ProfessionalEmploymentDetails (1:1, optional)
    ├── FreelancerEmploymentDetails (1:1, optional)
    ├── RetiredEmploymentDetails (1:1, optional)
    └── StudentEmploymentDetails (1:1, optional)
```

**Rule**: Only ONE of the specific detail tables will have data based on `employmentType`.

---

## Table Details

### 1. **professional_employment_details**
**For**: Doctors, Lawyers, CAs, Architects, Engineers, Consultants

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | BIGINT | ✅ | Primary Key |
| financial_profile_id | BIGINT | ✅ | FK to applicant_financial_profile |
| profession_type | VARCHAR(50) | ✅ | DOCTOR, LAWYER, CA, ARCHITECT, etc. |
| registration_number | VARCHAR(100) | ✅ | License/Registration number |
| registration_authority | VARCHAR(200) | ✅ | Medical Council, Bar Council, etc. |
| professional_qualification | VARCHAR(150) | ✅ | MBBS, LLB, CA, etc. |
| university | VARCHAR(200) | ❌ | Educational institution |
| year_of_qualification | INT | ❌ | Year of degree |
| practice_area | VARCHAR(200) | ❌ | Specialization |
| clinic_or_firm_name | VARCHAR(150) | ❌ | Practice/Clinic name |
| clinic_or_firm_address | VARCHAR(200) | ❌ | Practice address |
| additional_certifications | TEXT | ❌ | Extra qualifications |

---

### 2. **freelancer_employment_details**
**For**: Independent contractors and consultants

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | BIGINT | ✅ | Primary Key |
| financial_profile_id | BIGINT | ✅ | FK to applicant_financial_profile |
| freelance_type | VARCHAR(150) | ✅ | Web Dev, Content Writing, etc. |
| freelance_since | DATE | ✅ | Start date of freelancing |
| primary_clients | TEXT | ✅ | Top 3-5 client names |
| average_monthly_income | DECIMAL(12,2) | ❌ | Last 6 months average |
| portfolio_url | VARCHAR(255) | ❌ | Portfolio website |
| freelance_platform | VARCHAR(200) | ❌ | Upwork, Fiverr, etc. |
| skill_set | TEXT | ❌ | Key skills |
| project_types | TEXT | ❌ | Types of projects |
| active_clients_count | INT | ❌ | Number of active clients |
| payment_methods | TEXT | ❌ | How clients pay |

---

### 3. **retired_employment_details**
**For**: Pensioners and retirees

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | BIGINT | ✅ | Primary Key |
| financial_profile_id | BIGINT | ✅ | FK to applicant_financial_profile |
| pension_type | VARCHAR(50) | ✅ | GOVERNMENT, PRIVATE, PPF, etc. |
| pension_provider | VARCHAR(200) | ✅ | Pension organization |
| ppo_number | VARCHAR(100) | ❌ | Pension Payment Order |
| monthly_pension_amount | DECIMAL(12,2) | ✅ | Monthly pension |
| retirement_date | DATE | ✅ | Date of retirement |
| previous_employer | VARCHAR(200) | ✅ | Last employer |
| previous_designation | VARCHAR(100) | ✅ | Last job title |
| years_of_service | INT | ❌ | Total years worked |
| pension_account_number | VARCHAR(50) | ❌ | Pension account |
| pension_bank_name | VARCHAR(150) | ❌ | Pension bank |
| additional_retirement_benefits | TEXT | ❌ | Medical, gratuity, etc. |
| gratuity_amount | DECIMAL(12,2) | ❌ | One-time gratuity |

---

### 4. **student_employment_details**
**For**: Students (Education Loans)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | BIGINT | ✅ | Primary Key |
| financial_profile_id | BIGINT | ✅ | FK to applicant_financial_profile |
| **EDUCATION DETAILS** | | | |
| institution_name | VARCHAR(200) | ✅ | College/University |
| institution_address | VARCHAR(200) | ❌ | Full address |
| institution_city | VARCHAR(100) | ❌ | City |
| institution_state | VARCHAR(50) | ❌ | State |
| course_name | VARCHAR(150) | ✅ | B.Tech, MBA, etc. |
| specialization | VARCHAR(100) | ❌ | Major/Stream |
| year_of_study | INT | ✅ | Current year (1-4) |
| total_course_duration | INT | ✅ | Total years |
| expected_graduation_year | INT | ✅ | Completion year |
| student_id_number | VARCHAR(50) | ❌ | Roll number |
| current_cgpa | DECIMAL(12,2) | ❌ | Current GPA |
| **GUARDIAN DETAILS** | | | |
| guardian_name | VARCHAR(150) | ✅ | Parent/Guardian name |
| guardian_relation | VARCHAR(50) | ✅ | FATHER, MOTHER, etc. |
| guardian_occupation | VARCHAR(150) | ✅ | Guardian's job |
| guardian_employer | VARCHAR(200) | ✅ | Guardian's company |
| guardian_designation | VARCHAR(100) | ❌ | Guardian's title |
| guardian_monthly_income | DECIMAL(12,2) | ✅ | Guardian's income |
| guardian_annual_income | DECIMAL(12,2) | ❌ | Yearly income |
| guardian_contact | VARCHAR(15) | ✅ | Guardian's phone |
| guardian_email | VARCHAR(150) | ❌ | Guardian's email |
| guardian_address | VARCHAR(200) | ❌ | Guardian's address |
| guardian_city | VARCHAR(100) | ❌ | City |
| guardian_state | VARCHAR(50) | ❌ | State |
| guardian_pincode | VARCHAR(10) | ❌ | PIN |
| guardian_pan_number | VARCHAR(20) | ❌ | PAN for verification |
| guardian_aadhar_number | VARCHAR(20) | ❌ | Aadhar |
| **FINANCIAL SUPPORT** | | | |
| scholarship_amount | DECIMAL(12,2) | ❌ | Scholarship received |
| scholarship_provider | VARCHAR(200) | ❌ | Scholarship source |
| family_savings_for_education | DECIMAL(12,2) | ❌ | Savings allocated |
| additional_financial_support | TEXT | ❌ | Other sources |

---

## Database Migration Notes

### Step 1: Run Database Migration
The Spring Boot application will automatically create these tables on startup if they don't exist.

### Step 2: Update DTOs
Create separate DTOs for each employment type:
- `ProfessionalEmploymentDetailsDTO`
- `FreelancerEmploymentDetailsDTO`
- `RetiredEmploymentDetailsDTO`
- `StudentEmploymentDetailsDTO`

### Step 3: Update Service Layer
Update `ApplicantFinancialProfileService` to handle CRUD operations for type-specific tables.

### Step 4: Update Controllers
Add endpoints to save/update employment type specific details.

---

## Benefits of This Design

✅ **No NULL Values**: Each table only contains relevant fields
✅ **Type Safety**: Enforced at database level
✅ **Better Indexing**: Smaller tables = faster queries
✅ **Clear Relationships**: Easy to understand and maintain
✅ **Scalability**: Easy to add new employment types
✅ **Data Integrity**: Foreign key constraints ensure consistency

---

## Frontend Integration

The frontend form fields are already compatible with this design. The backend will:
1. Save common fields to `applicant_financial_profile`
2. Save type-specific fields to the appropriate detail table
3. Use `employmentType` to determine which detail table to use

---

## Next Steps

1. ✅ Create entities (DONE)
2. ⏳ Create DTOs
3. ⏳ Update Service layer
4. ⏳ Update Controller endpoints
5. ⏳ Test with frontend

---

**Author**: Cascade AI Assistant  
**Date**: October 30, 2025  
**Status**: Entities Created ✅ | Integration Pending ⏳
