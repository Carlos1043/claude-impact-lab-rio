/**
 * Fixed boilerplate from the existing RELINTs.
 * See `db/relint-template.md` for source citations and rationale.
 */

/** Top label, above the boxed table. Markdown bold in source. */
export const REPORT_TOP_LABEL =
  "RELATÓRIO DE INTELIGÊNCIA DE ÁREA – COMPSTAT – DADOS PÚBLICOS";

/** Title row line 1 (centered, bold). */
export const REPORT_TITLE_LINE_1 = "RELATÓRIO DE INTELIGÊNCIA DE ÁREA";

/** Title row line 2 (centered, bold). */
export const REPORT_TITLE_LINE_2 = "Subsídio para Reunião de CompStat";

/** Default intro paragraph. Used by 7/8 existing RELINTs verbatim. */
export const DEFAULT_INTRO =
  "A presente análise territorial visa identificar fatores urbanos, dinâmica criminal e vulnerabilidades relacionadas à sensação de segurança da população, considerando áreas de grande circulação de pedestres e integração com o transporte público. Foram observados fatores associados à incidência de furtos e roubos contra transeuntes, especialmente subtração de aparelhos celulares, além de elementos urbanos que favorecem delitos oportunistas.";

/**
 * Default "dinâmica criminal" closing paragraph that appears after each
 * location's bullets. Verbatim in every existing RELINT.
 */
export const DEFAULT_DINAMICA_CRIMINAL =
  "A dinâmica criminal observada indica predominância de indivíduos atuando a pé, motocicletas e bicicletas, aproveitando momentos de distração das vítimas em áreas de espera, travessias e acessos ao transporte público.";

/** The 5 standardized observation bullet prefixes, in canonical order. */
export const OBSERVATION_PREFIXES = [
  "retenção de fluxo em horários de pico",
  "áreas com baixa visibilidade",
  "obstáculos urbanos dificultando vigilância",
  "circulação intensa de motocicletas e bicicletas",
  "múltiplas rotas de dispersão após a prática criminosa",
] as const;

/** Lead-in line for the per-location observations list. */
export const OBSERVATIONS_LEAD_IN = "Também foram identificados:";

/** Conclusão title. */
export const CONCLUSAO_TITLE = "CONCLUSÃO";

/** Lead-in line for the conclusion's action items. */
export const CONCLUSAO_ACTIONS_LEAD_IN = "Observa-se necessidade de:";
