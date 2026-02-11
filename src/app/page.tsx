import type { Metadata } from "next";
import WheelOfLifeForm from "./_components/wheel-of-life-form";

export const metadata: Metadata = {
  title: "Rueda de la Vida",
  description:
    "Genera ruedas de la vida personalizadas para tus coachees. Elige entre las ruedas Personal, de Pareja o Profesional, ajusta las valoraciones y descarga el resultado en PDF.",
};

export default function RuedaDeLaVidaPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <a
        href="#main-content"
        className="bg-warm-900 text-warm-50 focus-visible:ring-warm-300 sr-only fixed top-3 left-3 z-50 rounded-md px-4 py-2 text-sm font-medium focus:not-sr-only focus-visible:ring-2 focus-visible:outline-none"
      >
        Saltar al contenido principal
      </a>

      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-60 -right-60 h-150 w-150 rounded-full bg-[radial-gradient(circle,oklch(0.92_0.04_40)_0%,transparent_70%)] opacity-40" />
        <div className="absolute top-1/3 -left-40 h-125 w-125 rounded-full bg-[radial-gradient(circle,oklch(0.94_0.03_150)_0%,transparent_70%)] opacity-30" />
        <div className="absolute -bottom-40 right-1/4 h-100 w-100 rounded-full bg-[radial-gradient(circle,oklch(0.93_0.04_55)_0%,transparent_70%)] opacity-25" />
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

      <main
        id="main-content"
        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
      >
        <header className="mb-10 text-center sm:mb-14">
          <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-warm-200 bg-warm-50/80 px-4 py-1.5 text-sm font-medium text-warm-700 shadow-sm backdrop-blur-sm">
            <span className="relative flex size-2" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-terracotta opacity-50 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-terracotta" />
            </span>
            Virtusway · Herramienta de Coaching
          </div>
          <h1 className="text-balance font-display text-4xl tracking-tight text-warm-900 sm:text-5xl lg:text-6xl">
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
