/**
 * Pure deterministic renderer: Raa → .docx Buffer.
 *
 * Mirrors the visual layout of the 8 existing RELINTs:
 * a single-column borderless table with alternating title/body rows.
 *
 * Tested against `./fixtures/pres-vargas.ts`. See `db/relint-template.md`
 * for the source-of-truth template spec.
 */

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import type { Raa, RaaLocation, RaaObservations } from "./types";
import {
  CONCLUSAO_ACTIONS_LEAD_IN,
  CONCLUSAO_TITLE,
  DEFAULT_DINAMICA_CRIMINAL,
  DEFAULT_INTRO,
  OBSERVATIONS_LEAD_IN,
  OBSERVATION_PREFIXES,
  REPORT_TITLE_LINE_1,
  REPORT_TITLE_LINE_2,
  REPORT_TOP_LABEL,
} from "./template";

// ──────────────────────────────────────────────────────────────────
// Building blocks
// ──────────────────────────────────────────────────────────────────

const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

function bold(text: string, opts: { size?: number; allCaps?: boolean } = {}) {
  return new TextRun({
    text: opts.allCaps ? text.toUpperCase() : text,
    bold: true,
    size: opts.size ?? 22, // half-points → 11pt default
  });
}

function plain(text: string, size = 22) {
  return new TextRun({ text, size });
}

/** Centered + bold paragraph — used for title rows. */
function titleParagraph(text: string, size = 24) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [bold(text, { size })],
    spacing: { after: 80 },
  });
}

/** Left-aligned bold uppercase paragraph — used for location/conclusão titles. */
function sectionTitleParagraph(text: string) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    children: [bold(text, { size: 22, allCaps: true })],
    spacing: { before: 80, after: 80 },
  });
}

/** A plain left-aligned paragraph. */
function bodyParagraph(text: string) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    children: [plain(text)],
    spacing: { after: 120 },
  });
}

/** A bullet list item (uses the docx "bullet" numbering style). */
function bulletParagraph(text: string) {
  return new Paragraph({
    bullet: { level: 0 },
    children: [plain(text)],
    spacing: { after: 60 },
    indent: { left: 540 },
  });
}

/** Make a single full-width borderless table cell containing the given paragraphs. */
function cell(children: Paragraph[]) {
  return new TableCell({
    children,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    margins: { top: 100, bottom: 100, left: 150, right: 150 },
  });
}

/** Wrap a cell as a single-cell row. */
function row(children: Paragraph[]) {
  return new TableRow({
    children: [cell(children)],
    height: { value: 0, rule: HeightRule.AUTO },
  });
}

// ──────────────────────────────────────────────────────────────────
// Section builders
// ──────────────────────────────────────────────────────────────────

function buildTitleRow() {
  return row([
    titleParagraph(REPORT_TITLE_LINE_1),
    titleParagraph(REPORT_TITLE_LINE_2),
  ]);
}

function buildAreaTitleRow(areaTitle: string) {
  return row([titleParagraph(areaTitle.toUpperCase())]);
}

function buildIntroRow(intro?: string) {
  return row([bodyParagraph(intro ?? DEFAULT_INTRO)]);
}

function buildObservationsBlock(obs: RaaObservations): Paragraph[] {
  const details: Array<keyof RaaObservations> = [
    "retencaoFluxo",
    "baixaVisibilidade",
    "obstaculos",
    "motosBicis",
    "rotasDispersao",
  ];
  return [
    bodyParagraph(OBSERVATIONS_LEAD_IN),
    ...details.map((key, i) =>
      bulletParagraph(`${OBSERVATION_PREFIXES[i]} — ${obs[key]}`),
    ),
  ];
}

function buildLocationRows(loc: RaaLocation): TableRow[] {
  const dinamicaText = loc.dinamicaCriminal ?? DEFAULT_DINAMICA_CRIMINAL;
  return [
    row([sectionTitleParagraph(loc.title)]),
    row([
      bodyParagraph(loc.context),
      ...buildObservationsBlock(loc.observations),
      bodyParagraph(dinamicaText),
    ]),
  ];
}

function buildConclusionRows(raa: Raa): TableRow[] {
  const c = raa.conclusion;
  const synthesisWithLeadIn = c.synthesis.trimEnd().endsWith(":")
    ? c.synthesis // user already added the colon lead-in
    : `${c.synthesis} ${CONCLUSAO_ACTIONS_LEAD_IN}`;

  return [
    row([sectionTitleParagraph(CONCLUSAO_TITLE)]),
    row([
      bodyParagraph(synthesisWithLeadIn),
      ...c.actions.map((a) =>
        bulletParagraph(`${a.category} — ${a.detail}`),
      ),
      bodyParagraph(c.closingTimePattern),
    ]),
  ];
}

// ──────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────

/**
 * Build a `docx` Document from a structured RAA.
 *
 * @example
 *   const doc = buildRaaDoc(raa);
 *   const buf = await Packer.toBuffer(doc);
 *   // → write `buf` to response stream
 */
export function buildRaaDoc(raa: Raa): Document {
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: NO_BORDERS.top,
      bottom: NO_BORDERS.bottom,
      left: NO_BORDERS.left,
      right: NO_BORDERS.right,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
      insideVertical: NO_BORDERS.left,
    },
    rows: [
      buildTitleRow(),
      buildAreaTitleRow(raa.areaTitle),
      buildIntroRow(raa.intro),
      ...raa.locations.flatMap(buildLocationRows),
      ...buildConclusionRows(raa),
    ],
  });

  return new Document({
    creator: "CompStat Rio — Claude Impact Lab",
    title: `RAA ${raa.areaTitle}`,
    description: `Relatório Analítico de Área — polygon ${raa.polygonFid}`,
    sections: [
      {
        properties: {
          page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } },
        },
        children: [
          new Paragraph({
            children: [bold(REPORT_TOP_LABEL, { size: 22 })],
            spacing: { after: 200 },
          }),
          table,
        ],
      },
    ],
  });
}

/** Render a RAA to a Node Buffer (use with NextResponse). */
export async function renderRaaToBuffer(raa: Raa): Promise<Buffer> {
  return Packer.toBuffer(buildRaaDoc(raa));
}

/**
 * Filename for the rendered .docx.
 * @example raaFilename(20, "2026-W21") → "RAA_2026-W21_pol-20.docx"
 */
export function raaFilename(polygonFid: number, weekIso?: string): string {
  const wk = weekIso ?? currentIsoWeek();
  return `RAA_${wk}_pol-${polygonFid}.docx`;
}

/** YYYY-Www string for the current week. */
function currentIsoWeek(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const firstJan = new Date(Date.UTC(year, 0, 1));
  const dayOfYear =
    Math.floor((now.getTime() - firstJan.getTime()) / 86_400_000) + 1;
  const week = Math.ceil((dayOfYear + firstJan.getUTCDay()) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}
