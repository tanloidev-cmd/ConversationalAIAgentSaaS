import { redirect } from "next/navigation";
import { getCognitoLoginUrl } from "@/lib/cognito";
import { getSession } from "@/lib/session";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  const loginUrl = getCognitoLoginUrl();
  if (!process.env.NEXT_PUBLIC_COGNITO_DOMAIN) {
    return (
      <main>
        <h1>Sign in</h1>
        <p className="status-error">
          Configure NEXT_PUBLIC_COGNITO_* in .env (see .env.example) after Terraform apply.
        </p>
      </main>
    );
  }

  redirect(loginUrl);
}
