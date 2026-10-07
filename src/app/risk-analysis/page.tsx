import { redirect } from "next/navigation";

/** Legacy route — see next.config redirects and /funds/market */
export default function RiskAnalysisRedirectPage() {
  redirect("/funds/market?mode=risk");
}
