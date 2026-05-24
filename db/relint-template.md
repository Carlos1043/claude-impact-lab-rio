# RELINT Template Specification

The Relatório Analítico de Área (RAA) we generate must structurally mirror the 8 existing RELINT .docx files at `Relint.markdown` in the DB. This document is the **source of truth** for the format.

## Visual layout

The RELINT is rendered as a **single-column borderless table** in MS Word — every section is a row. The pattern:

```
┌─ Title row (centered, bold) ─────────────────────────────────┐
│   RELATÓRIO DE INTELIGÊNCIA DE ÁREA                          │
│   Subsídio para Reunião de CompStat                          │
├─ Area name (centered, bold, UPPERCASE) ──────────────────────┤
│   PRESIDENTE VARGAS – CAMPO DE SANTANA – CENTRAL – CINELÂNDIA│
├─ Intro paragraph (left, normal) ─────────────────────────────┤
│   A presente análise territorial visa identificar...         │
├─ Location 1 title (bold, UPPERCASE) ─────────────────────────┤
│   AVENIDA PRESIDENTE VARGAS                                  │
├─ Location 1 body (left, normal) ─────────────────────────────┤
│   {context paragraph}                                        │
│                                                              │
│   Também foram identificados:                                │
│     • retenção de fluxo em horários de pico — {specific}     │
│     • áreas com baixa visibilidade — {specific}              │
│     • obstáculos urbanos dificultando vigilância — {specific}│
│     • circulação intensa de motocicletas e bicicletas — ...  │
│     • múltiplas rotas de dispersão após a prática criminosa  │
│                                                              │
│   A dinâmica criminal observada indica predominância de      │
│   indivíduos atuando a pé, motocicletas e bicicletas...      │
├─ Location 2 title + body (repeat) ───────────────────────────┤
├─ Location 3 title + body (repeat) ───────────────────────────┤
├─ CONCLUSÃO (bold, UPPERCASE) ────────────────────────────────┤
├─ Conclusion body ────────────────────────────────────────────┤
│   {synthesis paragraph}                                      │
│                                                              │
│   Observa-se necessidade de:                                 │
│     • reforço do patrulhamento preventivo — {detail}         │
│     • melhoria da iluminação pública — {detail}              │
│     • {action by órgão} — {detail}                           │
│     ...                                                      │
│                                                              │
│   {closing time-pattern paragraph}                           │
└──────────────────────────────────────────────────────────────┘
```

## Fixed boilerplate (verbatim across 7/8 RELINTs)

### Intro paragraph

> A presente análise territorial visa identificar fatores urbanos, dinâmica criminal e vulnerabilidades relacionadas à sensação de segurança da população, considerando áreas de grande circulação de pedestres e integração com o transporte público. Foram observados fatores associados à incidência de furtos e roubos contra transeuntes, especialmente subtração de aparelhos celulares, além de elementos urbanos que favorecem delitos oportunistas.

> *Variant for unusual polygons (e.g. Rio Sul opens with a custom site-specific sentence then ends with the boilerplate suffix.)*

### Dinâmica criminal closer (after each location's bullets)

> A dinâmica criminal observada indica predominância de indivíduos atuando a pé, motocicletas e bicicletas, aproveitando momentos de distração das vítimas em áreas de espera, travessias e acessos ao transporte público.

> *Identical in every location across every RELINT. Treat as a constant.*

## Per-location bullet structure (5 STANDARDIZED items, in order)

Each location's "Também foram identificados:" list has exactly these 5 bullets, always in this order:

1. `retenção de fluxo em horários de pico — {SPECIFIC DETAIL}`
2. `áreas com baixa visibilidade — {SPECIFIC DETAIL}`
3. `obstáculos urbanos dificultando vigilância — {SPECIFIC DETAIL}`
4. `circulação intensa de motocicletas e bicicletas — {SPECIFIC DETAIL}`
5. `múltiplas rotas de dispersão após a prática criminosa — {SPECIFIC DETAIL}`

The detail after each em-dash (`—`) is location-specific and is what the LLM/data fills in.

## Conclusion structure

The Conclusão has 3 parts:

1. **Synthesis paragraph** — 2-4 sentences naming the specific vulnerabilities found per location and the overall pattern. Closes with "Observa-se necessidade de:"
2. **Action items** — 4-6 bulleted items, each in format `{category} — {detail referencing órgão/polygon/time}`. Common categories:
   - reforço do patrulhamento preventivo
   - melhoria da iluminação pública
   - poda de vegetação
   - fiscalização e ordenamento do comércio irregular
   - ações de ordenamento urbano (PSR)
   - ações integradas de ordenamento urbano (coordenação com PMERJ/PCERJ)
3. **Closing time-pattern paragraph** — 1 sentence on when delitos tend to happen (peak hours / nighttime / weekends / Carnival).

## Voice and length

- **Voice:** formal, third-person, public-administration register. No first-person, no editorializing.
- **Sentence length:** medium-long (≈25 words avg).
- **Specificity:** cite street names, intersections, station names, time windows (e.g. `07h–09h`), and named structures (Camelódromo da Uruguaiana, Cidade Nova metrô).
- **Citations:** the existing RELINTs cite ISP-RJ stats and PCERJ investigations in-prose ("Em 2025, mais de 5.000 furtos... segundo dados do Instituto de Segurança Pública"). When the underlying data supports a stat, include it.
- **Length per RELINT:** ~7-9 KB plain text (≈ 4-6 Word pages). Anything longer reads as AI slop to a career analyst.

## Number of locations per RELINT

Existing 8 RELINTs cover **2-3 locations** each. The Pres. Vargas one is the longest (3 locations + dense citation). Default to 3 locations.

## Filename convention

`RI_{NNN}_{YYYY}_{PolygonNameSlug}.docx` — e.g. `RI_017_2026_Presidente_Vargas_Campo_Santana.docx`

For new RAAs auto-generated by our tool, use a different prefix to avoid confusion:

`RAA_{YYYY}-W{WW}_{PolygonNameSlug}.docx` — e.g. `RAA_2026-W21_Presidente_Vargas.docx`
