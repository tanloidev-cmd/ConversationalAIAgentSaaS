# Terraform Bootstrap (one-time)

Creates remote state storage. **Run manually** after reviewing the plan.

Requires Terraform **>= 1.11** (S3-native state locking via `use_lockfile`).

## Step 1 — Bootstrap state backend

```bash
cd infrastructure/terraform/bootstrap
terraform init
terraform plan
# Review output, then (with approval):
terraform apply
```

Creates:

- S3 bucket `conversational-ai-terraform-state-<account-id>` (versioning, encryption, public access blocked)

State locking uses a `.tflock` object in the same bucket — no DynamoDB table.

Note the bucket name from outputs.

If you previously created `terraform-state-lock` in DynamoDB, you may delete that table after re-initializing environments with `use_lockfile = true`.

## Step 2 — Configure environment backend

Copy `environments/dev/backend.hcl.example` to `backend.hcl` and set the bucket name.

Then:

```bash
cd ../environments/dev
terraform init -reconfigure -backend-config=backend.hcl
terraform plan -var-file=terraform.tfvars
```

Do **not** run `terraform apply` without explicit approval. See [phase1-deploy-handoff.md](../../../docs/runbooks/phase1-deploy-handoff.md).
