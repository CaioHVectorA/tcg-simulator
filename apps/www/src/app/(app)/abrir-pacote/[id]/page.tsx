"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/use-api";
import { PackageCard } from "@/modules/inventory/packages/pkg-card";
import { LoaderSimple } from "@/components/loading-spinner";
import { useTranslation } from "@/i18n/LanguageContext";
import Link from "next/link";
export default function OpenPackagePage() {
  const { id } = useParams<{ id: string }>();
  const { get } = useApi();
  const { t } = useTranslation();
  const { data, isPending, isError } = useQuery<UserPackage[]>({ queryKey: ["packages"], queryFn: async () => (await get("/packages")).data.data });
  const pack = data?.find((p) => p.id === Number(id));
  return <div className="mx-auto max-w-md p-6 space-y-4">
    {isPending ? <LoaderSimple /> : isError ? <p role="alert">{t("common.networkError")}</p> : pack ? <PackageCard pack={pack} /> : <p>{t("inventory.emptyTitle")}</p>}
    <Link href="/inventario">{t("inventory.backToInventory")}</Link>
  </div>;
}
