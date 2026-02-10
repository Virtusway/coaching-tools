import type { Metadata } from "next";
import { CircleDotIcon } from "lucide-react";
import WheelOfLifeForm from "./_components/wheel-of-life-form";

export const metadata: Metadata = {
  title: "Rueda de la Vida | Coaching Tools",
  description:
    "Genera ruedas de la vida personalizadas para tus coachees. Elige entre las ruedas Personal, de Pareja o Profesional, ajusta las valoraciones y descarga el resultado en PDF.",
};

export default function RuedaDeLaVidaPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Decorative background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-linear-to-br from-emerald-100/60 to-cyan-100/40 blur-3xl dark:from-emerald-950/30 dark:to-cyan-950/20" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-linear-to-tr from-rose-100/50 to-amber-100/30 blur-3xl dark:from-rose-950/20 dark:to-amber-950/10" />
      </div>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-white/60 px-4 py-1.5 text-sm font-medium shadow-sm backdrop-blur dark:bg-white/5">
            <CircleDotIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
            Herramienta de Coaching
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Rueda de la Vida
          </h1>
          <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-base sm:text-lg">
            Genera ruedas de la vida personalizadas para tus coachees.
            Selecciona el tipo de rueda, ajusta las valoraciones de cada
            categoría y descarga el resultado en PDF.
          </p>
        </header>

        {/* Form + Chart */}
        <WheelOfLifeForm />
      </main>
    </div>
  );
}
