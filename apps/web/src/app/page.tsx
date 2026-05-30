import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>Conversational AI Platform</h1>
      <p>Phase 1 — sign in to access the dashboard.</p>
      <p>
        <Link className="button" href="/login">
          Sign in
        </Link>
      </p>
    </main>
  );
}
