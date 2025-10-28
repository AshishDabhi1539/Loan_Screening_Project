# 🏗️ **LOAN SCREENING APP - FRONTEND ARCHITECTURE**
## **Complete Angular Frontend Structure & Implementation Plan**

---

## **📁 COMPLETE FOLDER HIERARCHY**

```
frontend/src/
├── app/
│   ├── core/                           # Singleton services, guards, interceptors
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   ├── role.guard.ts
│   │   │   ├── email-verification.guard.ts
│   │   │   └── index.ts
│   │   ├── interceptors/
│   │   │   ├── auth.interceptor.ts
│   │   │   ├── error.interceptor.ts
│   │   │   ├── loading.interceptor.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── token.service.ts
│   │   │   ├── user.service.ts
│   │   │   ├── notification.service.ts
│   │   │   ├── loading.service.ts
│   │   │   └── index.ts
│   │   ├── models/
│   │   │   ├── user.model.ts
│   │   │   ├── auth.model.ts
│   │   │   ├── api-response.model.ts
│   │   │   └── index.ts
│   │   └── core.module.ts
│   │
│   ├── shared/                         # Reusable components, pipes, directives
│   │   ├── components/
│   │   │   ├── header/
│   │   │   │   ├── header.component.ts
│   │   │   │   ├── header.component.html
│   │   │   │   └── header.component.scss
│   │   │   ├── sidebar/
│   │   │   │   ├── sidebar.component.ts
│   │   │   │   ├── sidebar.component.html
│   │   │   │   └── sidebar.component.scss
│   │   │   ├── loading-spinner/
│   │   │   ├── confirmation-dialog/
│   │   │   ├── file-upload/
│   │   │   ├── data-table/
│   │   │   ├── status-badge/
│   │   │   ├── progress-stepper/
│   │   │   └── notification-toast/
│   │   ├── pipes/
│   │   │   ├── currency-format.pipe.ts
│   │   │   ├── date-format.pipe.ts
│   │   │   ├── status-format.pipe.ts
│   │   │   └── index.ts
│   │   ├── directives/
│   │   │   ├── highlight.directive.ts
│   │   │   ├── permission.directive.ts
│   │   │   └── index.ts
│   │   ├── validators/
│   │   │   ├── custom-validators.ts
│   │   │   ├── pan-validator.ts
│   │   │   ├── aadhaar-validator.ts
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── constants.ts
│   │   │   ├── helpers.ts
│   │   │   ├── date-utils.ts
│   │   │   └── index.ts
│   │   └── shared.module.ts
│   │
│   ├── features/                       # Feature modules (lazy loaded)
│   │   │
│   │   ├── auth/                       # Authentication Module
│   │   │   ├── components/
│   │   │   │   ├── login/
│   │   │   │   │   ├── login.component.ts
│   │   │   │   │   ├── login.component.html
│   │   │   │   │   └── login.component.scss
│   │   │   │   ├── register/
│   │   │   │   ├── forgot-password/
│   │   │   │   ├── verify-email/
│   │   │   │   ├── reset-password/
│   │   │   │   └── otp-verification/
│   │   │   ├── services/
│   │   │   │   └── auth-api.service.ts
│   │   │   ├── models/
│   │   │   │   ├── login.model.ts
│   │   │   │   ├── register.model.ts
│   │   │   │   └── index.ts
│   │   │   ├── auth-routing.module.ts
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── applicant/                  # Applicant Portal
│   │   │   ├── components/
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── dashboard.component.ts
│   │   │   │   │   ├── dashboard.component.html
│   │   │   │   │   └── dashboard.component.scss
│   │   │   │   ├── profile/
│   │   │   │   │   ├── personal-details/
│   │   │   │   │   ├── financial-profile/
│   │   │   │   │   └── profile-completion/
│   │   │   │   ├── loan-application/
│   │   │   │   │   ├── application-form/
│   │   │   │   │   │   ├── step1-personal/
│   │   │   │   │   │   ├── step2-financial/
│   │   │   │   │   │   ├── step3-employment/
│   │   │   │   │   │   ├── step4-documents/
│   │   │   │   │   │   ├── step5-review/
│   │   │   │   │   │   └── application-stepper/
│   │   │   │   │   ├── application-list/
│   │   │   │   │   ├── application-details/
│   │   │   │   │   └── application-status/
│   │   │   │   ├── documents/
│   │   │   │   │   ├── document-upload/
│   │   │   │   │   ├── document-list/
│   │   │   │   │   └── document-viewer/
│   │   │   │   └── notifications/
│   │   │   ├── services/
│   │   │   │   ├── applicant-api.service.ts
│   │   │   │   ├── loan-application.service.ts
│   │   │   │   ├── document.service.ts
│   │   │   │   └── profile.service.ts
│   │   │   ├── models/
│   │   │   │   ├── loan-application.model.ts
│   │   │   │   ├── personal-details.model.ts
│   │   │   │   ├── financial-profile.model.ts
│   │   │   │   └── index.ts
│   │   │   ├── applicant-routing.module.ts
│   │   │   └── applicant.module.ts
│   │   │
│   │   ├── loan-officer/               # Loan Officer Module
│   │   │   ├── components/
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── officer-dashboard/
│   │   │   │   │   ├── workload-summary/
│   │   │   │   │   └── recent-activities/
│   │   │   │   ├── application-review/
│   │   │   │   │   ├── application-queue/
│   │   │   │   │   ├── application-details/
│   │   │   │   │   ├── document-verification/
│   │   │   │   │   ├── external-verification/
│   │   │   │   │   ├── risk-assessment/
│   │   │   │   │   └── decision-panel/
│   │   │   │   ├── decisions/
│   │   │   │   │   ├── approve-application/
│   │   │   │   │   ├── reject-application/
│   │   │   │   │   ├── flag-for-compliance/
│   │   │   │   │   └── request-documents/
│   │   │   │   ├── reports/
│   │   │   │   │   ├── performance-report/
│   │   │   │   │   ├── application-statistics/
│   │   │   │   │   └── decision-history/
│   │   │   │   └── profile/
│   │   │   ├── services/
│   │   │   │   ├── loan-officer-api.service.ts
│   │   │   │   ├── application-review.service.ts
│   │   │   │   ├── decision-management.service.ts
│   │   │   │   └── officer-reports.service.ts
│   │   │   ├── models/
│   │   │   │   ├── officer-dashboard.model.ts
│   │   │   │   ├── application-review.model.ts
│   │   │   │   ├── decision.model.ts
│   │   │   │   └── index.ts
│   │   │   ├── loan-officer-routing.module.ts
│   │   │   └── loan-officer.module.ts
│   │   │
│   │   ├── compliance-officer/         # Compliance Officer Module
│   │   │   ├── components/
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── compliance-dashboard/
│   │   │   │   │   ├── flagged-applications/
│   │   │   │   │   └── investigation-queue/
│   │   │   │   ├── investigation/
│   │   │   │   │   ├── case-details/
│   │   │   │   │   ├── fraud-analysis/
│   │   │   │   │   ├── compliance-check/
│   │   │   │   │   ├── external-verification/
│   │   │   │   │   └── investigation-report/
│   │   │   │   ├── decisions/
│   │   │   │   │   ├── approve-case/
│   │   │   │   │   ├── reject-case/
│   │   │   │   │   ├── escalate-case/
│   │   │   │   │   └── close-investigation/
│   │   │   │   └── reports/
│   │   │   │       ├── compliance-reports/
│   │   │   │       ├── fraud-statistics/
│   │   │   │       └── investigation-history/
│   │   │   ├── services/
│   │   │   │   ├── compliance-officer-api.service.ts
│   │   │   │   ├── investigation.service.ts
│   │   │   │   ├── fraud-detection.service.ts
│   │   │   │   └── compliance-reports.service.ts
│   │   │   ├── models/
│   │   │   │   ├── compliance-dashboard.model.ts
│   │   │   │   ├── investigation.model.ts
│   │   │   │   ├── fraud-check.model.ts
│   │   │   │   └── index.ts
│   │   │   ├── compliance-officer-routing.module.ts
│   │   │   └── compliance-officer.module.ts
│   │   │
│   │   ├── senior-loan-officer/        # Senior Loan Officer Module
│   │   │   ├── components/
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── senior-dashboard/
│   │   │   │   │   ├── team-performance/
│   │   │   │   │   └── escalated-cases/
│   │   │   │   ├── review/
│   │   │   │   │   ├── high-value-applications/
│   │   │   │   │   ├── escalated-decisions/
│   │   │   │   │   └── override-decisions/
│   │   │   │   ├── team-management/
│   │   │   │   │   ├── officer-assignments/
│   │   │   │   │   ├── workload-distribution/
│   │   │   │   │   └── performance-monitoring/
│   │   │   │   └── reports/
│   │   │   │       ├── team-reports/
│   │   │   │       ├── decision-analytics/
│   │   │   │       └── risk-analysis/
│   │   │   ├── services/
│   │   │   │   ├── senior-officer-api.service.ts
│   │   │   │   ├── team-management.service.ts
│   │   │   │   └── senior-reports.service.ts
│   │   │   ├── models/
│   │   │   │   ├── senior-dashboard.model.ts
│   │   │   │   ├── team-performance.model.ts
│   │   │   │   └── index.ts
│   │   │   ├── senior-loan-officer-routing.module.ts
│   │   │   └── senior-loan-officer.module.ts
│   │   │
│   │   ├── senior-compliance-officer/  # Senior Compliance Officer Module
│   │   │   ├── components/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── oversight/
│   │   │   │   ├── policy-management/
│   │   │   │   └── regulatory-reports/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   ├── senior-compliance-officer-routing.module.ts
│   │   │   └── senior-compliance-officer.module.ts
│   │   │
│   │   └── admin/                      # Admin Module
│   │       ├── components/
│   │       │   ├── dashboard/
│   │       │   │   ├── admin-dashboard/
│   │       │   │   ├── system-overview/
│   │       │   │   └── user-statistics/
│   │       │   ├── user-management/
│   │       │   │   ├── user-list/
│   │       │   │   ├── create-user/
│   │       │   │   ├── edit-user/
│   │       │   │   ├── user-roles/
│   │       │   │   └── user-permissions/
│   │       │   ├── officer-management/
│   │       │   │   ├── officer-list/
│   │       │   │   ├── create-officer/
│   │       │   │   ├── officer-profiles/
│   │       │   │   └── officer-assignments/
│   │       │   ├── system-settings/
│   │       │   │   ├── application-settings/
│   │       │   │   ├── notification-settings/
│   │       │   │   ├── security-settings/
│   │       │   │   └── backup-restore/
│   │       │   ├── reports/
│   │       │   │   ├── system-reports/
│   │       │   │   ├── user-activity/
│   │       │   │   ├── application-analytics/
│   │       │   │   └── performance-metrics/
│   │       │   └── audit/
│   │       │       ├── audit-logs/
│   │       │       ├── security-logs/
│   │       │       └── compliance-audit/
│   │       ├── services/
│   │       │   ├── admin-api.service.ts
│   │       │   ├── user-management.service.ts
│   │       │   ├── officer-management.service.ts
│   │       │   ├── system-settings.service.ts
│   │       │   └── audit.service.ts
│   │       ├── models/
│   │       │   ├── admin-dashboard.model.ts
│   │       │   ├── user-management.model.ts
│   │       │   ├── officer-management.model.ts
│   │       │   └── index.ts
│   │       ├── admin-routing.module.ts
│   │       └── admin.module.ts
│   │
│   ├── layout/                         # Layout components
│   │   ├── main-layout/
│   │   │   ├── main-layout.component.ts
│   │   │   ├── main-layout.component.html
│   │   │   └── main-layout.component.scss
│   │   ├── auth-layout/
│   │   ├── dashboard-layout/
│   │   └── public-layout/
│   │
│   ├── app-routing.module.ts           # Main routing configuration
│   ├── app.component.ts                # Root component
│   ├── app.component.html
│   ├── app.component.scss
│   ├── app.config.ts                   # App configuration
│   └── app.module.ts                   # Root module
│
├── assets/                             # Static assets
│   ├── images/
│   │   ├── logo/
│   │   ├── icons/
│   │   ├── backgrounds/
│   │   └── avatars/
│   ├── fonts/
│   ├── data/
│   │   ├── mock-data.json
│   │   └── constants.json
│   └── i18n/                          # Internationalization
│       ├── en.json
│       └── hi.json
│
├── environments/                       # Environment configurations
│   ├── environment.ts                 # Development
│   ├── environment.prod.ts            # Production
│   └── environment.staging.ts         # Staging
│
├── styles/                            # Global styles
│   ├── _variables.scss                # SCSS variables
│   ├── _mixins.scss                   # SCSS mixins
│   ├── _components.scss               # Component styles
│   ├── _utilities.scss                # Utility classes
│   └── themes/
│       ├── light-theme.scss
│       └── dark-theme.scss
│
├── favicon.ico
├── index.html
├── main.ts                            # Application bootstrap
└── styles.css                         # Global styles entry
```

---

## **🎯 IMPLEMENTATION PHASES**

### **PHASE 1: FOUNDATION (Week 1-2)**
1. **Core Module Setup**
   - Authentication services
   - Guards and interceptors
   - Basic routing structure

2. **Shared Components**
   - Header, sidebar, loading spinner
   - Basic UI components
   - Utility services

3. **Authentication Module**
   - Login/Register components
   - Email verification
   - Password reset

### **PHASE 2: APPLICANT PORTAL (Week 3-4)**
1. **Applicant Dashboard**
   - Profile completion
   - Application overview
   - Status tracking

2. **Loan Application Form**
   - Multi-step form (5 steps)
   - Document upload
   - Form validation

3. **Document Management**
   - Upload interface
   - Document viewer
   - Status tracking

### **PHASE 3: OFFICER MODULES (Week 5-6)**
1. **Loan Officer Dashboard**
   - Application queue
   - Review interface
   - Decision making

2. **Compliance Officer Module**
   - Investigation dashboard
   - Fraud detection tools
   - Case management

### **PHASE 4: ADVANCED FEATURES (Week 7-8)**
1. **Senior Officer Modules**
   - Team management
   - Advanced analytics
   - Override capabilities

2. **Admin Module**
   - User management
   - System settings
   - Audit logs

### **PHASE 5: POLISH & OPTIMIZATION (Week 9-10)**
1. **Performance Optimization**
   - Lazy loading
   - Caching strategies
   - Bundle optimization

2. **Testing & Documentation**
   - Unit tests
   - E2E tests
   - User documentation

---

## **🔧 TECHNICAL ARCHITECTURE**

### **State Management Strategy**
```typescript
// Using Angular Signals (No NgRx needed)
@Injectable({
  providedIn: 'root'
})
export class ApplicationStateService {
  // Private writable signals
  private _currentUser = signal<User | null>(null);
  private _applications = signal<LoanApplication[]>([]);
  private _loading = signal<boolean>(false);

  // Public readonly signals
  readonly currentUser = this._currentUser.asReadonly();
  readonly applications = this._applications.asReadonly();
  readonly loading = this._loading.asReadonly();

  // Computed signals
  readonly userRole = computed(() => this.currentUser()?.role);
  readonly applicationCount = computed(() => this.applications().length);
}
```

### **Routing Strategy**
```typescript
// app-routing.module.ts
const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'applicant',
    loadChildren: () => import('./features/applicant/applicant.module').then(m => m.ApplicantModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['APPLICANT'] }
  },
  {
    path: 'loan-officer',
    loadChildren: () => import('./features/loan-officer/loan-officer.module').then(m => m.LoanOfficerModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['LOAN_OFFICER', 'SENIOR_LOAN_OFFICER'] }
  },
  // ... other routes
];
```

### **API Integration Pattern**
```typescript
// Base API service
@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  protected get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`);
  }

  protected post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${endpoint}`, data);
  }
}

// Feature-specific service
@Injectable()
export class LoanApplicationService extends BaseApiService {
  createApplication(data: LoanApplicationRequest): Observable<LoanApplicationResponse> {
    return this.post<LoanApplicationResponse>('loan-applications', data);
  }

  getApplications(): Observable<LoanApplicationResponse[]> {
    return this.get<LoanApplicationResponse[]>('loan-applications');
  }
}
```

---

## **🎨 UI/UX DESIGN SYSTEM**

### **Component Library Stack**
- **Angular Material** - Core components (buttons, forms, dialogs)
- **TailwindCSS** - Utility classes and custom styling
- **Custom Components** - Business-specific components

### **Theme Configuration**
```scss
// _variables.scss
:root {
  // Primary colors (Banking theme)
  --primary-color: #1976d2;
  --primary-light: #42a5f5;
  --primary-dark: #1565c0;

  // Secondary colors
  --secondary-color: #388e3c;
  --secondary-light: #66bb6a;
  --secondary-dark: #2e7d32;

  // Status colors
  --success-color: #4caf50;
  --warning-color: #ff9800;
  --error-color: #f44336;
  --info-color: #2196f3;

  // Neutral colors
  --background-color: #fafafa;
  --surface-color: #ffffff;
  --text-primary: #212121;
  --text-secondary: #757575;
}
```

### **Responsive Breakpoints**
```scss
// _mixins.scss
@mixin mobile {
  @media (max-width: 767px) { @content; }
}

@mixin tablet {
  @media (min-width: 768px) and (max-width: 1023px) { @content; }
}

@mixin desktop {
  @media (min-width: 1024px) { @content; }
}
```

---

## **📱 MOBILE-FIRST APPROACH**

### **Responsive Design Strategy**
1. **Mobile (320px - 767px)**
   - Simplified navigation (bottom tabs)
   - Stacked forms
   - Touch-friendly buttons

2. **Tablet (768px - 1023px)**
   - Sidebar navigation
   - Two-column layouts
   - Optimized forms

3. **Desktop (1024px+)**
   - Full sidebar navigation
   - Multi-column layouts
   - Advanced features

---

## **🔐 SECURITY IMPLEMENTATION**

### **Authentication Flow**
```typescript
// auth.guard.ts
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }
    this.router.navigate(['/auth/login']);
    return false;
  }
}

// role.guard.ts
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRoles = route.data['roles'] as string[];
    const userRole = this.authService.getCurrentUserRole();
    return requiredRoles.includes(userRole);
  }
}
```

---

## **📊 PERFORMANCE OPTIMIZATION**

### **Lazy Loading Strategy**
- **Feature modules** loaded on demand
- **Route-based code splitting**
- **Component lazy loading** for heavy components

### **Caching Strategy**
```typescript
// cache.interceptor.ts
@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, HttpResponse<any>>();

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.method === 'GET') {
      const cachedResponse = this.cache.get(req.url);
      if (cachedResponse) {
        return of(cachedResponse);
      }
    }
    return next.handle(req);
  }
}
```

---

## **🧪 TESTING STRATEGY**

### **Testing Pyramid**
1. **Unit Tests** - Components, services, pipes
2. **Integration Tests** - Component interactions
3. **E2E Tests** - Complete user workflows

### **Testing Tools**
- **Jasmine & Karma** - Unit testing
- **Cypress** - E2E testing
- **Angular Testing Utilities** - Component testing

---

This comprehensive architecture provides a solid foundation for your Loan Screening Application frontend, perfectly aligned with your backend's sophisticated workflow and user role system! 🚀
