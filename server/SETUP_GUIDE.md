# 🚀 **LOAN SCREENING APPLICATION - SETUP GUIDE**
## **Complete Installation Guide for New Systems**

---

## **📋 PREREQUISITES**

### **1. System Requirements**
- **Operating System**: Windows 10/11, macOS 10.15+, or Linux Ubuntu 18.04+
- **RAM**: Minimum 8GB (16GB recommended)
- **Storage**: At least 5GB free space
- **Internet**: Stable connection for package downloads

### **2. Required Software Versions**
- **Node.js**: v18.0.0 or higher (v20.13.1 recommended)
- **npm**: v8.0.0 or higher (comes with Node.js)
- **Java**: JDK 17 or higher (for Spring Boot backend)
- **Git**: Latest version
- **MySQL**: 8.0+ (for database)

---

## **🔧 STEP-BY-STEP INSTALLATION**

### **STEP 1: Install Node.js and npm**

#### **Windows:**
```bash
# Download and install from official website
# Visit: https://nodejs.org/
# Download LTS version (recommended)
# Run the installer and follow instructions

# Verify installation
node --version
npm --version
```

#### **macOS:**
```bash
# Using Homebrew (recommended)
brew install node

# Or download from official website
# Visit: https://nodejs.org/

# Verify installation
node --version
npm --version
```

#### **Linux (Ubuntu/Debian):**
```bash
# Update package index
sudo apt update

# Install Node.js and npm
sudo apt install nodejs npm

# For latest version, use NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

---

### **STEP 2: Install Angular CLI**

```bash
# Install Angular CLI globally (compatible version)
npm install -g @angular/cli@17

# For systems with Node.js v20.13.1, use Angular 17
# For newer Node.js versions, you can use latest Angular CLI

# Verify installation
ng version

# If you get PowerShell execution policy error on Windows:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### **STEP 3: Clone and Setup Project**

```bash
# Clone the repository
git clone <your-repository-url>
cd Loan_Screening_App

# Navigate to frontend directory
cd frontend

# Install all dependencies
npm install

# This will install all packages listed in package.json:
# - Angular 17.x
# - Angular Material 17.x
# - TailwindCSS
# - Angular CDK
# - All other dependencies
```

---

### **STEP 4: Install Additional Dependencies (if needed)**

```bash
# If any dependencies are missing, install them manually:

# Angular Material (should already be installed)
ng add @angular/material --skip-confirmation

# TailwindCSS (should already be installed)
npm install -D tailwindcss postcss autoprefixer

# Initialize TailwindCSS (if config missing)
npx tailwindcss init

# Additional useful packages
npm install @angular/cdk @angular/forms @angular/common @angular/platform-browser
```

---

### **STEP 5: Configure Environment**

#### **A. Frontend Configuration**

```bash
# Navigate to frontend directory
cd frontend

# Create environment files (if not present)
mkdir -p src/environments

# Create environment.ts (development)
cat > src/environments/environment.ts << 'EOF'
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  appName: 'Loan Screening Application'
};
EOF

# Create environment.prod.ts (production)
cat > src/environments/environment.prod.ts << 'EOF'
export const environment = {
  production: true,
  apiUrl: 'https://your-production-api-url.com/api',
  appName: 'Loan Screening Application'
};
EOF
```

#### **B. TailwindCSS Configuration**

```bash
# Update tailwind.config.js
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF
```

#### **C. Update styles.css**

```bash
# Add TailwindCSS directives to src/styles.css
cat >> src/styles.css << 'EOF'

/* TailwindCSS directives */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Angular Material theme */
@import '@angular/material/prebuilt-themes/indigo-pink.css';
EOF
```

---

### **STEP 6: Backend Setup (Spring Boot)**

```bash
# Navigate to project root
cd ..

# Ensure you have Java 17+ installed
java --version

# If using Maven wrapper (recommended)
./mvnw clean install

# Or if you have Maven installed globally
mvn clean install

# Run the Spring Boot application
./mvnw spring-boot:run

# Backend will start on http://localhost:8080
```

---

### **STEP 7: Database Setup**

```bash
# Install MySQL 8.0+
# Create database
mysql -u root -p

CREATE DATABASE loan_screening_db;
CREATE USER 'loan_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON loan_screening_db.* TO 'loan_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Update application.properties with your database credentials
```

---

## **🚀 RUNNING THE APPLICATION**

### **Start Backend (Terminal 1):**
```bash
# Navigate to project root
cd Loan_Screening_App

# Start Spring Boot application
./mvnw spring-boot:run

# Backend runs on: http://localhost:8080
# API endpoints: http://localhost:8080/api/*
```

### **Start Frontend (Terminal 2):**
```bash
# Navigate to frontend directory
cd Loan_Screening_App/frontend

# Start Angular development server
ng serve

# Frontend runs on: http://localhost:4200
# Automatically opens in browser
```

---

## **📦 PACKAGE.JSON DEPENDENCIES**

### **Current Dependencies (Auto-installed with npm install):**

```json
{
  "dependencies": {
    "@angular/animations": "^17.3.0",
    "@angular/cdk": "^17.3.0",
    "@angular/common": "^17.3.0",
    "@angular/compiler": "^17.3.0",
    "@angular/core": "^17.3.0",
    "@angular/forms": "^17.3.0",
    "@angular/material": "^17.3.0",
    "@angular/platform-browser": "^17.3.0",
    "@angular/platform-browser-dynamic": "^17.3.0",
    "@angular/router": "^17.3.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.14.3"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^17.3.0",
    "@angular/cli": "^17.3.0",
    "@angular/compiler-cli": "^17.3.0",
    "@types/jasmine": "~5.1.0",
    "@types/node": "^18.18.0",
    "autoprefixer": "^10.4.0",
    "jasmine-core": "~5.1.0",
    "karma": "~6.4.0",
    "karma-chrome-headless": "~3.1.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.1.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "~5.4.0"
  }
}
```

---

## **🔧 TROUBLESHOOTING**

### **Common Issues and Solutions:**

#### **1. Node.js Version Compatibility**
```bash
# If you get Angular CLI version errors:
npm install -g @angular/cli@17

# For Node.js v20.13.1, use Angular 17
# For Node.js v20.19+, you can use Angular 18+
```

#### **2. PowerShell Execution Policy (Windows)**
```bash
# Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or use alternative
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

#### **3. npm Permission Issues (Linux/macOS)**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Or use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

#### **4. Port Already in Use**
```bash
# If port 4200 is busy
ng serve --port 4201

# If port 8080 is busy (backend)
# Update application.properties:
server.port=8081
```

#### **5. CORS Issues**
```bash
# Create proxy.conf.json in frontend folder:
{
  "/api/*": {
    "target": "http://localhost:8080",
    "secure": true,
    "changeOrigin": true
  }
}

# Update angular.json serve options:
"serve": {
  "builder": "@angular-devkit/build-angular:dev-server",
  "options": {
    "proxyConfig": "proxy.conf.json"
  }
}
```

---

## **🎯 DEVELOPMENT COMMANDS**

### **Frontend Commands:**
```bash
# Development server
ng serve

# Build for production
ng build --prod

# Run tests
ng test

# Generate component
ng generate component auth/login

# Generate service
ng generate service core/auth

# Lint code
ng lint

# Update Angular
ng update @angular/core @angular/cli
```

### **Backend Commands:**
```bash
# Run application
./mvnw spring-boot:run

# Run tests
./mvnw test

# Build JAR
./mvnw clean package

# Clean build
./mvnw clean install
```

---

## **📁 PROJECT STRUCTURE VERIFICATION**

After setup, your project should look like this:

```
Loan_Screening_App/
├── src/                          # Spring Boot Backend
├── frontend/                     # Angular Frontend
│   ├── src/app/                 # Angular application
│   ├── node_modules/            # Dependencies (ignored by git)
│   ├── package.json             # Dependencies manifest
│   ├── angular.json             # Angular configuration
│   └── tailwind.config.js       # TailwindCSS config
├── target/                      # Maven build output (ignored)
├── .gitignore                   # Git ignore rules
├── pom.xml                      # Maven dependencies
└── SETUP_GUIDE.md              # This file
```

---

## **✅ VERIFICATION CHECKLIST**

- [ ] Node.js and npm installed and working
- [ ] Angular CLI installed globally
- [ ] Project cloned and dependencies installed
- [ ] Backend starts successfully on port 8080
- [ ] Frontend starts successfully on port 4200
- [ ] Database connected and tables created
- [ ] No console errors in browser
- [ ] API calls working between frontend and backend

---

## **🆘 SUPPORT**

If you encounter issues:

1. **Check Node.js version**: `node --version`
2. **Check Angular CLI version**: `ng version`
3. **Clear npm cache**: `npm cache clean --force`
4. **Delete node_modules and reinstall**: `rm -rf node_modules && npm install`
5. **Check for port conflicts**: Use different ports if needed
6. **Review console logs**: Check browser developer tools and terminal output

---

## **🔄 UPDATING THE PROJECT**

### **Pull Latest Changes:**
```bash
# Pull latest code
git pull origin main

# Update backend dependencies
./mvnw clean install

# Update frontend dependencies
cd frontend
npm install

# If package.json changed, you might need:
npm ci  # Clean install based on package-lock.json
```

### **Update Dependencies:**
```bash
# Update Angular
ng update @angular/core @angular/cli

# Update npm packages
npm update

# Check for outdated packages
npm outdated
```

---

**🎉 You're all set! Your Loan Screening Application should now be running successfully.**
