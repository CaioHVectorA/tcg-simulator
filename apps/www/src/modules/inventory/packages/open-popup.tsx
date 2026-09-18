"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PackOpeningModal } from "@/components/pack-opening-modal";

export function OpenPackagePopup({
  pack,
  quantity = 1,
}: {
  pack: UserPackage;
  quantity?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button className="w-full mt-4" onClick={() => setIsOpen(true)}>
        Abrir
      </Button>
      <PackOpeningModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        pack={pack}
        initialQuantity={quantity}
      />
    </>
  );
}