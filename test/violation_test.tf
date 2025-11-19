resource "aws_s3_bucket" "violation_bucket" {
  bucket = "my-violation-bucket"
  region = "us-east-1"
}
