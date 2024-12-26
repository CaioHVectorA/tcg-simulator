"use server";
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_KEY);
export async function reportError(formData: FormData) {
  const description = formData.get("description") as string;

  try {
    await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: "caihebatista@gmail.com",
      subject: "Relatório de Erro - TCG Pokémon",
      text: `Um usuário relatou o seguinte erro:\n\n${description}`,
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    return { success: false };
  }
}
