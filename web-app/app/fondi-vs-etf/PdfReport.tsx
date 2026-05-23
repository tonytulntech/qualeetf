'use client'
import { useMemo } from 'react'
import {
  Document, Page, Text, View, StyleSheet, PDFDownloadLink,
} from '@react-pdf/renderer'
import { Download } from 'lucide-react'
import {
  fmtPct, INSTRUMENT_LABELS, buildCostBreakdown, buildAggregatedAllocation,
  type SimResult,
} from '@/lib/comparatore-calc'

// PDF-specific currency formatter: double-space after € avoids Helvetica glyph overlap
function fmtEur(n: number): string {
  const abs = Math.abs(Math.round(n))
  const s = abs.toLocaleString('it-IT', { useGrouping: true })
  return (n < 0 ? '-' : '') + '€  ' + s
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  navy:   '#0F172A',
  accent: '#3BAED4',
  green:  '#22C55E',
  red:    '#EF4444',
  gray2:  '#334155',
  gray3:  '#64748B',
  gray4:  '#94A3B8',
  gray6:  '#E2E8F0',
  gray7:  '#F8FAFC',
  white:  '#FFFFFF',
}

// A4 usable width = 595 - 36*2 = 523pt
const S = StyleSheet.create({
  page:  { fontFamily: 'Helvetica', backgroundColor: C.white, paddingBottom: 50 },
  body:  { paddingHorizontal: 36, paddingTop: 18 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 36, paddingVertical: 12, backgroundColor: C.navy,
  },
  headerBrand: { flexDirection: 'row', alignItems: 'center' },
  headerLogoBox: {
    width: 20, height: 20, borderRadius: 4, backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center', marginRight: 6,
  },
  headerLogoText:   { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.white },
  headerLogoAccent: { color: C.accent },
  headerDate: { fontSize: 7.5, color: C.gray4 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 36, paddingVertical: 9,
    backgroundColor: C.gray7, borderTopWidth: 1, borderTopColor: C.gray6,
  },
  footerText: { fontSize: 7, color: C.gray4 },

  cover: {
    flex: 1, backgroundColor: C.navy,
    alignItems: 'center', justifyContent: 'center', padding: 48,
  },
  coverLogoBox: {
    width: 56, height: 56, borderRadius: 12, backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: 22,
  },
  coverTag:     { fontSize: 8, color: C.accent, letterSpacing: 2, marginBottom: 12, fontFamily: 'Helvetica-Bold' },
  coverH1:      { fontSize: 28, fontFamily: 'Helvetica-Bold', color: C.white, textAlign: 'center', marginBottom: 8 },
  coverSub:     { fontSize: 12, color: C.gray4, textAlign: 'center', marginBottom: 34 },
  coverDivider: { width: 40, height: 2, backgroundColor: C.accent, marginBottom: 26 },
  coverMetaRow:   { flexDirection: 'row', gap: 28 },
  coverMetaItem:  { alignItems: 'center' },
  coverMetaLabel: { fontSize: 7, color: C.gray4, letterSpacing: 1, marginBottom: 3 },
  coverMetaValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.white },

  sectionTitle: {
    fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.navy,
    borderBottomWidth: 2, borderBottomColor: C.accent,
    paddingBottom: 5, marginBottom: 11, marginTop: 18,
  },

  p:    { fontSize: 8.5, color: C.gray2, lineHeight: 1.65, marginBottom: 5 },
  bold: { fontFamily: 'Helvetica-Bold' },
  small:{ fontSize: 7, color: C.gray3, lineHeight: 1.55 },

  kpiRow:  { flexDirection: 'row', gap: 8, marginBottom: 12 },
  kpiCard: {
    flex: 1, backgroundColor: C.gray7, borderRadius: 7,
    padding: 10, borderLeftWidth: 3, borderLeftColor: C.accent,
  },
  kpiLabel: { fontSize: 6.5, color: C.gray4, letterSpacing: 0.8, marginBottom: 3 },
  kpiValue: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.navy },
  kpiSub:   { fontSize: 6.5, color: C.gray4, marginTop: 2 },

  alertBox: {
    backgroundColor: '#FFF1F2', borderRadius: 7, padding: 12,
    borderLeftWidth: 4, borderLeftColor: C.red, marginBottom: 12,
  },
  alertTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.red, marginBottom: 4 },
  alertText:  { fontSize: 8, color: C.gray2, lineHeight: 1.65 },

  instCard: {
    flexDirection: 'row', borderRadius: 7, padding: 10, marginBottom: 7,
    backgroundColor: C.gray7, borderLeftWidth: 3, borderLeftColor: C.accent, gap: 14,
  },
  instCol:   { flex: 1 },
  instLabel: { fontSize: 6, color: C.gray4, letterSpacing: 0.8, marginBottom: 2 },
  instValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.navy },

  disclaimer: {
    backgroundColor: C.gray7, borderRadius: 7, padding: 11,
    borderWidth: 1, borderColor: C.gray6, marginTop: 10,
  },
})

// ─── Fixed column widths (must sum ≤ 523pt) ──────────────────────────────────

const CI = { name: 130, type: 90, cap: 70, hor: 50, ret: 70, ter: 80 }   // Dati inseriti (490)
const CR = { name: 140, nc: 90, wc: 90, cost: 90, cagr: 80 }             // Risultati (490)
const CC = { name: 110, entry: 70, annual: 80, perf: 70, exit: 70, tot: 80 } // Costi (480)

// ─── Cell components ─────────────────────────────────────────────────────────

function TH({ children, w, align = 'left' }: { children: string; w: number; align?: 'left' | 'right' }) {
  return (
    <View style={{ width: w, paddingHorizontal: 5, paddingVertical: 5 }}>
      <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.white, textAlign: align }}>
        {children}
      </Text>
    </View>
  )
}

function TD({ children, w, color = C.gray2, bold = false, align = 'left' }: {
  children: string; w: number; color?: string; bold?: boolean; align?: 'left' | 'right'
}) {
  return (
    <View style={{ width: w, paddingHorizontal: 5, paddingVertical: 6 }}>
      <Text style={{
        fontSize: 7.5,
        fontFamily: bold ? 'Helvetica-Bold' : 'Helvetica',
        color, textAlign: align,
      }}>
        {children}
      </Text>
    </View>
  )
}

// ─── Horizontal bar chart (pure View layout — zero SVG text issues) ───────────

function HBarChart({ items }: { items: { label: string; value: number; color: string }[] }) {
  if (!items.length) return null
  const maxVal = Math.max(...items.map(d => d.value), 1)
  return (
    <View style={{ marginTop: 6, marginBottom: 4 }}>
      {items.map((d, i) => {
        const barW = Math.max(6, Math.round((d.value / maxVal) * 210))
        const labelStr = d.label || 'Strumento'
        const name = labelStr.length > 24 ? labelStr.slice(0, 22) + '…' : labelStr
        return (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <View style={{ width: 145 }}>
              <Text style={{ fontSize: 7.5, color: C.gray2 }}>{name}</Text>
            </View>
            <View style={{ width: 216, height: 14, justifyContent: 'center' }}>
              <View style={{ height: 10, width: barW, backgroundColor: d.color, borderRadius: 2 }} />
            </View>
            <View style={{ width: 88 }}>
              <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.gray2 }}>
                {fmtEur(d.value)}
              </Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}

// ─── Allocation pills ─────────────────────────────────────────────────────────

function AllocPills({ items }: { items: { name: string; value: number; color: string }[] }) {
  if (!items.length) return null
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
      {items.map((s, i) => (
        <View key={i} style={{
          flexDirection: 'row', alignItems: 'center', gap: 5,
          backgroundColor: C.gray7, borderRadius: 5,
          paddingHorizontal: 8, paddingVertical: 5,
          borderLeftWidth: 3, borderLeftColor: s.color,
        }}>
          <Text style={{ fontSize: 7, color: C.gray3 }}>{s.name}</Text>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.navy }}>
            {s.value.toFixed(1)}%
          </Text>
        </View>
      ))}
    </View>
  )
}

// ─── Growth checkpoint table (replaces line chart) ────────────────────────────

function GrowthTable({ results }: { results: SimResult[] }) {
  const minH = Math.min(...results.map(r => r.instrument.horizon))
  const yrs  = [
    Math.max(1, Math.round(minH * 0.25)),
    Math.round(minH * 0.5),
    Math.round(minH * 0.75),
    minH,
  ].filter((v, i, a) => v > 0 && a.indexOf(v) === i)

  const nameW = 130
  const colW  = Math.floor((523 - nameW) / yrs.length)

  return (
    <View style={{ marginTop: 6 }}>
      <View style={{ flexDirection: 'row', backgroundColor: C.navy, borderRadius: 4, marginBottom: 1 }}>
        <View style={{ width: nameW, paddingHorizontal: 5, paddingVertical: 5 }}>
          <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.white }}>Strumento</Text>
        </View>
        {yrs.map(yr => (
          <View key={yr} style={{ width: colW, paddingHorizontal: 5, paddingVertical: 5 }}>
            <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.white, textAlign: 'right' }}>
              Anno {yr}
            </Text>
          </View>
        ))}
      </View>
      {results.map((r, i) => (
        <View key={r.instrument.id} style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: i % 2 === 0 ? C.white : C.gray7,
          borderBottomWidth: 1, borderBottomColor: C.gray6,
        }}>
          <View style={{ width: nameW, paddingHorizontal: 5, paddingVertical: 5 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 7, height: 7, backgroundColor: r.instrument.color, borderRadius: 2 }} />
              <Text style={{ fontSize: 7, color: C.gray2 }}>
                {(r.instrument.name || `Strumento ${i + 1}`).slice(0, 18)}
              </Text>
            </View>
          </View>
          {yrs.map(yr => {
            const pt  = r.points[yr - 1]
            const val = pt?.valueNoContrib ?? 0
            return (
              <View key={yr} style={{ width: colW, paddingHorizontal: 5, paddingVertical: 5 }}>
                <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.navy, textAlign: 'right' }}>
                  {fmtEur(val)}
                </Text>
              </View>
            )
          })}
        </View>
      ))}
    </View>
  )
}

// ─── Header / Footer (fixed across pages) ─────────────────────────────────────

function PdfHeader({ date }: { date: string }) {
  return (
    <View style={S.header} fixed>
      <View style={S.headerBrand}>
        <View style={S.headerLogoBox}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.navy }}>C</Text>
        </View>
        <Text style={S.headerLogoText}>
          Che<Text style={S.headerLogoAccent}>ETF</Text>
        </Text>
      </View>
      <Text style={S.headerDate}>{date}</Text>
    </View>
  )
}

function PdfFooter() {
  return (
    <View style={S.footer} fixed>
      <Text style={S.footerText}>CheETF – Confronto Investimenti</Text>
      <Text
        style={S.footerText}
        render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} / ${totalPages}`}
      />
    </View>
  )
}

// ─── Full document ────────────────────────────────────────────────────────────

function PdfDocument({ results, withContrib, clientName, date }: {
  results: SimResult[]
  withContrib: boolean
  clientName: string
  date: string
}) {
  const sorted    = [...results].sort((a, b) => b.finalValueNoContrib - a.finalValueNoContrib)
  const best      = sorted[0]
  const worst     = sorted[sorted.length - 1]
  const oppCost   = results.length > 1 ? best.finalValueNoContrib - worst.finalValueNoContrib : 0
  const costBD    = buildCostBreakdown(results)
  const allocData = buildAggregatedAllocation(results)
  const highCost  = [...results].sort((a, b) => b.totalCostDragWithContrib - a.totalCostDragWithContrib)[0]

  return (
    <Document
      title={`Analisi CheETF${clientName ? ` – ${clientName}` : ''}`}
      author="CheETF"
      creator="CheETF"
    >
      {/* COPERTINA */}
      <Page size="A4" style={S.page}>
        <View style={S.cover}>
          <View style={S.coverLogoBox}>
            <Text style={{ fontSize: 26, fontFamily: 'Helvetica-Bold', color: C.navy }}>C</Text>
          </View>
          <Text style={S.coverTag}>ANALISI COMPARATIVA PERSONALIZZATA</Text>
          <Text style={S.coverH1}>Confronto Reale{'\n'}Fondi vs ETF</Text>
          <Text style={S.coverSub}>Impatto economico dei costi sul tuo patrimonio</Text>
          <View style={S.coverDivider} />
          <View style={S.coverMetaRow}>
            {clientName ? (
              <View style={S.coverMetaItem}>
                <Text style={S.coverMetaLabel}>CLIENTE</Text>
                <Text style={S.coverMetaValue}>{clientName}</Text>
              </View>
            ) : null}
            <View style={S.coverMetaItem}>
              <Text style={S.coverMetaLabel}>DATA</Text>
              <Text style={S.coverMetaValue}>{date}</Text>
            </View>
            <View style={S.coverMetaItem}>
              <Text style={S.coverMetaLabel}>STRUMENTI</Text>
              <Text style={S.coverMetaValue}>{results.length}</Text>
            </View>
          </View>
          <View style={{ marginTop: 34, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 12, width: '100%' }}>
            <Text style={{ fontSize: 7, color: C.gray4, textAlign: 'center', lineHeight: 1.6 }}>
              Solo a fini informativi · Non costituisce consulenza finanziaria
            </Text>
          </View>
        </View>
      </Page>

      {/* EXECUTIVE SUMMARY */}
      <Page size="A4" style={S.page}>
        <PdfHeader date={date} />
        <View style={S.body}>
          <Text style={S.sectionTitle}>Riepilogo Esecutivo</Text>

          {[
            {
              n: '1', color: C.accent,
              title: 'Capitale iniziale — scenario senza contributi',
              text: `${best.instrument.name || 'Strumento'} raggiunge ${fmtEur(best.finalValueNoContrib)} netti in ${best.instrument.horizon} anni.`
                + (results.length > 1 ? ` Lo strumento meno efficiente si ferma a ${fmtEur(worst.finalValueNoContrib)}.` : ''),
            },
            {
              n: '2', color: C.green,
              title: 'Con versamenti periodici',
              text: `${best.instrument.name || 'Strumento'} arriva a ${fmtEur(best.finalValueWithContrib)} aggiungendo i contributi. `
                + 'La composizione amplifica nel tempo il vantaggio degli strumenti a costi contenuti.',
            },
            {
              n: '3', color: C.red,
              title: `Quanto si perde rispetto all'alternativa più efficiente`,
              text: results.length > 1
                ? `La differenza tra miglior e peggior strumento è ${fmtEur(oppCost)} di patrimonio finale. `
                  + `${highCost.instrument.name || 'Strumento'} erode ${fmtEur(highCost.totalCostDragWithContrib)} in costi totali.`
                : `I costi erodono ${fmtEur(results[0].totalCostDragWithContrib)} dal patrimonio lordo.`,
            },
          ].map(pt => (
            <View key={pt.n} style={{
              flexDirection: 'row', marginBottom: 10, gap: 10,
              backgroundColor: C.gray7, borderRadius: 7, padding: 11,
              borderLeftWidth: 3, borderLeftColor: pt.color,
            }}>
              <View style={{
                width: 22, height: 22, borderRadius: 5,
                backgroundColor: pt.color, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.white }}>{pt.n}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.navy, marginBottom: 3 }}>
                  {pt.title}
                </Text>
                <Text style={S.p}>{pt.text}</Text>
              </View>
            </View>
          ))}

          <View style={S.kpiRow}>
            <View style={[S.kpiCard, { borderLeftColor: C.green }]}>
              <Text style={S.kpiLabel}>MIGLIOR RISULTATO NETTO</Text>
              <Text style={[S.kpiValue, { color: C.green }]}>{fmtEur(best.finalValueNoContrib)}</Text>
              <Text style={S.kpiSub}>{(best.instrument.name || 'Strumento').slice(0, 24)}</Text>
            </View>
            {results.length > 1 && (
              <View style={[S.kpiCard, { borderLeftColor: C.red }]}>
                <Text style={S.kpiLabel}>PEGGIOR RISULTATO NETTO</Text>
                <Text style={[S.kpiValue, { color: C.red }]}>{fmtEur(worst.finalValueNoContrib)}</Text>
                <Text style={S.kpiSub}>{(worst.instrument.name || 'Strumento').slice(0, 24)}</Text>
              </View>
            )}
            <View style={[S.kpiCard, { borderLeftColor: C.red }]}>
              <Text style={S.kpiLabel}>COSTI EROSI (MASSIMO)</Text>
              <Text style={[S.kpiValue, { color: C.red }]}>{fmtEur(highCost.totalCostDragWithContrib)}</Text>
              <Text style={S.kpiSub}>{(highCost.instrument.name || 'Strumento').slice(0, 24)}</Text>
            </View>
          </View>
        </View>
        <PdfFooter />
      </Page>

      {/* DATI E RISULTATI */}
      <Page size="A4" style={S.page}>
        <PdfHeader date={date} />
        <View style={S.body}>
          <Text style={S.sectionTitle}>Dati Inseriti</Text>
          <View>
            <View style={{ flexDirection: 'row', backgroundColor: C.navy, borderRadius: 4, marginBottom: 1 }}>
              <TH w={CI.name}>Strumento</TH>
              <TH w={CI.type}>Tipo</TH>
              <TH w={CI.cap}  align="right">Capitale</TH>
              <TH w={CI.hor}  align="right">Anni</TH>
              <TH w={CI.ret}  align="right">Lordo att.</TH>
              <TH w={CI.ter}  align="right">TER annuo</TH>
            </View>
            {results.map((r, i) => (
              <View key={r.instrument.id} style={{
                flexDirection: 'row',
                backgroundColor: i % 2 === 0 ? C.white : C.gray7,
                borderBottomWidth: 1, borderBottomColor: C.gray6,
              }}>
                <View style={{ width: CI.name, paddingHorizontal: 5, paddingVertical: 5 }}>
                  <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.navy }}>
                    {(r.instrument.name || `Str. ${i + 1}`).slice(0, 20)}
                  </Text>
                  {r.instrument.isin
                    ? <Text style={{ fontSize: 6, color: C.gray4, marginTop: 1 }}>{r.instrument.isin}</Text>
                    : null}
                </View>
                <TD w={CI.type}>{INSTRUMENT_LABELS[r.instrument.type].slice(0, 18)}</TD>
                <TD w={CI.cap}  align="right" bold>{fmtEur(r.instrument.initialCapital)}</TD>
                <TD w={CI.hor}  align="right">{String(r.instrument.horizon)}</TD>
                <TD w={CI.ret}  align="right">{fmtPct(r.instrument.expectedReturn)}</TD>
                <TD w={CI.ter}  align="right" color={C.red}>
                  {fmtPct(r.instrument.costs.ter + r.instrument.costs.other)}
                </TD>
              </View>
            ))}
          </View>

          <Text style={S.sectionTitle}>Tabella Comparativa Risultati</Text>
          <View>
            <View style={{ flexDirection: 'row', backgroundColor: C.navy, borderRadius: 4, marginBottom: 1 }}>
              <TH w={CR.name}>Strumento</TH>
              <TH w={CR.nc}   align="right">Valore netto (cap.)</TH>
              <TH w={CR.wc}   align="right">Valore (+vers.)</TH>
              <TH w={CR.cost} align="right">Costi erosi</TH>
              <TH w={CR.cagr} align="right">CAGR netto</TH>
            </View>
            {results.map((r, i) => {
              const isBest  = r === best
              const isWorst = results.length > 1 && r === worst
              const ncColor = isBest ? C.green : isWorst ? C.red : C.navy
              return (
                <View key={r.instrument.id} style={{
                  flexDirection: 'row',
                  backgroundColor: i % 2 === 0 ? C.white : C.gray7,
                  borderBottomWidth: 1, borderBottomColor: C.gray6,
                }}>
                  <View style={{ width: CR.name, paddingHorizontal: 5, paddingVertical: 5 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <View style={{ width: 7, height: 7, backgroundColor: r.instrument.color, borderRadius: 2 }} />
                      <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: ncColor }}>
                        {(r.instrument.name || `Str. ${i + 1}`).slice(0, 18)}
                      </Text>
                    </View>
                    {isBest  && <Text style={{ fontSize: 6, color: C.green, marginTop: 1 }}>★ BEST</Text>}
                    {isWorst && <Text style={{ fontSize: 6, color: C.red,   marginTop: 1 }}>▼ WORST</Text>}
                  </View>
                  <TD w={CR.nc}   align="right" bold color={ncColor}>{fmtEur(r.finalValueNoContrib)}</TD>
                  <TD w={CR.wc}   align="right">{fmtEur(r.finalValueWithContrib)}</TD>
                  <TD w={CR.cost} align="right" color={C.red}>{fmtEur(r.totalCostDragWithContrib)}</TD>
                  <TD w={CR.cagr} align="right" bold color={r.cagrNet >= 0 ? C.green : C.red}>
                    {fmtPct(r.cagrNet * 100)}
                  </TD>
                </View>
              )
            })}
          </View>

          <Text style={S.sectionTitle}>Evoluzione Patrimonio — Checkpoint</Text>
          <GrowthTable results={results} />
        </View>
        <PdfFooter />
      </Page>

      {/* COSTI E ANALISI */}
      <Page size="A4" style={S.page}>
        <PdfHeader date={date} />
        <View style={S.body}>
          <Text style={S.sectionTitle}>Breakdown Costi Totali</Text>
          <HBarChart items={costBD.map(c => ({ label: c.name, value: c.grandTotal, color: c.color }))} />

          <View style={{ marginTop: 10 }}>
            <View style={{ flexDirection: 'row', backgroundColor: C.navy, borderRadius: 4, marginBottom: 1 }}>
              <TH w={CC.name}>Strumento</TH>
              <TH w={CC.entry}  align="right">Ingresso</TH>
              <TH w={CC.annual} align="right">Gestione tot.</TH>
              <TH w={CC.perf}   align="right">Perf. fee</TH>
              <TH w={CC.exit}   align="right">Uscita</TH>
              <TH w={CC.tot}    align="right">TOTALE</TH>
            </View>
            {costBD.map((c, i) => (
              <View key={c.id} style={{
                flexDirection: 'row',
                backgroundColor: i % 2 === 0 ? C.white : C.gray7,
                borderBottomWidth: 1, borderBottomColor: C.gray6,
              }}>
                <View style={{ width: CC.name, paddingHorizontal: 5, paddingVertical: 5 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 7, height: 7, backgroundColor: c.color, borderRadius: 2 }} />
                    <Text style={{ fontSize: 7.5, color: C.gray2 }}>{c.name.slice(0, 16)}</Text>
                  </View>
                </View>
                <TD w={CC.entry}  align="right">{fmtEur(c.entryTotal)}</TD>
                <TD w={CC.annual} align="right">{fmtEur(c.annualTotal)}</TD>
                <TD w={CC.perf}   align="right">{fmtEur(c.perfFeeTotal)}</TD>
                <TD w={CC.exit}   align="right">{fmtEur(c.exitTotal)}</TD>
                <TD w={CC.tot}    align="right" bold color={C.red}>{fmtEur(c.grandTotal)}</TD>
              </View>
            ))}
          </View>

          {allocData.length > 0 && (
            <>
              <Text style={S.sectionTitle}>Asset Allocation Aggregata</Text>
              <AllocPills items={allocData} />
            </>
          )}

          {results.length > 1 && oppCost > 500 && (
            <>
              <Text style={[S.sectionTitle, { color: C.red, borderBottomColor: C.red }]}>
                Quanto Stai Perdendo?
              </Text>
              <View style={S.alertBox}>
                <Text style={S.alertTitle}>
                  {'⚠  '}
                  {(worst.instrument.name || 'Strumento più costoso').slice(0, 32)}
                  {' — analisi impatto costi'}
                </Text>
                <Text style={S.alertText}>
                  {'In '}
                  <Text style={S.bold}>{worst.instrument.horizon} anni</Text>
                  {', i costi erodono '}
                  <Text style={[S.bold, { color: C.red }]}>{fmtEur(worst.totalCostDragWithContrib)}</Text>
                  {' dal patrimonio lordo.  Rispetto a '}
                  <Text style={S.bold}>{(best.instrument.name || 'alternativa migliore').slice(0, 28)}</Text>
                  {', stai rinunciando a '}
                  <Text style={[S.bold, { color: C.red }]}>{fmtEur(oppCost)}</Text>
                  {' di patrimonio finale — '}
                  <Text style={[S.bold, { color: C.red }]}>{fmtEur(oppCost / worst.instrument.horizon)}</Text>
                  {' in meno ogni anno.  Differenza CAGR: '}
                  <Text style={S.bold}>{fmtPct((best.cagrNet - worst.cagrNet) * 100)}/anno</Text>
                  {'.'}
                </Text>
              </View>
            </>
          )}

          <Text style={S.sectionTitle}>Riepilogo per Strumento</Text>
          {results.map((r, i) => (
            <View key={r.instrument.id} style={[S.instCard, { borderLeftColor: r.instrument.color }]}>
              <View style={S.instCol}>
                <Text style={S.instLabel}>STRUMENTO</Text>
                <Text style={S.instValue}>{(r.instrument.name || `Strumento ${i + 1}`).slice(0, 20)}</Text>
                <Text style={{ fontSize: 6, color: C.gray4, marginTop: 1 }}>
                  {r.instrument.isin || INSTRUMENT_LABELS[r.instrument.type]}
                </Text>
              </View>
              <View style={S.instCol}>
                <Text style={S.instLabel}>VALORE NETTO</Text>
                <Text style={[S.instValue, { color: r === best ? C.green : r === worst ? C.red : C.navy }]}>
                  {fmtEur(r.finalValueNoContrib)}
                </Text>
              </View>
              <View style={S.instCol}>
                <Text style={S.instLabel}>COSTI EROSI</Text>
                <Text style={[S.instValue, { color: C.red }]}>{fmtEur(r.totalCostDragWithContrib)}</Text>
              </View>
              <View style={S.instCol}>
                <Text style={S.instLabel}>CAGR NETTO</Text>
                <Text style={[S.instValue, { color: r.cagrNet >= 0 ? C.green : C.red }]}>
                  {fmtPct(r.cagrNet * 100)}
                </Text>
              </View>
            </View>
          ))}
        </View>
        <PdfFooter />
      </Page>

      {/* CHIUSURA */}
      <Page size="A4" style={S.page}>
        <PdfHeader date={date} />
        <View style={[S.body, { flex: 1, alignItems: 'center', paddingTop: 80 }]}>
          <View style={{ alignItems: 'center' }}>
            <View style={{
              width: 48, height: 48, borderRadius: 11, backgroundColor: C.accent,
              alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            }}>
              <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', color: C.navy }}>C</Text>
            </View>
            <Text style={{ fontSize: 17, fontFamily: 'Helvetica-Bold', color: C.navy, marginBottom: 5 }}>
              Che<Text style={{ color: C.accent }}>ETF</Text>
            </Text>
            <Text style={{ fontSize: 8.5, color: C.gray3, marginBottom: 26 }}>Confronto Investimenti</Text>
            <Text style={{ fontSize: 9.5, color: C.gray2, textAlign: 'center', maxWidth: 300, lineHeight: 1.7, marginBottom: 20 }}>
              Questo report è stato generato gratuitamente su CheETF.{'\n'}
              Confronta, analizza e fai backtest dei migliori ETF europei.
            </Text>
            <View style={{ backgroundColor: C.gray7, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 9 }}>
              <Text style={{ fontSize: 9, color: C.accent, fontFamily: 'Helvetica-Bold' }}>cheEtf.it</Text>
            </View>
          </View>

          <View style={[S.disclaimer, { marginTop: 48, width: '100%' }]}>
            <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.gray3, marginBottom: 4 }}>
              DISCLAIMER NORMATIVO
            </Text>
            <Text style={S.small}>
              Questo documento ha finalità puramente informativa e didattica. I calcoli si basano su rendimenti
              attesi ipotetici e costi dichiarati dall'utente e non costituiscono previsioni certe di rendimenti futuri.
              I rendimenti passati non sono garanzia di risultati futuri. Questo documento non costituisce consulenza
              finanziaria, fiscale o legale ai sensi del D.Lgs. 58/1998 (TUF) e della Direttiva MiFID II.
              Prima di prendere qualsiasi decisione di investimento, rivolgiti sempre a un consulente finanziario
              indipendente e regolarmente autorizzato. CheETF non è responsabile per eventuali perdite o danni
              derivanti dall'utilizzo delle informazioni contenute in questo documento.
              {'\n'}© {new Date().getFullYear()} CheETF – Documento generato il {date}
            </Text>
          </View>
        </View>
        <PdfFooter />
      </Page>
    </Document>
  )
}

// ─── Download button (exported) ───────────────────────────────────────────────

export default function PdfDownloadButton({ results, withContrib, clientName }: {
  results: SimResult[]
  withContrib: boolean
  clientName: string
}) {
  const date     = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
  const surname  = clientName.trim().split(' ').pop() ?? 'Analisi'
  const dateStr  = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const filename = `Analisi_CheEtf_${surname}_${dateStr}.pdf`

  const doc = useMemo(() => (
    <PdfDocument
      results={results} withContrib={withContrib} clientName={clientName} date={date}
    />
  ), [results, withContrib, clientName, date])

  return (
    <PDFDownloadLink document={doc} fileName={filename}>
      {({ loading }) => (
        <button className="btn btn-primary" style={{ gap: 6 }} disabled={loading}>
          <Download size={14} />
          {loading ? 'Generazione PDF…' : 'Scarica Report PDF'}
        </button>
      )}
    </PDFDownloadLink>
  )
}
