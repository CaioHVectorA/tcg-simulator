import { Quests } from "@/modules/inventory/quests";
import { Sparkles, Target } from "lucide-react";

export default function QuestsPage() {
  return (
    <div className="container mx-auto px-4 py-8 font-syne space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 font-mono text-sm font-semibold mb-1">
            <Target className="size-4" /> Centro de Treinador
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Missões e Metas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Complete objetivos diários e marcos de colecionador para ganhar moedas e acelerar sua jornada.
          </p>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <Quests />
    </div>
  );
}