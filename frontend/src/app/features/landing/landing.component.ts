import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface ScreeningData {
  loanType: string;
  monthlyIncome: number;
  employmentType: string;
  city: string;
}

interface EMIData {
  loanAmount: number;
  interestRate: number;
  loanTenure: number;
}

interface EMIResult {
  monthlyEMI: number;
  totalInterest: number;
  totalAmount: number;
}

interface Testimonial {
  name: string;
  role: string;
  content: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent implements OnInit {
  isAuthenticated = false;
  isScrolled = false;
  isScreeningLoading = false;
  
  screeningData: ScreeningData = {
    loanType: '',
    monthlyIncome: 0,
    employmentType: '',
    city: ''
  };

  emiData: EMIData = {
    loanAmount: 500000,
    interestRate: 10.5,
    loanTenure: 5
  };

  emiResult: EMIResult = {
    monthlyEMI: 0,
    totalInterest: 0,
    totalAmount: 0
  };

  features = [
    {
      icon: '💸',
      title: 'Instant Screening',
      description: 'Get results in less than 30 seconds — no paperwork required.'
    },
    {
      icon: '📊',
      title: 'Smart Comparison',
      description: 'Compare loan offers from top banks & NBFCs instantly.'
    },
    {
      icon: '🔒',
      title: '100% Secure',
      description: 'Your data is protected with advanced encryption.'
    },
    {
      icon: '⚡',
      title: 'Quick Processing',
      description: 'Get loan decisions in 24-48 hours with our automated screening.'
    }
  ];

  loanTypes = [
    {
      name: 'Personal Loan',
      rate: '10.49%',
      amount: 'Up to ₹50 Lakhs',
      tenure: '1-7 Years',
      icon: '👤'
    },
    {
      name: 'Education Loan',
      rate: '8.50%',
      amount: 'Up to ₹1 Crore',
      tenure: '5-15 Years',
      icon: '🎓'
    },
    {
      name: 'Business Loan',
      rate: '11.99%',
      amount: 'Up to ₹2 Crores',
      tenure: '1-10 Years',
      icon: '💼'
    },
    {
      name: 'Home Loan',
      rate: '8.25%',
      amount: 'Up to ₹5 Crores',
      tenure: '5-30 Years',
      icon: '🏠'
    }
  ];

  testimonials: Testimonial[] = [
    {
      name: 'Priya Sharma',
      role: 'Software Engineer',
      content: 'SLSP made my home loan process incredibly smooth. Got approved within 24 hours!'
    },
    {
      name: 'Rajesh Kumar',
      role: 'Business Owner',
      content: 'The comparison feature helped me find the best business loan rates. Highly recommended!'
    },
    {
      name: 'Anita Patel',
      role: 'Teacher',
      content: 'Simple, secure, and fast. Got my personal loan without any hassle.'
    }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.calculateEMI();
  }

  @HostListener('window:scroll', ['$event'])
  onScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  checkEligibility(): void {
    // Scroll to the screening form
    this.scrollToSection('loan-screening-form');
  }

  onScreeningSubmit(): void {
    if (this.isScreeningLoading) return;
    
    this.isScreeningLoading = true;
    
    // Simulate API call for screening
    setTimeout(() => {
      this.isScreeningLoading = false;
      // For now, just redirect to registration
      // In a real implementation, you would call the backend API
      this.navigateToRegister();
    }, 2000);
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  calculateEMI(): void {
    const principal = this.emiData.loanAmount;
    const rate = this.emiData.interestRate / 100 / 12; // Monthly interest rate
    const time = this.emiData.loanTenure * 12; // Total months

    if (rate === 0) {
      // If interest rate is 0
      this.emiResult.monthlyEMI = principal / time;
    } else {
      // EMI formula: [P x R x (1+R)^N] / [(1+R)^N - 1]
      const emi = (principal * rate * Math.pow(1 + rate, time)) / (Math.pow(1 + rate, time) - 1);
      this.emiResult.monthlyEMI = emi;
    }

    this.emiResult.totalAmount = this.emiResult.monthlyEMI * time;
    this.emiResult.totalInterest = this.emiResult.totalAmount - principal;
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  }
}

