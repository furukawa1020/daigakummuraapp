# PowerShell Deploy Check Script
# Deploy pre-check script for Windows

Write-Host "Checking deployment readiness..." -ForegroundColor Cyan

$errors = 0
$warnings = 0

# 1. 環境変数チェック
Write-Host "`n[1/6] Checking environment variables..." -ForegroundColor Yellow

if (Test-Path "backend\.env") {
    $envContent = Get-Content "backend\.env" -Raw
    
    if ($envContent -match "your-super-secret-jwt-key-change-this-in-production") {
        Write-Host "[ERROR] JWT_SECRET is still using default value" -ForegroundColor Red
        $errors++
    } else {
        Write-Host "[OK] JWT_SECRET is configured" -ForegroundColor Green
    }
    
    if ($envContent -match "user:password@localhost") {
        Write-Host "[WARNING] DATABASE_URL points to localhost" -ForegroundColor Yellow
        $warnings++
    }
} else {
    Write-Host "[ERROR] backend/.env not found" -ForegroundColor Red
    $errors++
}

# 2. Node.js version check
Write-Host "`n[2/6] Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node -v
Write-Host "Node.js version: $nodeVersion"

# 3. Dependencies check
Write-Host "`n[3/6] Checking dependencies..." -ForegroundColor Yellow

if (!(Test-Path "backend\node_modules")) {
    Write-Host "[ERROR] backend dependencies not installed" -ForegroundColor Red
    $errors++
} else {
    Write-Host "[OK] backend dependencies installed" -ForegroundColor Green
}

if (!(Test-Path "frontend\node_modules")) {
    Write-Host "[ERROR] frontend dependencies not installed" -ForegroundColor Red
    $errors++
} else {
    Write-Host "[OK] frontend dependencies installed" -ForegroundColor Green
}

# 4. Build test
Write-Host "`n[4/6] Testing frontend build..." -ForegroundColor Yellow
Push-Location frontend
$buildResult = npm run build 2>&1
Pop-Location

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Frontend build successful" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Frontend build failed" -ForegroundColor Red
    $errors++
}

# 5. Security check
Write-Host "`n[5/6] Security check..." -ForegroundColor Yellow

if (Test-Path ".env") {
    Write-Host "[WARNING] .env file exists in root directory" -ForegroundColor Yellow
    $warnings++
}

if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -match "\.env") {
        Write-Host "[OK] .env is in .gitignore" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] .env not in .gitignore" -ForegroundColor Red
        $errors++
    }
} else {
    Write-Host "[ERROR] .gitignore not found" -ForegroundColor Red
    $errors++
}

# 6. Git check
Write-Host "`n[6/6] Git check..." -ForegroundColor Yellow

if (Test-Path ".git") {
    $gitStatus = git status --porcelain
    if ([string]::IsNullOrEmpty($gitStatus)) {
        Write-Host "[OK] No uncommitted changes" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] There are uncommitted changes" -ForegroundColor Yellow
        $warnings++
    }
} else {
    Write-Host "[WARNING] Git repository not initialized" -ForegroundColor Yellow
    $warnings++
}

# Results
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Check Results" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Errors: $errors" -ForegroundColor $(if ($errors -eq 0) { "Green" } else { "Red" })
Write-Host "Warnings: $warnings" -ForegroundColor Yellow
Write-Host ""

if ($errors -eq 0) {
    Write-Host "[SUCCESS] Ready to deploy!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Check DEPLOYMENT.md for deployment guide"
    Write-Host "2. Create project on Railway/Vercel/Heroku"
    Write-Host "3. Set environment variables"
    Write-Host "4. Execute deployment"
    exit 0
} else {
    Write-Host "[FAILED] Please fix errors and run again" -ForegroundColor Red
    exit 1
}
