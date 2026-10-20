output "website_url" {
  description = "Primary HTTPS URL of the 3D Executive Office (served via API Gateway + S3)"
  value       = aws_apigatewayv2_api.api.api_endpoint
}

output "s3_website_url" {
  description = "Direct S3 Static Website URL"
  value       = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
}

output "s3_bucket" {
  description = "Frontend S3 bucket name"
  value       = aws_s3_bucket.frontend.id
}

output "api_endpoint" {
  description = "API Gateway HTTP API endpoint"
  value       = aws_apigatewayv2_api.api.api_endpoint
}

output "dynamodb_table" {
  description = "DynamoDB table storing the 3D Office To-Do TV & Activity Board"
  value       = aws_dynamodb_table.office_state.name
}
