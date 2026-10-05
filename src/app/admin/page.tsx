import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    if (gate.status === 401) redirect("/auth/signin");
    redirect("/dashboard");
  }

  return <AdminClient />;
}
