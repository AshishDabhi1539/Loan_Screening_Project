/**
 * User Models
 * All user profile-related interfaces and types
 */

/**
 * User profile interface
 */
export interface UserProfile {
  id: string;
  email: string;
  role: string;
  status: string;
  displayName?: string;
  hasPersonalDetails: boolean;
  requiresPersonalDetails: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

/**
 * Personal details request
 */
export interface PersonalDetailsRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  phoneNumber: string;
  alternatePhoneNumber?: string;
  panNumber: string;
  aadhaarNumber: string;
  currentAddress: AddressRequest;
  permanentAddress?: AddressRequest;
  sameAsPermanent: boolean;
}

/**
 * Address request
 */
export interface AddressRequest {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

/**
 * Personal details response
 */
export interface PersonalDetailsResponse {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName: string;
  dateOfBirth: Date;
  gender: string;
  maritalStatus: string;
  phoneNumber: string;
  alternatePhoneNumber?: string;
  panNumber: string;
  aadhaarNumber: string;
  currentAddress: AddressResponse;
  permanentAddress?: AddressResponse;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Address response
 */
export interface AddressResponse {
  id: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

