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

        <div className="absolute top-16 right-[8%] opacity-[0.04]">
          <svg width="220" height="220" viewBox="0 0 220 220" fill="none">
            <circle cx="110" cy="110" r="108" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="110" cy="110" r="80" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="110" cy="110" r="52" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="110" cy="110" r="24" stroke="currentColor" strokeWidth="0.5" />
            <line x1="110" y1="2" x2="110" y2="218" stroke="currentColor" strokeWidth="0.5" />
            <line x1="2" y1="110" x2="218" y2="110" stroke="currentColor" strokeWidth="0.5" />
            <line x1="33.6" y1="33.6" x2="186.4" y2="186.4" stroke="currentColor" strokeWidth="0.5" />
            <line x1="186.4" y1="33.6" x2="33.6" y2="186.4" stroke="currentColor" strokeWidth="0.5" />
          </svg>
        </div>

        <div className="absolute bottom-24 left-[5%] opacity-[0.03]">
          <svg width="160" height="160" viewBox="0 0 160 160" fill="none">
            <circle cx="80" cy="80" r="78" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="80" cy="80" r="55" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="80" cy="80" r="32" stroke="currentColor" strokeWidth="0.5" />
          </svg>
        </div>

        <svg
          className="absolute inset-0 h-full w-full opacity-[0.025]"
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
        className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8"
      >
        <header className="mb-12 text-center sm:mb-16">
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-warm-200/80 bg-warm-50/60 px-5 py-2 text-[13px] font-medium tracking-wide text-warm-600 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-md uppercase">
            <span className="relative flex size-1.5" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-terracotta opacity-40 motion-reduce:animate-none" />
              <span className="relative inline-flex size-1.5 rounded-full bg-terracotta" />
            </span>
            Virtusway · Herramienta de Coaching
          </div>

          <h1 className="text-balance font-display text-4xl tracking-tight text-warm-900 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
            Rueda de la Vida
          </h1>

          <div className="mx-auto mt-5 flex items-center justify-center gap-3" aria-hidden="true">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-warm-300" />
            <div className="size-1.5 rotate-45 rounded-[1px] bg-terracotta/60" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-warm-300" />
          </div>

          <p className="text-muted-foreground mx-auto mt-5 max-w-lg text-[15px] leading-relaxed sm:text-base">
            Genera ruedas de la vida personalizadas. Selecciona el tipo, ajusta
            las valoraciones y descarga el resultado en PDF.
          </p>
        </header>

        <WheelOfLifeForm />
      </main>

      <footer className="border-t border-warm-200/40 py-8 text-center">
        <p className="text-xs tracking-widest text-warm-400 uppercase">
          Virtusway · Coaching Tools · {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
