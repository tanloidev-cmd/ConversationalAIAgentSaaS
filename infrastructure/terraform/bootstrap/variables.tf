variable "aws_region" {
  type        = string
  description = "AWS region for state resources"
  default     = "ap-southeast-1"
}

variable "tags" {
  type = map(string)
  default = {
    Project   = "conversational-ai"
    ManagedBy = "terraform"
    Component = "bootstrap"
  }
}
