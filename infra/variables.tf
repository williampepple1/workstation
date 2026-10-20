variable "project_name" {
  description = "Project name used to prefix AWS resources"
  type        = string
  default     = "workstation-3d-office"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "prod"
}

variable "region" {
  description = "AWS region for all resources"
  type        = string
  default     = "af-south-1"
}

variable "aws_profile" {
  description = "AWS CLI profile used by the provider"
  type        = string
  default     = "personal"
}

variable "s3_bucket_name" {
  description = "Frontend S3 bucket name (globally unique)"
  type        = string
  default     = "workstation-3d-office-frontend-628711466156"
}
