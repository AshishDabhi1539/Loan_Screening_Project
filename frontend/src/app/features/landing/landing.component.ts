import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent implements OnInit {
  isAuthenticated = false;

  features = [
    {
      icon: 'shield-check',
      title: 'Secure & Trusted',
      description: 'Bank-grade security with 256-bit encryption to protect your data'
    },
    {
      icon: 'clock',
      title: 'Quick Processing',
      description: 'Get loan decisions in 24-48 hours with our automated screening'
    },
    {
      icon: 'chart',
      title: 'Smart Credit Scoring',
      description: 'Advanced AI-powered credit assessment for accurate decisions'
    },
    {
      icon: 'users',
      title: 'Expert Support',
      description: 'Dedicated loan officers to guide you through the process'
    }
  ];

  loanTypes = [
    {
      name: 'Personal Loan',
      rate: '10.49%',
      amount: 'Up to ₹50 Lakhs',
      tenure: '1-7 Years',
      icon: 'user'
    },
    {
      name: 'Home Loan',
      rate: '8.50%',
      amount: 'Up to ₹5 Crores',
      tenure: '5-30 Years',
      icon: 'home'
    },
    {
      name: 'Business Loan',
      rate: '11.99%',
      amount: 'Up to ₹2 Crores',
      tenure: '1-10 Years',
      icon: 'briefcase'
    },
    {
      name: 'Vehicle Loan',
      rate: '9.25%',
      amount: 'Up to ₹25 Lakhs',
      tenure: '1-7 Years',
      icon: 'car'
    }
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Just check authentication status, don't redirect
    // Let users access landing page even if authenticated
    this.isAuthenticated = this.authService.isAuthenticated();
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

