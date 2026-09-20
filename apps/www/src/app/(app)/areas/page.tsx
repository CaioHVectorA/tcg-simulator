"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderSimple } from "@/components/loading-spinner";

export default function AreasPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/inventario");
  }, [router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 font-syne">
      <LoaderSimple />
      <p className="text-sm text-muted-foreground">Redirecionando para o inventário...</p>
    </div>
  );
}
