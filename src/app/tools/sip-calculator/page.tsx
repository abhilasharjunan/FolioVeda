import { redirect } from "next/navigation";

/** Legacy route — see next.config redirects and /tools/sip-swp */
export default function SipCalculatorRedirectPage() {
  redirect("/tools/sip-swp?mode=sip");
}
