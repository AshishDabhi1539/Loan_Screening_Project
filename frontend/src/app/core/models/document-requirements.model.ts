/**
 * CENTRALIZED DOCUMENT REQUIREMENTS CONFIGURATION
 * This file defines all document requirements for different employment types
 * Used by both Applicant (upload) and Loan Officer (verification) modules
 * Location: core/models (shared across all modules)
 */

export interface DocumentRequirement {
  documentType: string;
  categoryId: string;
  categoryName: string;
  displayName: string;
  description: string;
  required: boolean;
  maxFiles: number;
  maxFileSize: number; // in MB
  acceptedTypes: string[];
  icon: string;
}

export interface CategoryRequirement {
  id: string;
  name: string;
  description: string;
  required: boolean;
  icon: string;
  documents: DocumentRequirement[];
}

/**
 * Base documents required for ALL applicants regardless of employment type
 */
export const BASE_DOCUMENT_REQUIREMENTS: CategoryRequirement[] = [
  {
    id: 'identity',
    name: 'Identity Verification',
    description: 'Government-issued identity documents',
    required: true,
    icon: '🆔',
    documents: [
      {
        documentType: 'AADHAAR_CARD',
        categoryId: 'identity',
        categoryName: 'Identity Verification',
        displayName: 'Aadhaar Card',
        description: 'Aadhaar card (front and back)',
        required: true,
        maxFiles: 1,
        maxFileSize: 5,
        acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        icon: '🆔'
      },
      {
        documentType: 'PAN_CARD',
        categoryId: 'identity',
        categoryName: 'Identity Verification',
        displayName: 'PAN Card',
        description: 'Permanent Account Number card',
        required: true,
        maxFiles: 1,
        maxFileSize: 5,
        acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        icon: '💳'
      },
      {
        documentType: 'PHOTOGRAPH',
        categoryId: 'identity',
        categoryName: 'Identity Verification',
        displayName: 'Photograph',
        description: 'Recent passport-size photograph',
        required: true,
        maxFiles: 1,
        maxFileSize: 2,
        acceptedTypes: ['image/jpeg', 'image/png'],
        icon: '📷'
      },
      {
        documentType: 'VOTER_ID',
        categoryId: 'identity',
        categoryName: 'Identity Verification',
        displayName: 'Voter ID',
        description: 'Voter ID card (optional alternative)',
        required: false,
        maxFiles: 1,
        maxFileSize: 5,
        acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        icon: '🗳️'
      },
      {
        documentType: 'DRIVING_LICENSE',
        categoryId: 'identity',
        categoryName: 'Identity Verification',
        displayName: 'Driving License',
        description: 'Driving license (optional alternative)',
        required: false,
        maxFiles: 1,
        maxFileSize: 5,
        acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        icon: '🚗'
      }
    ]
  },
  {
    id: 'address',
    name: 'Address Verification',
    description: 'Proof of current residential address',
    required: true,
    icon: '🏠',
    documents: [
      {
        documentType: 'UTILITY_BILL',
        categoryId: 'address',
        categoryName: 'Address Verification',
        displayName: 'Utility Bill',
        description: 'Electricity/Water/Gas bill (within last 3 months)',
        required: true,
        maxFiles: 1,
        maxFileSize: 5,
        acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        icon: '📄'
      },
      {
        documentType: 'RENTAL_AGREEMENT',
        categoryId: 'address',
        categoryName: 'Address Verification',
        displayName: 'Rental Agreement',
        description: 'Rent agreement (optional alternative)',
        required: false,
        maxFiles: 1,
        maxFileSize: 5,
        acceptedTypes: ['application/pdf'],
        icon: '📝'
      }
    ]
  }
];

/**
 * Employment-specific document requirements for SALARIED employees
 */
export const SALARIED_REQUIREMENTS: CategoryRequirement[] = [
  {
    id: 'employment',
    name: 'Employment Verification',
    description: 'Employment proof documents',
    required: true,
    icon: '💼',
    documents: [
      {
        documentType: 'SALARY_SLIP',
        categoryId: 'employment',
        categoryName: 'Employment Verification',
        displayName: 'Salary Slips',
        description: 'Last 3 months salary slips',
        required: true,
        maxFiles: 3,
        maxFileSize: 5,
        acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        icon: '💰'
      },
      {
        documentType: 'APPOINTMENT_LETTER',
        categoryId: 'employment',
        categoryName: 'Employment Verification',
        displayName: 'Appointment Letter',
        description: 'Employment/Appointment letter',
        required: true,
        maxFiles: 1,
        maxFileSize: 5,
        acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        icon: '📄'
      },
      {
        documentType: 'EMPLOYMENT_CERTIFICATE',
        categoryId: 'employment',
        categoryName: 'Employment Verification',
        displayName: 'Employment Certificate',
        description: 'Employment certificate (optional)',
        required: false,
        maxFiles: 1,
        maxFileSize: 5,
        acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        icon: '📜'
      }
    ]
  },
  {
    id: 'income',
    name: 'Income Verification',
    description: 'Income proof documents',
    required: true,
    icon: '💰',
    documents: [
      {
        documentType: 'BANK_STATEMENT',
        categoryId: 'income',
        categoryName: 'Income Verification',
        displayName: 'Bank Statement',
        description: 'Last 6 months bank statement',
        required: true,
        maxFiles: 1,
        maxFileSize: 10,
        acceptedTypes: ['application/pdf'],
        icon: '🏦'
      },
      {
        documentType: 'FORM_16',
        categoryId: 'income',
        categoryName: 'Income Verification',
        displayName: 'Form 16',
        description: 'Form 16 (optional)',
        required: false,
        maxFiles: 1,
        maxFileSize: 5,
        acceptedTypes: ['application/pdf'],
        icon: '📋'
      }
    ]
  }
];

/**
 * Employment-specific document requirements for SELF-EMPLOYED
 */
export const SELF_EMPLOYED_REQUIREMENTS: CategoryRequirement[] = [
  {
    id: 'employment',
    name: 'Business Verification',
    description: 'Business registration documents',
    required: true,
    icon: '💼',
    documents: [
      {
        documentType: 'BUSINESS_REGISTRATION',
        categoryId: 'employment',
        categoryName: 'Business Verification',
        displayName: 'Business Registration',
        description: 'Shop Act/MSME/Trade License',
        required: true,
        maxFiles: 1,
        maxFileSize: 5,
        acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        icon: '📝'
      },
      {
        documentType: 'GST_CERTIFICATE',
        categoryId: 'employment',
        categoryName: 'Business Verification',
        displayName: 'GST Certificate',
        description: 'GST registration certificate (if applicable)',
        required: false,
        maxFiles: 1,
        maxFileSize: 5,
        acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        icon: '📋'
      }
    ]
  },
  {
    id: 'income',
    name: 'Income Verification',
    description: 'Income and financial documents',
    required: true,
    icon: '💰',
    documents: [
      {
        documentType: 'ITR_FORM',
        categoryId: 'income',
        categoryName: 'Income Verification',
        displayName: 'Income Tax Returns',
        description: 'ITR for last 2 years',
        required: true,
        maxFiles: 2,
        maxFileSize: 5,
        acceptedTypes: ['application/pdf'],
        icon: '📊'
      },
      {
        documentType: 'BUSINESS_BANK_STATEMENT',
        categoryId: 'income',
        categoryName: 'Income Verification',
        displayName: 'Business Bank Statement',
        description: 'Last 12 months business bank statement',
        required: true,
        maxFiles: 1,
        maxFileSize: 10,
        acceptedTypes: ['application/pdf'],
        icon: '🏦'
      }
    ]
  }
];

/**
 * Employment-specific document requirements for BUSINESS_OWNER
 */
export const BUSINESS_OWNER_REQUIREMENTS: CategoryRequirement[] = [
  {
    id: 'employment',
    name: 'Business Verification',
    description: 'Company registration and compliance documents',
    required: true,
    icon: '🏢',
    documents: [
      {
        documentType: 'BUSINESS_REGISTRATION',
        categoryId: 'employment',
        categoryName: 'Business Verification',
        displayName: 'Business Registration',
        description: 'Company registration certificate (ROC)',
        required: true,
        maxFiles: 1,
        maxFileSize: 5,
        acceptedTypes: ['application/pdf'],
        icon: '📝'
      },
      {
        documentType: 'GST_CERTIFICATE',
        categoryId: 'employment',
        categoryName: 'Business Verification',
        displayName: 'GST Certificate',
        description: 'GST registration certificate',
        required: true,
        maxFiles: 1,
        maxFileSize: 5,
        acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        icon: '📋'
      }
    ]
  },
  {
    id: 'income',
    name: 'Income & Financial Verification',
    description: 'Company financial documents',
    required: true,
    icon: '💰',
    documents: [
      {
        documentType: 'BUSINESS_ITR',
        categoryId: 'income',
        categoryName: 'Income & Financial Verification',
        displayName: 'Company ITR',
        description: 'Company ITR for last 2 years',
        required: true,
        maxFiles: 2,
        maxFileSize: 10,
        acceptedTypes: ['application/pdf'],
        icon: '📊'
      },
      {
        documentType: 'FINANCIAL_STATEMENT',
        categoryId: 'income',
        categoryName: 'Income & Financial Verification',
        displayName: 'Financial Statements',
        description: 'Audited financial statements',
        required: true,
        maxFiles: 2,
        maxFileSize: 10,
        acceptedTypes: ['application/pdf'],
        icon: '📈'
      },
      {
        documentType: 'PROFIT_LOSS_STATEMENT',
        categoryId: 'income',
        categoryName: 'Income & Financial Verification',
        displayName: 'Profit & Loss Statement',
        description: 'P&L statement for last 2 years',
        required: false,
        maxFiles: 2,
        maxFileSize: 10,
        acceptedTypes: ['application/pdf'],
        icon: '📉'
      },
      {
        documentType: 'BALANCE_SHEET',
        categoryId: 'income',
        categoryName: 'Income & Financial Verification',
        displayName: 'Balance Sheet',
        description: 'Balance sheet for last 2 years',
        required: false,
        maxFiles: 2,
        maxFileSize: 10,
        acceptedTypes: ['application/pdf'],
        icon: '⚖️'
      },
      {
        documentType: 'BUSINESS_BANK_STATEMENT',
        categoryId: 'income',
        categoryName: 'Income & Financial Verification',
        displayName: 'Business Bank Statement',
        description: 'Last 12 months business bank statement',
        required: true,
        maxFiles: 1,
        maxFileSize: 10,
        acceptedTypes: ['application/pdf'],
        icon: '🏦'
      }
    ]
  }
];

/**
 * Employment-specific document requirements for PROFESSIONAL
 */
export const PROFESSIONAL_REQUIREMENTS: CategoryRequirement[] = [
  {
    id: 'employment',
    name: 'Professional Verification',
    description: 'Professional qualification documents',
    required: true,
    icon: '👔',
    documents: [
      {
        documentType: 'EMPLOYMENT_CERTIFICATE',
        categoryId: 'employment',
        categoryName: 'Professional Verification',
        displayName: 'Professional License/Certificate',
        description: 'Professional qualification certificate (CA/Doctor/Lawyer/Engineer)',
        required: true,
        maxFiles: 1,
        maxFileSize: 5,
        acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        icon: '📜'
      }
    ]
  },
  {
    id: 'income',
    name: 'Income Verification',
    description: 'Income proof documents',
    required: true,
    icon: '💰',
    documents: [
      {
        documentType: 'ITR_FORM',
        categoryId: 'income',
        categoryName: 'Income Verification',
        displayName: 'Income Tax Returns',
        description: 'ITR for last 2 years',
        required: true,
        maxFiles: 2,
        maxFileSize: 5,
        acceptedTypes: ['application/pdf'],
        icon: '📊'
      },
      {
        documentType: 'BANK_STATEMENT',
        categoryId: 'income',
        categoryName: 'Income Verification',
        displayName: 'Bank Statement',
        description: 'Last 6 months bank statement',
        required: true,
        maxFiles: 1,
        maxFileSize: 10,
        acceptedTypes: ['application/pdf'],
        icon: '🏦'
      }
    ]
  }
];

/**
 * Employment-specific document requirements for FREELANCER
 */
export const FREELANCER_REQUIREMENTS: CategoryRequirement[] = [
  {
    id: 'income',
    name: 'Income Verification',
    description: 'Income proof documents',
    required: true,
    icon: '💰',
    documents: [
      {
        documentType: 'BANK_STATEMENT',
        categoryId: 'income',
        categoryName: 'Income Verification',
        displayName: 'Bank Statement',
        description: 'Last 6-12 months bank statement showing income',
        required: true,
        maxFiles: 1,
        maxFileSize: 10,
        acceptedTypes: ['application/pdf'],
        icon: '🏦'
      },
      {
        documentType: 'ITR_FORM',
        categoryId: 'income',
        categoryName: 'Income Verification',
        displayName: 'Income Tax Returns',
        description: 'ITR (if available)',
        required: false,
        maxFiles: 1,
        maxFileSize: 5,
        acceptedTypes: ['application/pdf'],
        icon: '📊'
      }
    ]
  }
];

/**
 * Employment-specific document requirements for RETIRED
 */
export const RETIRED_REQUIREMENTS: CategoryRequirement[] = [
  {
    id: 'employment',
    name: 'Pension Verification',
    description: 'Pension documents',
    required: true,
    icon: '👴',
    documents: [
      {
        documentType: 'EMPLOYMENT_CERTIFICATE',
        categoryId: 'employment',
        categoryName: 'Pension Verification',
        displayName: 'Pension Certificate',
        description: 'Pension order/PPO',
        required: true,
        maxFiles: 1,
        maxFileSize: 5,
        acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        icon: '📜'
      }
    ]
  },
  {
    id: 'income',
    name: 'Income Verification',
    description: 'Pension income proof',
    required: true,
    icon: '💰',
    documents: [
      {
        documentType: 'SALARY_SLIP',
        categoryId: 'income',
        categoryName: 'Income Verification',
        displayName: 'Pension Slips',
        description: 'Last 3 months pension slips',
        required: true,
        maxFiles: 3,
        maxFileSize: 5,
        acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        icon: '💵'
      },
      {
        documentType: 'BANK_STATEMENT',
        categoryId: 'income',
        categoryName: 'Income Verification',
        displayName: 'Bank Statement',
        description: 'Last 6 months bank statement showing pension credits',
        required: true,
        maxFiles: 1,
        maxFileSize: 10,
        acceptedTypes: ['application/pdf'],
        icon: '🏦'
      }
    ]
  }
];

/**
 * Employment-specific document requirements for STUDENT
 */
export const STUDENT_REQUIREMENTS: CategoryRequirement[] = [
  {
    id: 'employment',
    name: 'Student Verification',
    description: 'Student identification documents',
    required: true,
    icon: '🎓',
    documents: [
      {
        documentType: 'EMPLOYMENT_CERTIFICATE',
        categoryId: 'employment',
        categoryName: 'Student Verification',
        displayName: 'Student ID/Enrollment Certificate',
        description: 'College/University ID or enrollment certificate',
        required: true,
        maxFiles: 1,
        maxFileSize: 5,
        acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        icon: '🎓'
      }
    ]
  },
  {
    id: 'income',
    name: 'Co-Applicant Income Verification',
    description: 'Parent/Guardian income proof',
    required: true,
    icon: '💰',
    documents: [
      {
        documentType: 'CO_APPLICANT_INCOME',
        categoryId: 'income',
        categoryName: 'Co-Applicant Income Verification',
        displayName: 'Guardian Income Proof',
        description: 'Parent/Guardian salary slip or ITR',
        required: true,
        maxFiles: 1,
        maxFileSize: 5,
        acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        icon: '👨‍👩‍👦'
      }
    ]
  }
];

/**
 * Employment-specific document requirements for UNEMPLOYED
 */
export const UNEMPLOYED_REQUIREMENTS: CategoryRequirement[] = [
  // Only base documents required
];

/**
 * Get document requirements based on employment type
 */
export function getDocumentRequirements(employmentType: string): CategoryRequirement[] {
  const baseRequirements = [...BASE_DOCUMENT_REQUIREMENTS];
  
  switch (employmentType) {
    case 'SALARIED':
      return [...baseRequirements, ...SALARIED_REQUIREMENTS];
    case 'SELF_EMPLOYED':
      return [...baseRequirements, ...SELF_EMPLOYED_REQUIREMENTS];
    case 'BUSINESS_OWNER':
      return [...baseRequirements, ...BUSINESS_OWNER_REQUIREMENTS];
    case 'PROFESSIONAL':
      return [...baseRequirements, ...PROFESSIONAL_REQUIREMENTS];
    case 'FREELANCER':
      return [...baseRequirements, ...FREELANCER_REQUIREMENTS];
    case 'RETIRED':
      return [...baseRequirements, ...RETIRED_REQUIREMENTS];
    case 'STUDENT':
      return [...baseRequirements, ...STUDENT_REQUIREMENTS];
    case 'UNEMPLOYED':
      return [...baseRequirements, ...UNEMPLOYED_REQUIREMENTS];
    default:
      return baseRequirements;
  }
}

/**
 * Get all required document types for an employment type
 */
export function getRequiredDocumentTypes(employmentType: string): string[] {
  const requirements = getDocumentRequirements(employmentType);
  const requiredDocs: string[] = [];
  
  requirements.forEach(category => {
    category.documents.forEach(doc => {
      if (doc.required) {
        requiredDocs.push(doc.documentType);
      }
    });
  });
  
  return requiredDocs;
}

/**
 * Check if a document type is required for given employment type
 */
export function isDocumentRequired(documentType: string, employmentType: string): boolean {
  const requiredTypes = getRequiredDocumentTypes(employmentType);
  return requiredTypes.includes(documentType);
}

/**
 * Get category for a document type
 */
export function getDocumentCategory(documentType: string, employmentType: string): string {
  const requirements = getDocumentRequirements(employmentType);
  
  for (const category of requirements) {
    const doc = category.documents.find(d => d.documentType === documentType);
    if (doc) {
      return category.id;
    }
  }
  
  return 'other';
}
