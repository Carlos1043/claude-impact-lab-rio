/**
 * Pure deterministic renderer: Raa → .docx Buffer.
 *
 * Byte-faithful to the 8 reference RELINTs (see `db/relint-template.md`).
 * Specifically matches:
 *   - A4 page (11906 × 16838 EMU) with 2cm margins (1134 EMU all sides)
 *   - Arial font everywhere
 *   - Body at 10pt (sz=20), titles at 11pt (sz=22) bold dark-navy #1b2a4a
 *   - Single-column table with full borders (sz=4 inside, sz=6 cell)
 *   - "Bullets" are plain paragraphs with "•" prefix + 360 EMU left indent
 *     (no real Word numbering — matches the source exactly)
 *   - Body paragraphs are justified, line spacing 1.15 (276)
 *
 * Tested against fixtures/pres-vargas.ts. See `db/relint-template.md` for the
 * source-of-truth template spec.
 */

import {
  AlignmentType,
  BorderStyle,
  Document,
  LineRuleType,
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
// Constants — derived from the reference docx (RI_017)
// ──────────────────────────────────────────────────────────────────

const FONT = "Arial";
const TITLE_COLOR = "1b2a4a"; // dark navy used for centered + bold titles
const SIZE_BODY = 20; // 10pt (half-points)
const SIZE_TITLE = 22; // 11pt

const SINGLE = (size: number) => ({
  style: BorderStyle.SINGLE,
  size,
  color: "000000",
});

const FULL_TABLE_BORDERS = {
  top: SINGLE(4),
  bottom: SINGLE(4),
  left: SINGLE(4),
  right: SINGLE(4),
  insideHorizontal: SINGLE(4),
  insideVertical: SINGLE(4),
};

const FULL_CELL_BORDERS = {
  top: SINGLE(6),
  bottom: SINGLE(6),
  left: SINGLE(6),
  right: SINGLE(6),
};

// ──────────────────────────────────────────────────────────────────
// Building blocks
// ──────────────────────────────────────────────────────────────────

interface RunOpts {
  bold?: boolean;
  size?: number;
  color?: string;
  allCaps?: boolean;
}

function run(text: string, opts: RunOpts = {}): TextRun {
  return new TextRun({
    text: opts.allCaps ? text.toUpperCase() : text,
    font: FONT,
    bold: opts.bold,
    size: opts.size ?? SIZE_BODY,
    color: opts.color,
  });
}

/**
 * Centered + bold title paragraph (dark navy). Matches the centered title
 * rows of the reference RELINT.
 */
function titleParagraph(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60, line: 276, lineRule: LineRuleType.AUTO },
    children: [run(text, { bold: true, size: SIZE_TITLE, color: TITLE_COLOR })],
  });
}

/**
 * Left-aligned bold uppercase section title (e.g. "AVENIDA PRESIDENTE VARGAS",
 * "CONCLUSÃO"). Matches per-location and conclusão header rows.
 */
function sectionTitleParagraph(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 60, line: 276, lineRule: LineRuleType.AUTO },
    children: [run(text, { bold: true, size: SIZE_TITLE, color: TITLE_COLOR, allCaps: true })],
  });
}

/**
 * Justified body paragraph at 10pt Arial, line spacing 1.15, 6pt after.
 */
function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 276, lineRule: LineRuleType.AUTO },
    children: [run(text)],
  });
}

/**
 * Pseudo-bullet paragraph — matches the reference exactly: plain paragraph
 * prefixed with "• " and indented 360 EMU left. No real Word numbering.
 */
function bulletParagraph(text: string): Paragraph {
  return new Paragraph({
    indent: { left: 360, firstLine: 0 },
    spacing: { after: 40, line: 276, lineRule: LineRuleType.AUTO },
    children: [run(`• ${text}`)],
  });
}

/** Wrap paragraphs in a single full-width table cell with full borders. */
function cell(children: Paragraph[]): TableCell {
  return new TableCell({
    children,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: FULL_CELL_BORDERS,
    margins: { top: 100, bottom: 100, left: 150, right: 150 },
  });
}

/** Single-cell table row. */
function row(children: Paragraph[]): TableRow {
  return new TableRow({ children: [cell(children)] });
}

// ──────────────────────────────────────────────────────────────────
// Section builders
// ──────────────────────────────────────────────────────────────────

function buildHeaderRows(areaTitle: string, intro?: string): TableRow[] {
  return [
    row([
      titleParagraph(REPORT_TITLE_LINE_1),
      titleParagraph(REPORT_TITLE_LINE_2),
    ]),
    row([titleParagraph(areaTitle.toUpperCase())]),
    row([bodyParagraph(intro ?? DEFAULT_INTRO)]),
  ];
}

function buildObservationsBlock(obs: RaaObservations): Paragraph[] {
  const keys: Array<keyof RaaObservations> = [
    "retencaoFluxo",
    "baixaVisibilidade",
    "obstaculos",
    "motosBicis",
    "rotasDispersao",
  ];
  return [
    bodyParagraph(OBSERVATIONS_LEAD_IN),
    ...keys.map((key, i) => {
      const detail = obs[key];
      // Last bullet ends with "." in source; others with ";"
      const terminator = i === keys.length - 1 ? "." : ";";
      return bulletParagraph(`${OBSERVATION_PREFIXES[i]} — ${detail}${terminator}`);
    }),
  ];
}

function buildLocationRows(loc: RaaLocation): TableRow[] {
  const dinamica = loc.dinamicaCriminal ?? DEFAULT_DINAMICA_CRIMINAL;
  return [
    row([sectionTitleParagraph(loc.title)]),
    row([
      bodyParagraph(loc.context),
      ...buildObservationsBlock(loc.observations),
      bodyParagraph(dinamica),
    ]),
  ];
}

function buildConclusionRows(raa: Raa): TableRow[] {
  const c = raa.conclusion;
  const synthesisWithLeadIn = c.synthesis.trimEnd().endsWith(":")
    ? c.synthesis
    : `${c.synthesis} ${CONCLUSAO_ACTIONS_LEAD_IN}`;

  const actionsParas = c.actions.map((a, i) => {
    const terminator = i === c.actions.length - 1 ? "." : ";";
    return bulletParagraph(`${a.category} — ${a.detail}${terminator}`);
  });

  return [
    row([sectionTitleParagraph(CONCLUSAO_TITLE)]),
    row([bodyParagraph(synthesisWithLeadIn), ...actionsParas, bodyParagraph(c.closingTimePattern)]),
  ];
}

// ──────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────

/** Build a `docx` Document from a structured RAA. */
export function buildRaaDoc(raa: Raa): Document {
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: FULL_TABLE_BORDERS,
    rows: [
      ...buildHeaderRows(raa.areaTitle, raa.intro),
      ...raa.locations.flatMap(buildLocationRows),
      ...buildConclusionRows(raa),
    ],
  });

  return new Document({
    creator: "CompStat Rio — Claude Impact Lab",
    title: `RAA ${raa.areaTitle}`,
    description: `Relatório Analítico de Área — polygon ${raa.polygonFid}`,
    styles: {
      default: {
        document: { run: { font: FONT, size: SIZE_BODY } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 1134, bottom: 1134, left: 1134, right: 1134, header: 708, footer: 708 },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200, line: 276, lineRule: LineRuleType.AUTO },
            children: [run(REPORT_TOP_LABEL, { bold: true, size: SIZE_TITLE, color: TITLE_COLOR })],
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
