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
   * Navigate back to application review
   */
  viewApplicationDetails(): void {
    const appId = this.applicationId();
    if (appId) {
      this.router.navigate(['/loan-officer/application', appId, 'review']);
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

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    if (!amount) return '0';
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Parse risk factors string into structured data
   * Example input: "🚨 RED ALERT: Extremely high risk (100/100); Very poor credit score (390); Some missed payments (3); Some cheque bounces (2); Very high outstanding debt (₹4110000.00);"
   */
  parseRiskFactors(riskFactorsText: string): { 
    alertLevel: string; 
    riskScore: string; 
    factors: Array<{ icon: string; label: string; value: string; severity: 'critical' | 'high' | 'medium' | 'low' }> 
  } | null {
    if (!riskFactorsText) return null;

    try {
      // Extract alert level
      const alertMatch = riskFactorsText.match(/🚨\s*(RED ALERT|YELLOW ALERT|GREEN ALERT|ALERT)/i);
      const alertLevel = alertMatch ? alertMatch[1] : 'ALERT';

      // Extract risk score
      const riskScoreMatch = riskFactorsText.match(/risk\s*\((\d+\/\d+)\)/i);
      const riskScore = riskScoreMatch ? riskScoreMatch[1] : '';

      // Parse individual factors
      const factors: Array<{ icon: string; label: string; value: string; severity: 'critical' | 'high' | 'medium' | 'low' }> = [];

      // Credit Score
      const creditScoreMatch = riskFactorsText.match(/(Very poor|Poor|Fair|Good|Excellent)\s+credit score\s*\((\d+)\)/i);
      if (creditScoreMatch) {
        const score = parseInt(creditScoreMatch[2]);
        factors.push({
          icon: '📊',
          label: 'Credit Score',
          value: `${creditScoreMatch[1]} (${score})`,
          severity: score < 450 ? 'critical' : score < 550 ? 'high' : score < 650 ? 'medium' : 'low'
        });
      }

      // Missed Payments
      const missedPaymentsMatch = riskFactorsText.match(/(Some|Many|Few|No)\s+missed payments\s*\((\d+)\)/i);
      if (missedPaymentsMatch) {
        const count = parseInt(missedPaymentsMatch[2]);
        factors.push({
          icon: '⚠️',
          label: 'Missed Payments',
          value: `${count} payment${count !== 1 ? 's' : ''}`,
          severity: count > 5 ? 'critical' : count > 2 ? 'high' : count > 0 ? 'medium' : 'low'
        });
      }

      // Cheque Bounces
      const chequeBounceMatch = riskFactorsText.match(/(Some|Many|Few|No)\s+cheque bounces\s*\((\d+)\)/i);
      if (chequeBounceMatch) {
        const count = parseInt(chequeBounceMatch[2]);
        factors.push({
          icon: '💳',
          label: 'Cheque Bounces',
          value: `${count} bounce${count !== 1 ? 's' : ''}`,
          severity: count > 3 ? 'critical' : count > 1 ? 'high' : count > 0 ? 'medium' : 'low'
        });
      }

      // Outstanding Debt
      const debtMatch = riskFactorsText.match(/(Very high|High|Moderate|Low)\s+outstanding debt\s*\(₹([\d,]+(?:\.\d+)?)\)/i);
      if (debtMatch) {
        const amount = parseFloat(debtMatch[2].replace(/,/g, ''));
        factors.push({
          icon: '💰',
          label: 'Outstanding Debt',
          value: `₹${this.formatCurrency(amount)}`,
          severity: amount > 3000000 ? 'critical' : amount > 1500000 ? 'high' : amount > 500000 ? 'medium' : 'low'
        });
      }

      // Fraud Cases
      const fraudMatch = riskFactorsText.match(/(\d+)\s+active fraud case/i);
      if (fraudMatch) {
        const count = parseInt(fraudMatch[1]);
        if (count > 0) {
          factors.push({
            icon: '🚫',
            label: 'Active Fraud Cases',
            value: `${count} case${count !== 1 ? 's' : ''}`,
            severity: 'critical'
          });
        }
      }

      // Defaults
      if (riskFactorsText.match(/has\s+defaults/i)) {
        factors.push({
          icon: '❌',
          label: 'Default History',
          value: 'Defaults found',
          severity: 'critical'
        });
      }

      return { alertLevel, riskScore, factors };
    } catch (error) {
      console.error('Error parsing risk factors:', error);
      return null;
    }
  }

  /**
   * Get severity badge class
   */
  getSeverityClass(severity: 'critical' | 'high' | 'medium' | 'low'): string {
    const classes = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-green-100 text-green-800 border-green-300'
    };
    return classes[severity] || classes.medium;
  }
}
