"use server";
import { Resend } from "resend";
import { cookies } from "next/headers";
export async function reportError(formData: FormData) {
  const description = formData.get("description");
  const token = (await cookies()).get("token")?.value;
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!token || !apiUrl || typeof description !== "string" || description.trim().length < 10 || description.length > 2000 || !process.env.RESEND_KEY || !process.env.REPORT_FROM || !process.env.REPORT_TO) return { success: false };
  try {
    const session = await fetch(`${apiUrl}/user/me`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!session.ok || !(await session.json()).ok) return { success: false };
    const resend = new Resend(process.env.RESEND_KEY);
    const result = await resend.emails.send({ from: process.env.REPORT_FROM, to: process.env.REPORT_TO, subject: "SimTCG — feedback", text: description.trim() });
    return { success: !result.error };
  } catch {
    console.error(JSON.stringify({ event: "report_send_failed" }));
    return { success: false };
  }
}
