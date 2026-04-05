output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer (add an ALB resource to populate this)"
  value       = "ALB not yet configured — add an aws_lb resource to infrastructure/ecs.tf"
}

output "rds_endpoint" {
  description = "Endpoint of the RDS PostgreSQL instance (host:port)"
  value       = aws_db_instance.main.endpoint
  sensitive   = false
}

output "rds_port" {
  description = "Port the RDS instance listens on"
  value       = aws_db_instance.main.port
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket used for document storage"
  value       = aws_s3_bucket.documents.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the documents S3 bucket"
  value       = aws_s3_bucket.documents.arn
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "backend_task_definition_arn" {
  description = "ARN of the latest backend task definition"
  value       = aws_ecs_task_definition.backend.arn
}

output "validation_task_definition_arn" {
  description = "ARN of the latest validation-service task definition"
  value       = aws_ecs_task_definition.validation.arn
}

output "vpc_id" {
  description = "ID of the main VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = [aws_subnet.private_1.id, aws_subnet.private_2.id]
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = [aws_subnet.public_1.id, aws_subnet.public_2.id]
}
