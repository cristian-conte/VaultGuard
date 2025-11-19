resource "aws_lambda_function" "example" {
  function_name = "my-function"
  role          = "arn:aws:iam::123456789012:role/service-role/role"
  handler       = "index.handler"
  runtime       = "nodejs14.x"
}
