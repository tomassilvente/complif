###############################################################################
# S3 Bucket — document uploads
###############################################################################

resource "aws_s3_bucket" "documents" {
  bucket = "${var.project_name}-documents-${var.environment}"

  tags = {
    Name    = "${var.project_name}-documents-${var.environment}"
    Purpose = "Complif business document storage"
  }
}

###############################################################################
# Versioning
###############################################################################

resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

###############################################################################
# Server-side encryption (AES256)
###############################################################################

resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

###############################################################################
# Block all public access
###############################################################################

resource "aws_s3_bucket_public_access_block" "documents" {
  bucket = aws_s3_bucket.documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

###############################################################################
# Bucket Policy — allow ECS task role to read/write objects
###############################################################################

data "aws_iam_policy_document" "s3_documents_policy" {
  statement {
    sid    = "AllowECSTaskAccess"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.ecs_task.arn]
    }

    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ]

    resources = [
      aws_s3_bucket.documents.arn,
      "${aws_s3_bucket.documents.arn}/*",
    ]
  }
}

resource "aws_s3_bucket_policy" "documents" {
  bucket = aws_s3_bucket.documents.id
  policy = data.aws_iam_policy_document.s3_documents_policy.json

  depends_on = [aws_s3_bucket_public_access_block.documents]
}

###############################################################################
# Lifecycle rule — transition old versions to Glacier after 90 days
###############################################################################

resource "aws_s3_bucket_lifecycle_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    id     = "archive-old-versions"
    status = "Enabled"

    noncurrent_version_transition {
      noncurrent_days = 90
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}
