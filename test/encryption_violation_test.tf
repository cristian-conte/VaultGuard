resource "azurerm_storage_account" "example" {
  name                     = "storageaccountname"
  resource_group_name      = "example-resources"
  location                 = "West Europe"
  account_tier             = "Standard"
  account_replication_type = "GRS"
  enable_https_traffic_only = false
  min_tls_version          = "TLS1_0"
}

resource "aws_s3_bucket" "example" {
  bucket = "my-tf-test-bucket"
  acl    = "private"
}
