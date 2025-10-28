# ⚡ **QUICK SETUP COMMANDS - LOAN SCREENING APP**
## **Copy-Paste Commands for Fast Setup**

---

## **🚀 PREREQUISITES INSTALLATION**

### **Windows (PowerShell as Administrator):**
```powershell
# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install Node.js (download from https://nodejs.org/)
# Then verify:
node --version
npm --version

# Install Angular CLI
npm install -g @angular/cli@17

# Verify Angular CLI
ng version
```

### **macOS (Terminal):**
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install Angular CLI
npm install -g @angular/cli@17

# Verify installations
node --version
npm --version
ng version
```

### **Linux (Ubuntu/Debian):**
```bash
# Update system
sudo apt update

# Install Node.js (latest LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Angular CLI
npm install -g @angular/cli@17

# Verify installations
node --version
npm --version
ng version
```

---

## **📦 PROJECT SETUP COMMANDS**

### **1. Clone and Navigate:**
```bash
# Clone repository (replace with your repo URL)
git clone <your-repository-url>
cd Loan_Screening_App
```

### **2. Frontend Setup:**
```bash
# Navigate to frontend
cd frontend

# Install all dependencies
npm install

# If npm install fails, try:
npm ci

# Or clean install:
rm -rf node_modules package-lock.json
npm install
```

### **3. Backend Setup:**
```bash
# Navigate back to root
cd ..

# Clean and install Maven dependencies
./mvnw clean install

# For Windows (if mvnw doesn't work):
mvnw.cmd clean install
```

---

## **🏃‍♂️ RUNNING THE APPLICATION**

### **Terminal 1 - Backend:**
```bash
# Navigate to project root
cd Loan_Screening_App

# Start Spring Boot backend
./mvnw spring-boot:run

# Backend will run on: http://localhost:8080
```

### **Terminal 2 - Frontend:**
```bash
# Navigate to frontend
cd Loan_Screening_App/frontend

# Start Angular development server
ng serve

# Frontend will run on: http://localhost:4200
# Browser should open automatically
```

---

## **🔧 TROUBLESHOOTING COMMANDS**

### **Node.js/npm Issues:**
```bash
# Clear npm cache
npm cache clean --force

# Fix npm permissions (Linux/macOS)
sudo chown -R $(whoami) ~/.npm

# Reinstall node_modules
rm -rf node_modules package-lock.json
npm install

# Check npm configuration
npm config list
```

### **Angular CLI Issues:**
```bash
# Reinstall Angular CLI
npm uninstall -g @angular/cli
npm install -g @angular/cli@17

# Clear Angular cache
ng cache clean

# Check Angular version compatibility
ng version
```

### **Port Conflicts:**
```bash
# Run frontend on different port
ng serve --port 4201

# Check what's using port 4200 (Windows)
netstat -ano | findstr :4200

# Check what's using port 4200 (Linux/macOS)
lsof -i :4200
```

### **Git Issues:**
```bash
# Reset to latest commit
git reset --hard HEAD

# Pull latest changes
git pull origin main

# Check git status
git status
```

---

## **📋 DEPENDENCY INSTALLATION COMMANDS**

### **If Dependencies are Missing:**
```bash
# Navigate to frontend directory
cd frontend

# Install Angular Material
ng add @angular/material --skip-confirmation

# Install TailwindCSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init

# Install Angular CDK
npm install @angular/cdk

# Install additional packages
npm install @angular/forms @angular/common @angular/platform-browser
```

### **Backend Dependencies (if needed):**
```bash
# Update Maven dependencies
./mvnw dependency:resolve

# Download sources and javadocs
./mvnw dependency:sources dependency:resolve -Dclassifier=javadoc
```

---

## **🔄 UPDATE COMMANDS**

### **Update Frontend:**
```bash
cd frontend

# Update Angular
ng update @angular/core @angular/cli

# Update npm packages
npm update

# Check for outdated packages
npm outdated
```

### **Update Backend:**
```bash
# Update Maven dependencies
./mvnw versions:display-dependency-updates

# Update Maven wrapper
./mvnw wrapper:wrapper
```

---

## **🧪 TESTING COMMANDS**

### **Frontend Testing:**
```bash
cd frontend

# Run unit tests
ng test

# Run e2e tests
ng e2e

# Build for production
ng build --prod

# Lint code
ng lint
```

### **Backend Testing:**
```bash
# Run all tests
./mvnw test

# Run specific test class
./mvnw test -Dtest=UserServiceTest

# Run tests with coverage
./mvnw test jacoco:report
```

---

## **🐳 DOCKER COMMANDS (Optional)**

### **If Using Docker:**
```bash
# Build backend Docker image
docker build -t loan-screening-backend .

# Build frontend Docker image
cd frontend
docker build -t loan-screening-frontend .

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

---

## **📊 MONITORING COMMANDS**

### **Check Application Status:**
```bash
# Check if backend is running
curl http://localhost:8080/actuator/health

# Check if frontend is running
curl http://localhost:4200

# View backend logs
tail -f logs/application.log

# View npm logs
npm run start 2>&1 | tee npm.log
```

---

## **🔐 ENVIRONMENT SETUP**

### **Create Environment Files:**
```bash
# Frontend environment (development)
cat > frontend/src/environments/environment.ts << 'EOF'
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  appName: 'Loan Screening Application'
};
EOF

# Frontend environment (production)
cat > frontend/src/environments/environment.prod.ts << 'EOF'
export const environment = {
  production: true,
  apiUrl: 'https://your-api-url.com/api',
  appName: 'Loan Screening Application'
};
EOF
```

### **TailwindCSS Setup:**
```bash
# Update styles.css
cat >> frontend/src/styles.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
@import '@angular/material/prebuilt-themes/indigo-pink.css';
EOF

# Update tailwind.config.js
cat > frontend/tailwind.config.js << 'EOF'
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: { extend: {} },
  plugins: []
}
EOF
```

---

## **✅ VERIFICATION COMMANDS**

### **Check Everything is Working:**
```bash
# Check Node.js
node --version

# Check npm
npm --version

# Check Angular CLI
ng version

# Check Java
java --version

# Check Maven
./mvnw --version

# Test backend API
curl http://localhost:8080/api/auth/health

# Test frontend
curl http://localhost:4200
```

---

## **🆘 EMERGENCY RESET COMMANDS**

### **Complete Reset (if everything breaks):**
```bash
# Stop all processes
# Ctrl+C in all terminals

# Clean everything
cd Loan_Screening_App
rm -rf frontend/node_modules
rm -rf frontend/package-lock.json
rm -rf target/
./mvnw clean

# Reinstall everything
cd frontend
npm install
cd ..
./mvnw clean install

# Restart applications
./mvnw spring-boot:run &
cd frontend && ng serve
```

---

**💡 Pro Tip: Bookmark this file for quick reference during development!**

**🔗 Quick Links:**
- Backend: http://localhost:8080
- Frontend: http://localhost:4200
- API Docs: http://localhost:8080/swagger-ui.html (if configured)
- Database: http://localhost:8080/h2-console (if using H2)
