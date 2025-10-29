import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, timeout, retry } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * GET request
   */
  get<T>(endpoint: string, params?: any): Observable<T> {
    const httpParams = this.buildHttpParams(params);
    
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, { params: httpParams })
      .pipe(
        timeout(environment.api.timeout),
        retry(environment.api.retryAttempts),
        catchError(this.handleError)
      );
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, data?: any, options?: { headers?: any; params?: any }): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, data, options)
      .pipe(
        timeout(environment.api.timeout),
        catchError(this.handleError)
      );
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, data?: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, data)
      .pipe(
        timeout(environment.api.timeout),
        catchError(this.handleError)
      );
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`)
      .pipe(
        timeout(environment.api.timeout),
        catchError(this.handleError)
      );
  }

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, data?: any): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${endpoint}`, data)
      .pipe(
        timeout(environment.api.timeout),
        catchError(this.handleError)
      );
  }

  /**
   * File upload
   */
  uploadFile<T>(endpoint: string, file: File, additionalData?: any): Observable<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    return this.http.post<T>(`${this.baseUrl}${endpoint}`, formData)
      .pipe(
        timeout(environment.api.timeout * 2), // Longer timeout for file uploads
        catchError(this.handleError)
      );
  }

  /**
   * Multiple file upload
   */
  uploadMultipleFiles<T>(endpoint: string, files: File[], additionalData?: any): Observable<T> {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append('files', file);
    });
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        if (Array.isArray(additionalData[key])) {
          additionalData[key].forEach((item: any) => {
            formData.append(key, item);
          });
        } else {
          formData.append(key, additionalData[key]);
        }
      });
    }

    return this.http.post<T>(`${this.baseUrl}${endpoint}`, formData)
      .pipe(
        timeout(environment.api.timeout * 3), // Even longer timeout for multiple files
        catchError(this.handleError)
      );
  }

  /**
   * Download file
   */
  downloadFile(endpoint: string, filename?: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}${endpoint}`, { 
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Build HTTP params from object
   */
  private buildHttpParams(params?: any): HttpParams {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(item => {
              httpParams = httpParams.append(key, item.toString());
            });
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }
    
    return httpParams;
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => error);
  }

  /**
   * Helper method to extract data from ApiResponse
   */
  extractData<T>(response: ApiResponse<T>): T {
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'API response indicates failure');
  }

  /**
   * Helper method for paginated responses
   */
  extractPaginatedData<T>(response: PaginatedResponse<T>): T[] {
    return response.content || [];
  }
}
