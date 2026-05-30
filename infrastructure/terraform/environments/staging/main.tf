# Staging uses the same module layout as dev — apply only with explicit approval.
# Copy environments/dev and adjust tfvars (waf_enabled = true recommended).

terraform {
  required_version = ">= 1.5.0"
}

# See environments/dev for full stack. Run: terraform init/plan from staging after copying dev structure.
