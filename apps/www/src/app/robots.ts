import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/home", "/colecao", "/inventario", "/abrir-pacote/", "/perfil", "/config", "/social", "/friends", "/afiliado", "/sair"] }, sitemap: `${site}/sitemap.xml` };
}
