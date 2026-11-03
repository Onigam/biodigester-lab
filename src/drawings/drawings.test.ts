import { beforeAll, describe, expect, it } from 'vitest';
import { configureDrawings } from '@onigam/lab-kit/drawings';
import { setLang } from '@onigam/lab-kit/i18n';
import { ASSEMBLY } from '../data/assembly';
import { GENEVA_TABLE } from '../data/figures';
import { PARTS } from '../data/parts';
import { nEn, nFr } from '../data/units';
import { PLANT_1000, PLANT_1500 } from '../sim/machine';
import { BELL, FEED, TANK } from '../three/dims';
import { SHEET_GROUPS, SHEETS } from './index';
import { surfaces } from './machine-view';
import { pressureCurve } from './pl03-bell';
import { stepOf } from './pl02-section';
import { phWindow } from './pl06-chain';
import { FakeElement, installFakeDom, textBoxes, textExtent } from './test-dom';

// The ten A3 sheets of the "Plans" mode: the contract, a render in French and in English with no NaN and no text on text or off the sheet, the cartouche, the dimensions read from dims.ts, and the model's figures.

const LANGS = ['fr', 'en'] as const;
type Lang = (typeof LANGS)[number];
const rendered = new Map<string, FakeElement>();
const root = (d: { svg: SVGSVGElement }): FakeElement => d.svg as unknown as FakeElement;
const key = (id: string, lang: Lang): string => `${id}/${lang}`;
const textsOf = (id: string, lang: Lang): string[] => textBoxes(rendered.get(key(id, lang))!).map((t) => t.content);
const n = (v: number, lang: Lang, d = 0): string => (lang === 'fr' ? nFr(v, d) : nEn(v, d));

beforeAll(() => {
  installFakeDom();
  configureDrawings({ date: '2026-11-03' });
  for (const lang of LANGS) {
    setLang(lang);
    for (const s of SHEETS) rendered.set(key(s.id, lang), root(s.render()));
  }
  setLang('fr');
});

describe('the contract', () => {
  it('has ten sheets, numbered in order, each with a group, a world and existing parts of that world', () => {
    expect(SHEETS.length).toBe(10);
    expect(SHEETS.map((s) => s.number)).toEqual(
      Array.from({ length: 10 }, (_, i) => `PL-B${String(i + 1).padStart(2, '0')}`),
    );
    expect(new Set(SHEETS.map((s) => s.id)).size).toBe(10);
    for (const s of SHEETS) {
      expect(SHEET_GROUPS.map((g) => g.id) as string[], s.id).toContain(s.group);
      expect(s.parts?.length, s.id).toBeGreaterThan(0);
      for (const id of s.parts ?? []) expect(PARTS.find((p) => p.id === id)?.scene, `${s.id}: ${id}`).toBe(s.scene);
    }
  });
  it('lists the sheets in the order of their numbers: the kit shows them group by group, in the order the lab gives the groups', () => {
    const listed = SHEET_GROUPS.flatMap((g) => SHEETS.filter((s) => s.group === g.id).map((s) => s.number));
    expect(listed).toEqual([...SHEETS.map((s) => s.number)].sort());
    expect(listed).toHaveLength(10);
  });
  it('follows the list of the research', () => {
    expect(SHEETS.map((s) => s.id)).toEqual([
      'general-arrangement',
      'digester-section',
      'bell-and-rim',
      'feed-and-overflow',
      'gas-line-schematic',
      'food-chain',
      'mass-balance',
      'warmth-and-time',
      'hazards',
      'size-comparison',
    ]);
  });
  it('describes each sheet in both languages, with what it shows and how to read it', () => {
    for (const s of SHEETS) {
      for (const lang of LANGS) {
        expect(s.title[lang].length, s.id).toBeGreaterThan(5);
        expect(s.description[lang].split(/(?<=[.!?])\s+/).length, s.id).toBeGreaterThanOrEqual(2);
      }
      expect(s.title.fr).not.toBe(s.title.en);
      const ratio = s.description.fr.length / s.description.en.length;
      expect(ratio, s.id).toBeGreaterThan(0.8);
      expect(ratio, s.id).toBeLessThan(1.3);
    }
  });
  it('names ARTI on no sheet', () => {
    for (const s of SHEETS)
      for (const lang of LANGS) {
        expect(/\bARTI\b|Karve/.test(s.description[lang]), s.id).toBe(false);
        for (const t of textsOf(s.id, lang)) expect(/\bARTI\b|Karve/.test(t), `${s.id}: ${t}`).toBe(false);
      }
  });
});

describe('the render', () => {
  it('prints no bad number, no placeholder, no research code', () => {
    for (const s of SHEETS)
      for (const lang of LANGS)
        for (const t of textsOf(s.id, lang)) {
          expect(t, s.id).not.toMatch(/NaN|undefined|Infinity|\{\w+\}|\[object/);
          expect(t, s.id).not.toMatch(/\b[KS]\d{1,2}\b/);
        }
  });
  it('says in every cartouche that a sheet is for understanding, in both languages, with its number', () => {
    for (const s of SHEETS) {
      expect(textsOf(s.id, 'fr').join(' '), s.id).toContain('Pour comprendre');
      expect(textsOf(s.id, 'en').join(' '), s.id).toContain('For understanding');
      expect(textsOf(s.id, 'en').join(' '), s.id).toContain(s.number);
    }
  });
  it('has its own French and English, not one language in both', () => {
    for (const s of SHEETS) expect(textsOf(s.id, 'fr').join(' ')).not.toBe(textsOf(s.id, 'en').join(' '));
  });
  it('keeps every text on the sheet', () => {
    const off: string[] = [];
    for (const s of SHEETS)
      for (const lang of LANGS)
        for (const t of textBoxes(rendered.get(key(s.id, lang))!)) {
          if (t.rotated) continue;
          const e = textExtent(t);
          if (e.x0 < 7 || e.x1 > 413 || e.y0 < 7 || e.y1 > 290)
            off.push(
              `${s.number} ${lang}: ${t.content} (${e.x0.toFixed(0)}, ${e.x1.toFixed(0)}, ${e.y0.toFixed(0)}, ${e.y1.toFixed(0)})`,
            );
        }
    expect(off.join('\n')).toBe('');
  });
  it('writes no text on another text', () => {
    const clashes: string[] = [];
    for (const s of SHEETS)
      for (const lang of LANGS) {
        const boxes = textBoxes(rendered.get(key(s.id, lang))!).filter((t) => !t.rotated && t.content.trim());
        for (let i = 0; i < boxes.length; i++)
          for (let j = i + 1; j < boxes.length; j++) {
            const a = textExtent(boxes[i]!);
            const b = textExtent(boxes[j]!);
            const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
            const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
            if (w > 1 && h > 0.6) clashes.push(`${s.number} ${lang}: “${boxes[i]!.content}” / “${boxes[j]!.content}”`);
          }
      }
    expect(clashes.join('\n')).toBe('');
  });
  it('keeps out of the title block', () => {
    const X0 = 232;
    const Y0 = 249;
    const inside: string[] = [];
    for (const s of SHEETS) {
      const fr = textBoxes(rendered.get(key(s.id, 'fr'))!);
      const outside = fr.filter((t) => {
        const e = textExtent(t);
        return e.x1 > X0 + 1 && e.y1 > Y0 + 1;
      });
      if (outside.length > 13) inside.push(`${s.number}: ${outside.map((t) => t.content).join(' | ')}`);
    }
    expect(inside.join('\n')).toBe('');
  });
  it('promises no safety, and says what we found rather than what nobody did', () => {
    const promise =
      /\b(safe|safely|harmless|risk-free|no risk|no danger|non-toxic|clean water|guarantee)\b|sans (danger|risque)|\bsûr\b|\bsûre\b|inoffensi|garanti/i;
    const claim = /personne n’a (rien )?mesuré|nobody has measured|never measured/i;
    for (const s of SHEETS)
      for (const lang of LANGS) {
        const t = `${textsOf(s.id, lang).join(' ')} ${s.description[lang]}`;
        expect(t, s.id).not.toMatch(promise);
        expect(t, s.id).not.toMatch(claim);
      }
  });
});

describe('the numbers are read, not typed', () => {
  it('PL-B01 prints the thesis’s heights with no mark, and the yard’s with its star', () => {
    for (const lang of LANGS) {
      const t = textsOf('general-arrangement', lang);
      expect(t).toContain(`${n(TANK.height, lang, 2)} m`);
      expect(t).toContain(`${n(PLANT_1000.overflowLevel, lang, 2)} m`);
      expect(t.join(' ')).toMatch(/2[,.]13 m\*/);
    }
  });
  it('PL-B02 tells the thesis’s figures from our estimates, and numbers its balloons by the guide', () => {
    for (const lang of LANGS) {
      const t = textsOf('digester-section', lang).join(' ');
      expect(t).toContain(`${n(BELL.height, lang, 2)} m`);
      expect(t).toContain(`${n(FEED.reach, lang, 2)} m`);
      expect(t).toContain('5 mm†');
      expect(t).toMatch(/0[,.]14 m\*/);
    }
    expect(stepOf('pallet')).toBe(1);
    expect(stepOf('gas-bell')).toBeGreaterThan(stepOf('inner-feed-pipe'));
    expect(ASSEMBLY.findIndex((s) => s.id === 'limiter')).toBe(13);
  });
  it('PL-B03 draws the pressure from the simulation: 1.3 at rest, 3.0 full, and the brick’s 2.03 on top', () => {
    const plain = pressureCurve(0);
    const brick = pressureCurve(12);
    expect(plain[0]!.mbar).toBeCloseTo(1.32, 1);
    expect(plain[plain.length - 1]!.mbar).toBeCloseTo(2.96, 1);
    expect(brick[0]!.mbar - plain[0]!.mbar).toBeCloseTo(2.03, 2);
    for (const lang of LANGS) expect(textsOf('bell-and-rim', lang).join(' ')).toMatch(/17[,.]2 cm†/);
  });
  it('PL-B04 stands the ring and the riser level, and the surface under the bell lower by the pressure', () => {
    const atRest = surfaces(0);
    const full = surfaces(BELL.travel);
    expect(atRest.ring).toBe(1.04);
    expect(atRest.inner).toBeCloseTo(1.04 - 0.0135, 3);
    expect(full.inner).toBeCloseTo(1.04 - 0.0302, 3);
    expect(SHEETS.find((s) => s.id === 'feed-and-overflow')!.description.en).toMatch(
      /one level, dimensioned from two bases/,
    );
    expect(textsOf('feed-and-overflow', 'en').join(' ')).toContain('1.06 m');
  });
  it('PL-B05 keeps the gas’s order, and tells what was on the measured plant', () => {
    const t = textsOf('gas-line-schematic', 'en').join(' ');
    const order = [
      'Bell',
      'Tap',
      'Hose',
      'Trap',
      'Relief',
      'Filter',
      'Arrester',
      'Gauge',
      'Wall',
      'Valve',
      'Burner',
      'Flame',
      'Pot',
    ];
    let at = -1;
    for (const w of order) {
      const i = t.indexOf(w, at + 1);
      expect(i, w).toBeGreaterThan(at);
      at = i;
    }
    expect(t).toContain('research only');
  });
  it('PL-B06 draws the windows from the simulation’s form', () => {
    expect(phWindow(7, 6, 7)).toBe(1);
    expect(phWindow(6, 6, 7)).toBeCloseTo(Math.exp(-3), 5);
    expect(phWindow(5.5, 4, 5.5)).toBe(1);
  });
  it('PL-B07 sets the thesis beside the model, and says it does not retrieve the market waste', () => {
    for (const lang of LANGS) {
      const t = textsOf('mass-balance', lang).join(' ');
      expect(t).toContain('289 L');
      expect(t).toContain('126 L');
      expect(t).toContain('64 L†');
      expect(t).toContain('76 L†');
    }
    expect(SHEETS.find((s) => s.id === 'mass-balance')!.description.en).toMatch(/does not retrieve the gas/);
  });
  it('PL-B08 prints the year at Geneva row by row, from a table the runs hold', () => {
    const t = textsOf('warmth-and-time', 'en');
    for (const r of GENEVA_TABLE) expect(t, r.key).toContain(n(r.rows[0]!, 'en'));
    expect(SHEETS.find((s) => s.id === 'warmth-and-time')!.description.en).toMatch(
      /A question the model does not decide/,
    );
    expect(t.join(' ')).toMatch(/no measurement found/);
  });
  it('PL-B09 says the true level of H₂S is unknown, and makes no promise', () => {
    expect(SHEETS.find((s) => s.id === 'hazards')!.description.en).toMatch(/true level stays unknown/);
    expect(textsOf('hazards', 'en').join(' ')).toMatch(/we do not repeat that as an assurance/);
  });
  it('PL-B10 draws the sizes from the simulation’s own specs, and says they have no 3D', () => {
    expect(PLANT_1500.tankOuterDiameter).toBe(1.15);
    expect(textsOf('size-comparison', 'en').join(' ')).toContain('756 L');
    expect(SHEETS.find((s) => s.id === 'size-comparison')!.description.en).toMatch(
      /change the figures without changing the drawing/,
    );
  });
});
