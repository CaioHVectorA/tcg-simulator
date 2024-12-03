import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function withToken() {
  const cook = await cookies();
  const token = cook.get("token");
  if (!token) {
    redirect("/entrar");
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}
