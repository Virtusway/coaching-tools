import type { Metadata } from "next";
import WheelOfLifeForm from "./_components/wheel-of-life-form";

export const metadata: Metadata = {
  title: "Rueda de la Vida | Coaching Tools",
  description:
    "Genera ruedas de la vida personalizadas para tus coachees. Elige entre las ruedas Personal, de Pareja o Profesional, ajusta las valoraciones y descarga el resultado en PDF.",
};

export default function RuedaDeLaVidaPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-60 -right-60 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,oklch(0.92_0.04_40)_0%,transparent_70%)] opacity-40" />
        <div className="absolute top-1/3 -left-40 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,oklch(0.94_0.03_150)_0%,transparent_70%)] opacity-30" />
        <div className="absolute -bottom-40 right-1/4 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,oklch(0.93_0.04_55)_0%,transparent_70%)] opacity-25" />
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.03]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <filter id="grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="mb-10 text-center sm:mb-14">
          <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-warm-200 bg-warm-50/80 px-4 py-1.5 text-sm font-medium text-warm-700 shadow-sm backdrop-blur-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-terracotta opacity-50" />
              <span className="relative inline-flex size-2 rounded-full bg-terracotta" />
            </span>
            Virtusway · Herramienta de Coaching
          </div>
          <h1 className="font-display text-4xl tracking-tight text-warm-900 sm:text-5xl lg:text-6xl">
            Rueda de la Vida
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-base leading-relaxed sm:text-lg">
            Genera ruedas de la vida personalizadas. Selecciona el tipo, ajusta
            las valoraciones y descarga el resultado en PDF.
          </p>
        </header>

        <WheelOfLifeForm />
      </main>

      <footer className="border-t border-warm-200/60 py-6 text-center text-sm text-warm-500">
        <p>Virtusway · Coaching Tools</p>
      </footer>
    </div>
  );
}
