import { redirect } from "next/navigation";

export default function AlbunsPage() {
  redirect("/colecao?view=albums");
}
