import Link from "next/link";
import {
  CircleDotIcon,
  ArrowRightIcon,
  BrainIcon,
  HeartIcon,
  BriefcaseIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Decorative background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-linear-to-br from-emerald-100/60 to-cyan-100/40 blur-3xl dark:from-emerald-950/30 dark:to-cyan-950/20" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-linear-to-tr from-rose-100/50 to-amber-100/30 blur-3xl dark:from-rose-950/20 dark:to-amber-950/10" />
        <div className="absolute top-1/2 left-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-bl from-blue-100/40 to-violet-100/20 blur-3xl dark:from-blue-950/15 dark:to-violet-950/10" />
      </div>

      <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-16 px-4 py-20 sm:px-6">
        {/* Hero */}
        <div className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-white/60 px-4 py-1.5 text-sm font-medium shadow-sm backdrop-blur dark:bg-white/5">
            <BrainIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
            Virtusway
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Coaching{" "}
            <span className="bg-linear-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-cyan-400">
              Tools
            </span>
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg">
            Herramientas digitales para coaches profesionales. Genera informes,
            evalúa competencias y potencia tus sesiones de coaching.
          </p>
        </div>

        {/* Tools grid */}
        <div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Wheel of Life – active */}
          <Link href="/rueda-de-la-vida" className="group">
            <Card className="h-full transition-all duration-200 group-hover:shadow-lg group-hover:-translate-y-0.5 group-hover:border-emerald-200 dark:group-hover:border-emerald-800">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                  <CircleDotIcon className="size-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle className="flex items-center gap-2">
                  Rueda de la Vida
                  <ArrowRightIcon className="size-4 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                </CardTitle>
                <CardDescription>
                  Genera ruedas de la vida personalizadas (Personal, Pareja,
                  Profesional) y expórtalas en PDF.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    Disponible
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* DISC – coming soon */}
          <div className="opacity-60">
            <Card className="h-full">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
                  <BriefcaseIcon className="size-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Estudio DISC</CardTitle>
                <CardDescription>
                  Evaluación conductual DISC con perfiles naturales y adaptados
                  para coaching ejecutivo y de equipos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    Próximamente
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* More tools – coming soon */}
          <div className="opacity-60">
            <Card className="h-full">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950">
                  <HeartIcon className="size-5 text-rose-600 dark:text-rose-400" />
                </div>
                <CardTitle>Evaluación de Competencias</CardTitle>
                <CardDescription>
                  Herramientas para mapear competencias clave, evaluar
                  fortalezas y definir planes de desarrollo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    Próximamente
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
