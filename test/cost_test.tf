resource "aws_instance" "oversized" {
  ami           = "ami-12345678"
  instance_type = "t3.2xlarge" # Should trigger cost warning

  tags = {
    Name = "oversized-instance"
  }
}

resource "aws_nat_gateway" "expensive" {
  allocation_id = "eipalloc-123456"
  subnet_id     = "subnet-123456" # Should trigger NAT Gateway cost warning
}

resource "aws_db_instance" "no_autoscaling" {
  allocated_storage = 100
  engine            = "mysql"
  instance_class    = "db.r5.large" # Should trigger two warnings: no autoscaling + expensive instance class

  tags = {
    Name = "test-db"
  }
}

resource "aws_eip" "unattached" {
  vpc = true # Should trigger warning about unattached EIP
}

resource "aws_lb" "app_lb" {
  name               = "app-lb"
  internal           = false
  load_balancer_type = "application" # Should trigger ALB cost warning

  subnets = ["subnet-123456", "subnet-789012"]
}
