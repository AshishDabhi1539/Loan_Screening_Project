import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EmploymentTypeEligibility, LoanEligibilityResponse, FOIRCalculationResponse } from '../models/eligibility.model';

@Injectable({
  providedIn: 'root'
})
export class LoanEligibilityService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/applicant/eligibility`;

  /**
   * Get eligible employment types for a loan type
   */
  getEligibleEmploymentTypes(loanType: string): Observable<LoanEligibilityResponse> {
    const params = new HttpParams().set('loanType', loanType);
    return this.http.get<LoanEligibilityResponse>(`${this.baseUrl}/employment-types`, { params });
  }

  /**
   * Calculate FOIR
   */
  calculateFOIR(monthlyIncome: number, existingObligations: number, newEmi: number): Observable<FOIRCalculationResponse> {
    const params = new HttpParams()
      .set('monthlyIncome', monthlyIncome.toString())
      .set('existingObligations', existingObligations.toString())
      .set('newEmi', newEmi.toString());
    
    return this.http.post<FOIRCalculationResponse>(`${this.baseUrl}/foir/calculate`, null, { params });
  }

  /**
   * Check eligibility for specific loan and employment type
   */
  checkEligibility(loanType: string, employmentType: string): Observable<any> {
    const params = new HttpParams()
      .set('loanType', loanType)
      .set('employmentType', employmentType);
    
    return this.http.get(`${this.baseUrl}/check`, { params });
  }

  /**
   * Get all criteria for a loan type
   */
  getLoanCriteria(loanType: string): Observable<any> {
    const params = new HttpParams().set('loanType', loanType);
    return this.http.get(`${this.baseUrl}/criteria`, { params });
  }
}
