import { Component, OnInit, inject, signal, computed, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LoanEligibilityService } from '../../../core/services/loan-eligibility.service';
import { FOIRCalculationResponse } from '../../../core/models/eligibility.model';

@Component({
  selector: 'app-foir-calculator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
      <div class="flex items-center mb-4">
        <div class="text-2xl mr-3">📊</div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900">FOIR Calculator</h3>
          <p class="text-xs text-gray-600">Fixed Obligation to Income Ratio</p>
        </div>
      </div>

      <form [formGroup]="calculatorForm" class="space-y-4">
        <!-- Monthly Income -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Monthly Income *
          </label>
          <div class="relative">
            <span class="absolute left-3 top-2.5 text-gray-500">₹</span>
            <input 
              type="number" 
              formControlName="monthlyIncome"
              class="w-full pl-8 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="80,000"
              (input)="onInputChange()">
          </div>
        </div>

        <!-- Existing Obligations -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Existing EMIs (if any)
          </label>
          <div class="relative">
            <span class="absolute left-3 top-2.5 text-gray-500">₹</span>
            <input 
              type="number" 
              formControlName="existingObligations"
              class="w-full pl-8 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="10,000"
              (input)="onInputChange()">
          </div>
        </div>

        <!-- New EMI -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            New EMI (Estimated)
          </label>
          <div class="relative">
            <span class="absolute left-3 top-2.5 text-gray-500">₹</span>
            <input 
              type="number" 
              formControlName="newEmi"
              class="w-full pl-8 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="16,000"
              (input)="onInputChange()">
          </div>
        </div>

        <!-- Calculate Button -->
        <button 
          type="button" 
          (click)="calculateFOIR()"
          [disabled]="!calculatorForm.valid || isCalculating()"
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
          @if (isCalculating()) {
            <span class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
          }
          Calculate FOIR
        </button>
      </form>

      <!-- Results -->
      @if (foirResult()) {
        <div class="mt-6 space-y-4">
          <!-- Summary Cards -->
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-white rounded-lg p-3 border">
              <div class="text-xs text-gray-600">Total Income</div>
              <div class="text-lg font-semibold text-gray-900">
                ₹{{ foirResult()!.monthlyIncome.toLocaleString('en-IN') }}
              </div>
            </div>
            <div class="bg-white rounded-lg p-3 border">
              <div class="text-xs text-gray-600">Total Obligations</div>
              <div class="text-lg font-semibold text-gray-900">
                ₹{{ foirResult()!.totalObligations.toLocaleString('en-IN') }}
              </div>
            </div>
          </div>

          <!-- FOIR Percentage -->
          <div class="bg-white rounded-lg p-4 border-2" 
            [class.border-green-500]="foirResult()!.status === 'EXCELLENT' || foirResult()!.status === 'GOOD'"
            [class.border-yellow-500]="foirResult()!.status === 'ACCEPTABLE'"
            [class.border-red-500]="foirResult()!.status === 'HIGH_RISK'">
            
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700">FOIR</span>
              <span class="text-2xl font-bold" 
                [class.text-green-600]="foirResult()!.status === 'EXCELLENT' || foirResult()!.status === 'GOOD'"
                [class.text-yellow-600]="foirResult()!.status === 'ACCEPTABLE'"
                [class.text-red-600]="foirResult()!.status === 'HIGH_RISK'">
                {{ foirResult()!.foirPercentage.toFixed(1) }}%
              </span>
            </div>

            <!-- Progress Bar -->
            <div class="w-full bg-gray-200 rounded-full h-3 mb-3">
              <div 
                class="h-3 rounded-full transition-all duration-500"
                [class.bg-green-500]="foirResult()!.status === 'EXCELLENT' || foirResult()!.status === 'GOOD'"
                [class.bg-yellow-500]="foirResult()!.status === 'ACCEPTABLE'"
                [class.bg-red-500]="foirResult()!.status === 'HIGH_RISK'"
                [style.width.%]="Math.min(foirResult()!.foirPercentage, 100)">
              </div>
            </div>

            <!-- Status Badge -->
            <div class="flex items-center justify-between">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                [class.bg-green-100]="foirResult()!.status === 'EXCELLENT' || foirResult()!.status === 'GOOD'"
                [class.text-green-800]="foirResult()!.status === 'EXCELLENT' || foirResult()!.status === 'GOOD'"
                [class.bg-yellow-100]="foirResult()!.status === 'ACCEPTABLE'"
                [class.text-yellow-800]="foirResult()!.status === 'ACCEPTABLE'"
                [class.bg-red-100]="foirResult()!.status === 'HIGH_RISK'"
                [class.text-red-800]="foirResult()!.status === 'HIGH_RISK'">
                @if (foirResult()!.acceptable) {
                  ✓ {{ foirResult()!.status }}
                } @else {
                  ✗ {{ foirResult()!.status }}
                }
              </span>
            </div>
          </div>

          <!-- Message -->
          <div class="text-sm p-3 rounded-lg"
            [class.bg-green-50]="foirResult()!.status === 'EXCELLENT' || foirResult()!.status === 'GOOD'"
            [class.text-green-700]="foirResult()!.status === 'EXCELLENT' || foirResult()!.status === 'GOOD'"
            [class.bg-yellow-50]="foirResult()!.status === 'ACCEPTABLE'"
            [class.text-yellow-700]="foirResult()!.status === 'ACCEPTABLE'"
            [class.bg-red-50]="foirResult()!.status === 'HIGH_RISK'"
            [class.text-red-700]="foirResult()!.status === 'HIGH_RISK'">
            {{ foirResult()!.message }}
          </div>

          <!-- Disposable Income -->
          <div class="bg-white rounded-lg p-3 border">
            <div class="text-xs text-gray-600 mb-1">Disposable Income (After EMIs)</div>
            <div class="text-xl font-semibold"
              [class.text-green-600]="foirResult()!.disposableIncome > 20000"
              [class.text-yellow-600]="foirResult()!.disposableIncome > 10000 && foirResult()!.disposableIncome <= 20000"
              [class.text-red-600]="foirResult()!.disposableIncome <= 10000">
              ₹{{ foirResult()!.disposableIncome.toLocaleString('en-IN') }}
            </div>
          </div>

          <!-- Guidelines -->
          <div class="bg-blue-50 border-l-4 border-blue-500 p-3 text-xs">
            <p class="font-semibold text-blue-900 mb-1">FOIR Guidelines:</p>
            <ul class="text-blue-700 space-y-1 ml-4 list-disc">
              <li>0-40%: Excellent financial health</li>
              <li>40-55%: Good repayment capacity</li>
              <li>55-70%: Acceptable (meets criteria)</li>
              <li>70%+: High risk (may be rejected)</li>
            </ul>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class FoirCalculatorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private eligibilityService = inject(LoanEligibilityService);

  // Inputs for pre-filling
  monthlyIncome = input<number>(0);
  existingObligations = input<number>(0);
  newEmi = input<number>(0);

  calculatorForm!: FormGroup;
  isCalculating = signal(false);
  foirResult = signal<FOIRCalculationResponse | null>(null);

  // For template
  Math = Math;

  constructor() {
    // Watch for input changes and pre-fill form
    effect(() => {
      if (this.monthlyIncome() > 0) {
        this.calculatorForm?.patchValue({
          monthlyIncome: this.monthlyIncome(),
          existingObligations: this.existingObligations(),
          newEmi: this.newEmi()
        });
        
        // Auto-calculate if all values provided
        if (this.monthlyIncome() > 0 && this.newEmi() > 0) {
          this.calculateFOIR();
        }
      }
    });
  }

  ngOnInit(): void {
    this.calculatorForm = this.fb.group({
      monthlyIncome: [0, [Validators.required, Validators.min(1)]],
      existingObligations: [0, [Validators.min(0)]],
      newEmi: [0, [Validators.required, Validators.min(1)]]
    });
  }

  /**
   * Handle input changes for real-time calculation
   */
  onInputChange(): void {
    // Optional: Could trigger auto-calculate on change
    // For now, user clicks button
  }

  /**
   * Calculate FOIR
   */
  calculateFOIR(): void {
    if (!this.calculatorForm.valid) {
      return;
    }

    this.isCalculating.set(true);
    const values = this.calculatorForm.value;

    this.eligibilityService.calculateFOIR(
      values.monthlyIncome,
      values.existingObligations || 0,
      values.newEmi
    ).subscribe({
      next: (response) => {
        this.foirResult.set(response);
        this.isCalculating.set(false);
      },
      error: (error) => {
        console.error('Failed to calculate FOIR:', error);
        this.isCalculating.set(false);
        
        // Fallback: Calculate locally
        const totalObligations = (values.existingObligations || 0) + values.newEmi;
        const foirPercentage = (totalObligations / values.monthlyIncome) * 100;
        const acceptable = foirPercentage <= 70;
        
        let status: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'HIGH_RISK';
        if (foirPercentage <= 40) status = 'EXCELLENT';
        else if (foirPercentage <= 55) status = 'GOOD';
        else if (foirPercentage <= 70) status = 'ACCEPTABLE';
        else status = 'HIGH_RISK';
        
        this.foirResult.set({
          monthlyIncome: values.monthlyIncome,
          existingObligations: values.existingObligations || 0,
          newEmi: values.newEmi,
          totalObligations,
          disposableIncome: values.monthlyIncome - totalObligations,
          foirPercentage: Math.round(foirPercentage * 100) / 100,
          acceptable,
          status,
          message: acceptable ? 'You meet the FOIR criteria.' : 'FOIR exceeds recommended limit.'
        });
      }
    });
  }
}
