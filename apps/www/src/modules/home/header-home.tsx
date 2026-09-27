"use client";

import React from "react";
import { useTranslation } from "@/i18n/LanguageContext";

export const HeaderHome = () => {
  const { t } = useTranslation();
  return (
    <section className="text-center mb-12">
      <h1 className="text-4xl font-syne font-bold mb-4">
        {t("home.welcomeTitle")}
      </h1>
      <p className="text-xl font-syne mb-6 text-muted-foreground">
        {t("home.welcomeSubtitle")}
      </p>
    </section>
  );
};