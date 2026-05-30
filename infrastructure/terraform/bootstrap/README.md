# Terraform Bootstrap (one-time)

Creates remote state storage. **Run manually** after reviewing the plan.

## Step 1 — Bootstrap state backend

```bash
cd infrastructure/terraform/bootstrap
terraform init
terraform plan
# Review output, then (with approval):
terraform apply
```

Creates:

- S3 bucket `conversational-ai-terraform-state-<account-id>`
- DynamoDB table `terraform-state-lock`

Note the bucket name from outputs.

## Step 2 — Configure environment backend

Copy `environments/dev/backend.hcl.example` to `backend.hcl` and set the bucket name.

Then:

```bash
cd ../environments/dev
terraform init -backend-config=backend.hcl
terraform plan -var-file=terraform.tfvars
```

Do **not** run `terraform apply` without explicit approval. See [phase1-deploy-handoff.md](../../../docs/runbooks/phase1-deploy-handoff.md).
