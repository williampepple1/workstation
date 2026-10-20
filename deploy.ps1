# Deploy 3D Executive Office:
# 1. Terraform init & apply (DynamoDB + Lambda + API Gateway + S3) using AWS profile "personal"
# 2. Build static Next.js export with NEXT_PUBLIC_API_ENDPOINT baked in
# 3. Sync static build to S3

$ErrorActionPreference = "Stop"

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROFILE = if ($env:WORKSTATION_AWS_PROFILE) { $env:WORKSTATION_AWS_PROFILE } else { "personal" }
$REGION = if ($env:WORKSTATION_AWS_REGION) { $env:WORKSTATION_AWS_REGION } else { "af-south-1" }
$env:AWS_PROFILE = $PROFILE
$env:AWS_REGION = $REGION

Write-Host "==> 1. Initializing & applying Terraform infrastructure (profile: $PROFILE, region: $REGION)" -ForegroundColor Cyan
Set-Location "$ROOT\infra"
terraform init -input=false
if ($LASTEXITCODE -ne 0) { throw "Terraform init failed" }

terraform apply -auto-approve -input=false -var="aws_profile=$PROFILE" -var="region=$REGION"
if ($LASTEXITCODE -ne 0) { throw "Terraform apply failed" }

$BUCKET = (terraform output -raw s3_bucket).Trim()
$API = (terraform output -raw api_endpoint).Trim()
$SITE = (terraform output -raw website_url).Trim()
$S3_SITE = (terraform output -raw s3_website_url).Trim()
$TABLE = (terraform output -raw dynamodb_table).Trim()

Write-Host "    S3 Bucket      : $BUCKET" -ForegroundColor Green
Write-Host "    API Endpoint   : $API" -ForegroundColor Green
Write-Host "    DynamoDB Table : $TABLE" -ForegroundColor Green

Write-Host "==> 2. Building static Next.js 3D Office bundle (NEXT_PUBLIC_API_ENDPOINT=$API)" -ForegroundColor Cyan
Set-Location "$ROOT"

# Temporarily hide local Next.js API route during static export so output: 'export' succeeds cleanly
$API_ROUTE_DIR = "$ROOT\src\app\api"
$API_BACKUP_DIR = "$ROOT\src\_api_local_backup"
if (Test-Path $API_ROUTE_DIR) {
  Move-Item -Path $API_ROUTE_DIR -Destination $API_BACKUP_DIR -Force
}

try {
  $env:NEXT_EXPORT = "true"
  $env:NEXT_PUBLIC_API_ENDPOINT = $API
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "Next.js static export build failed" }
} finally {
  $env:NEXT_EXPORT = ""
  if (Test-Path $API_BACKUP_DIR) {
    Move-Item -Path $API_BACKUP_DIR -Destination $API_ROUTE_DIR -Force
  }
}

Write-Host "==> 3. Syncing 3D Office build to S3 ($BUCKET)" -ForegroundColor Cyan
aws s3 sync out/_next "s3://$BUCKET/_next" --profile "$PROFILE" --region "$REGION"
if ($LASTEXITCODE -ne 0) { throw "S3 sync _next failed" }

aws s3 sync out/ "s3://$BUCKET" --delete --exclude "_next/*" --profile "$PROFILE" --region "$REGION"
if ($LASTEXITCODE -ne 0) { throw "S3 sync root files failed" }

Write-Host "==> Deployment Complete!" -ForegroundColor Green
Write-Host "    Live HTTPS 3D Office URL : $SITE" -ForegroundColor Yellow
Write-Host "    Direct S3 Website URL    : $S3_SITE" -ForegroundColor Yellow
Write-Host "    API Gateway Endpoint     : $API/office" -ForegroundColor Yellow
Write-Host "    DynamoDB Table           : $TABLE" -ForegroundColor Yellow
