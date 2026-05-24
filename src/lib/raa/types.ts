/**
 * Relatório Analítico de Área (RAA) — structured shape.
 *
 * Mirrors the format of the 8 existing RELINTs (see `db/relint-template.md`).
 * The .docx renderer at `./render.ts` consumes this shape; the AI generator
 * at `./generate.ts` produces it from Prisma data + Claude.
 */

/** A single section of the report (e.g. "Avenida Presidente Vargas"). */
export interface RaaLocation {
  /** Bold uppercase title row. */
  title: string;
  /** Free-form context paragraph — describe the place, traffic, structures, citing data. */
  context: string;
  /** The 5 STANDARDIZED observation bullets. Order is fixed. */
  observations: RaaObservations;
  /**
   * Optional override for the "dinâmica criminal" closing paragraph.
   * Default uses the boilerplate from `./template.ts` — change only if the
   * location's MO genuinely differs from the standard "a pé, motos, bicicletas".
   */
  dinamicaCriminal?: string;
}

/**
 * The 5 standardized observation buckets. The renderer always emits these
 * 5 bullets in this order. The string value is the **specific detail** that
 * goes after the em-dash — do NOT include the bullet prefix.
 *
 * @example
 *   retencaoFluxo: "pontos de ônibus ao longo de toda a extensão da via"
 *   // renders as: "• retenção de fluxo em horários de pico — pontos de ônibus..."
 */
export interface RaaObservations {
  retencaoFluxo: string;
  baixaVisibilidade: string;
  obstaculos: string;
  motosBicis: string;
  rotasDispersao: string;
}

/** A single conclusion action item. */
export interface RaaAction {
  /**
   * The category prefix — appears before the em-dash.
   * @example "reforço do patrulhamento preventivo"
   */
  category: string;
  /**
   * Specific detail — appears after the em-dash. Should name a specific órgão,
   * place, time window, or measurable outcome.
   * @example "com foco nos horários de pico (06h–09h e 17h–20h) nos três pontos"
   */
  detail: string;
  /**
   * Optional reference to the responsible Secretaria. Used by the Reverse
   * CompStat scorecard to grade SLA closure rates.
   */
  orgao?: string;
}

/** The Conclusão section of the RAA. */
export interface RaaConclusion {
  /**
   * Synthesis paragraph — 2-4 sentences naming the specific vulnerabilities
   * per location and the overall pattern. Will be followed by "Observa-se
   * necessidade de:" automatically by the renderer.
   */
  synthesis: string;
  /** Action items as bulleted list. Aim for 4-6 items. */
  actions: RaaAction[];
  /**
   * Closing time-pattern paragraph — 1 sentence on when delitos occur.
   * @example "Os delitos tendem a ocorrer principalmente nos horários de pico..."
   */
  closingTimePattern: string;
}

/** A complete RAA, ready for rendering. */
export interface Raa {
  /** Polygon FID for filename/metadata. */
  polygonFid: number;
  /** Centered uppercase area title row (e.g. "PRESIDENTE VARGAS – CAMPO DE SANTANA – ..."). */
  areaTitle: string;
  /**
   * Optional override for the standard intro paragraph. Defaults to the
   * boilerplate in `./template.ts` (used by 7/8 existing RELINTs).
   */
  intro?: string;
  /** 2-3 locations is the norm. */
  locations: RaaLocation[];
  /** The Conclusão. */
  conclusion: RaaConclusion;
  /** Generation metadata (not rendered into the docx). */
  meta?: {
    generatedAt: string; // ISO timestamp
    weekIso: string; // e.g. "2026-W21"
    source: "ai" | "fixture" | "manual";
  };
}
