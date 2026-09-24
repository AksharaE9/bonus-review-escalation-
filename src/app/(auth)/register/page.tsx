import { notFound } from "next/navigation";

// REDIRECT-SEC-001: Self-registration endpoint is disabled.
// User provisioning is restricted to administrators via /settings/users.
export default function RegisterPage() {
  notFound();
}
