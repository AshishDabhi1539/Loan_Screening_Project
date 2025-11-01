import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

import { NotificationService } from '../../../../core/services/notification.service';
import { LoanOfficerService, ExternalVerificationResponse } from '../../../../core/services/loan-officer.service';

@Component({
  selector: 'app-external-verification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './external-verification.component.html',
  styleUrl: './external-verification.component.css'
})
export class ExternalVerificationComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);
  private loanOfficerService = inject(LoanOfficerService);

  isLoading = signal(false);
  isTriggering = signal(false);
  isCompleting = signal(false);
  verificationResult = signal<ExternalVerificationResponse | null>(null);
  applicationId = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.applicationId.set(id);
      this.loadVerificationStatus();
    } else {
      this.notificationService.error('Error', 'Application ID is missing');
      this.router.navigate(['/loan-officer/applications/assigned']);
    }
  }

  /**
   * Load verification status
   */
  private loadVerificationStatus(): void {
    // Implementation depends on backend API
    // For now, we'll trigger verification on component load
  }

  /**
   * Trigger external verification
   */
  triggerVerification(): void {
    const appId = this.applicationId();
    if (!appId) return;

    this.isTriggering.set(true);
    this.loanOfficerService.triggerExternalVerification(appId).subscribe({
      next: () => {
        this.notificationService.success(
          'Verification Triggered',
          'External verification has been triggered successfully.'
        );
        this.isTriggering.set(false);
        // Wait a moment then complete verification
        setTimeout(() => this.completeVerification(), 2000);
      },
      error: (error) => {
        console.error('Error triggering verification:', error);
        this.notificationService.error(
          'Verification Failed',
          'Failed to trigger external verification.'
        );
        this.isTriggering.set(false);
      }
    });
  }

  /**
   * Complete external verification
   */
  completeVerification(): void {
    const appId = this.applicationId();
    if (!appId) return;

    this.isCompleting.set(true);
    this.loanOfficerService.completeExternalVerification(appId).subscribe({
      next: (result) => {
        this.verificationResult.set(result);
        this.isCompleting.set(false);
        this.notificationService.success(
          'Verification Complete',
          'External verification completed successfully.'
        );
      },
      error: (error) => {
        console.error('Error completing verification:', error);
        this.notificationService.error(
          'Verification Failed',
          'Failed to complete external verification.'
        );
        this.isCompleting.set(false);
      }
    });
  }

  /**
   * Navigate back to application details
   */
  viewApplicationDetails(): void {
    const appId = this.applicationId();
    if (appId) {
      this.router.navigate(['/loan-officer/application', appId, 'details']);
    } else {
      this.router.navigate(['/loan-officer/applications/assigned']);
    }
  }

  /**
   * Get risk level badge class
   */
  getRiskLevelBadgeClass(riskLevel: string): string {
    return this.loanOfficerService.getRiskLevelBadgeClass(riskLevel);
  }
}
