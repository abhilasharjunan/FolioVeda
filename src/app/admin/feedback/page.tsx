import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import AdminFeedbackClient from "./AdminFeedbackClient";

export default async function AdminFeedbackPage() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    if (gate.status === 401) redirect("/auth/signin");
    redirect("/dashboard");
  }

  return <AdminFeedbackClient />;
}
