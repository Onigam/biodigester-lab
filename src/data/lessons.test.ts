import { describe, expect, it } from 'vitest';
import type { L } from '@onigam/lab-kit/i18n';
import { SCENARIO_IDS } from '../sim/presets';
import { ALARM_TEXTS, SCENARIO_TEXTS } from '../sim/texts';
import { LAB_STRINGS } from '../i18n/ui';
import { ASSEMBLY } from './assembly';
import { FIG, type Fig } from './figures';
import { INSTALL } from './install';
import { LESSONS } from './lessons';
import { OVERVIEWS } from './overviews';
import { figText } from './part-helpers';
import { PARTS } from './parts';
import { nEn, nFr } from './units';

// The seven lessons: the contract (ids, worlds, parts, scenarios), the shape, the honest points, and the names of the scenarios, which the visitor must find in the panel word for word.

const words = (t: string): number => t.trim().split(/\s+/).length;
const labels = (id: string): { fr: string; en: string } => {
  const [fr, en] = SCENARIO_TEXTS[id as keyof typeof SCENARIO_TEXTS].name;
  return { fr, en };
};
const bodyOf = (lesson: (typeof LESSONS)[number], lang: 'fr' | 'en'): string =>
  lesson.body.map((b) => b[lang]).join(' ');

function texts(): [string, L][] {
  const out: [string, L][] = [];
  for (const les of LESSONS) {
    out.push([`${les.id}.title`, les.title], [`${les.id}.summary`, les.summary]);
    les.body.forEach((b, i) => out.push([`${les.id}.body[${i}]`, b]));
    les.figures?.forEach((f, i) => {
      out.push([`${les.id}.figures[${i}].label`, f.label]);
      if (typeof f.value !== 'string') out.push([`${les.id}.figures[${i}].value`, f.value]);
    });
    les.quiz?.forEach((qu, i) => {
      out.push([`${les.id}.quiz[${i}].q`, qu.q], [`${les.id}.quiz[${i}].explain`, qu.explain]);
      qu.choices.forEach((c, j) => out.push([`${les.id}.quiz[${i}].choices[${j}]`, c]));
    });
  }
  return out;
}

function numbers(text: string, lang: 'fr' | 'en'): string[] {
  let t = text.replace(/[−–]/g, '-');
  if (lang === 'fr') t = t.replace(/(\d) (\d{3})(?!\d)/g, '$1$2').replace(/(\d),(\d)/g, '$1.$2');
  else t = t.replace(/(\d),(\d{3})(?!\d)/g, '$1$2');
  return (t.match(/\d+(?:\.\d+)?/g) ?? []).sort();
}

const TEXT_FIGS = Object.values(FIG as Record<string, Fig>).filter((f) => f.t);

/** The numbers a lesson may quote with no mark, with their source (research numbers). Reported figures only. */
const REPORTED = new Set([
  '1977', // S31
  '42.5',
  '300', // K13, K29
  '289',
  '56.8',
  '66.4',
  '2', // K19, K20, K18
  '70', // K26
  '90', // a share of a meal's gas
  '24',
  '94',
  '10',
  '88',
  '0.451',
  '0.18', // K14
  '0.25',
  '500', // K36
  '126', // K19
  '700', // K21
  '1',
  '0.4', // S3, K42
  '17.25',
  '0.69', // K5
  '12',
  '0.581',
  '4',
  '12.1',
  '22.3',
  '60', // K18, K22, K7
  '1.06',
  '1.04',
  '1.30',
  '4000', // K6, K3, K2, S7
  '25',
  '15',
  '37',
  '30',
  '20', // K44, K38, §2.9, K13
  '38', // S3
  '5',
  '670',
  '150',
  '6.2',
  '6',
  '0.3', // K25, S7's limit
  '4.15', // K31
  '100', // the water of the rescue, K32
  '50', // the same; S15's 50 %
  '4.5',
  '6.8', // physics §6 (Fig. 16)
  '0.008',
  '20000', // S15, K43
  '6',
  '2005',
  '8', // ARIA 31000, 8 November
  '18',
  '19', // 18 and 19 October, K30
  '22',
  '17.5', // K4, K33
  '45',
  '2.5', // K23
  '295.6',
  '550',
  '2008', // K10
  '3',
  '51',
  '15.9',
  '53', // S27, S28
  '98', // K35
  '7', // lesson 7
  '32', // the temperature a model run is held at
  '40', // S27, K36, K44
]);
const figNumbers = new Set(
  Object.values(FIG as Record<string, Fig>).flatMap((f) => [
    numbers(nFr(f.v, f.d), 'fr')[0],
    numbers(nEn(f.v, f.d), 'en')[0],
  ]),
);
const bare = (t: string, lang: 'fr' | 'en'): string => {
  let out = t;
  for (const f of TEXT_FIGS) out = out.split(figText(f, lang)).join('FIGURE');
  return out.replace(/\bm³\/h|\bm²/g, 'unit').replace(/mg\/L/g, 'unit');
};

describe('the lessons', () => {
  it('are seven, with fourteen questions, two each', () => {
    expect(LESSONS.length).toBe(7);
    expect(LESSONS.map((l) => l.quiz?.length)).toEqual([2, 2, 2, 2, 2, 2, 2]);
    expect(LESSONS.map((l) => l.id)).toEqual([
      'what-makes-the-gas',
      'wet-or-dry',
      'the-bell',
      'warmth-and-time',
      'feed-or-sour',
      'what-the-gas-can-do',
      'is-it-worth-it',
    ]);
  });
  it('open each on one world, one existing part of that world, and a scenario of the simulation', () => {
    for (const les of LESSONS) {
      const part = PARTS.find((p) => p.id === les.focus.part);
      expect(part?.scene, les.id).toBe(les.focus.scene);
      expect(SCENARIO_IDS, les.id).toContain(les.focus.scenario);
    }
  });
  it('reach all twelve scenarios: opened by a lesson, or named word for word in its text', () => {
    for (const id of SCENARIO_IDS) {
      const opened = LESSONS.some((l) => l.focus.scenario === id);
      const named =
        LESSONS.some((l) => bodyOf(l, 'fr').includes(`« ${labels(id).fr} »`)) &&
        LESSONS.some((l) => bodyOf(l, 'en').includes(`“${labels(id).en}”`));
      expect(opened || named, id).toBe(true);
    }
  });
  it('name every scenario and alarm the way the panel does, in the sheets, guides and overviews too', () => {
    const known = {
      fr: new Set(SCENARIO_IDS.map((i) => labels(i).fr)),
      en: new Set(SCENARIO_IDS.map((i) => labels(i).en)),
    };
    const words2 = { fr: new Set<string>(), en: new Set<string>() };
    for (const a of Object.values(ALARM_TEXTS)) {
      words2.fr.add(a.text[0]);
      words2.en.add(a.text[1]);
    }
    for (const [k, v] of Object.entries(LAB_STRINGS)) {
      if (k.startsWith('slider')) {
        words2.fr.add(v[0]);
        words2.en.add(v[1]);
      }
    }
    const quotes = /^(bactéries|réagit|ne marche|au-dessus|en un|1 kg|Nourrir|sour|air inflammable)/i;
    const all: L[] = [
      ...PARTS.flatMap((p) => (p.tip ? [p.tip] : [])),
      ...PARTS.map((p) => p.description),
      ...PARTS.flatMap((p) => (p.maintenance ? [p.maintenance] : [])),
      ...[...ASSEMBLY, ...INSTALL].map((s) => s.text),
      ...Object.values(OVERVIEWS).map((o) => o.text),
      ...LESSONS.flatMap((l) => l.body),
    ];
    for (const t of all) {
      for (const m of t.fr.matchAll(/« ([^»]+) »/g)) {
        const q = m[1] ?? '';
        if (/^[A-ZÉ]/.test(q) && !quotes.test(q)) expect(known.fr.has(q) || words2.fr.has(q), q).toBe(true);
      }
      for (const m of t.en.matchAll(/“([^”]+)”/g)) {
        const q = m[1] ?? '';
        if (/^[A-Z]/.test(q) && !/^(1 kg|Feed more|Nourrir)/.test(q))
          expect(known.en.has(q) || words2.en.has(q), q).toBe(true);
      }
    }
  });
  it('have four paragraphs of at most 95 words, a formula and three chips', () => {
    for (const les of LESSONS) {
      expect(les.body.length, les.id).toBe(4);
      expect(les.formula, les.id).toBeTruthy();
      expect(les.figures?.length, les.id).toBe(3);
      for (const b of les.body)
        for (const lang of ['fr', 'en'] as const)
          expect(words(b[lang]), `${les.id} ${lang}: ${words(b[lang])} words`).toBeLessThanOrEqual(95);
    }
  });
  it('ask questions with three choices of about the same length, the right answer not always in one place', () => {
    const answers = new Set<number>();
    for (const les of LESSONS) {
      for (const qu of les.quiz ?? []) {
        expect(qu.choices.length, les.id).toBe(3);
        expect(qu.answer, les.id).toBeLessThan(3);
        answers.add(qu.answer);
        for (const lang of ['fr', 'en'] as const) {
          const lengths = qu.choices.map((c) => c[lang].length);
          expect(Math.max(...lengths) / Math.min(...lengths), `${les.id}: ${qu.q[lang]}`).toBeLessThan(2.1);
        }
      }
    }
    expect(answers).toEqual(new Set([0, 1, 2]));
  });
  it('do not give the answer away by its length: the longest is right about one time in three, in each language', () => {
    const questions = LESSONS.flatMap((les) => les.quiz ?? []);
    for (const lang of ['fr', 'en'] as const) {
      const lengths = questions.map((qu) => ({ of: qu.choices.map((c) => c[lang].length), right: qu.answer }));
      const longest = lengths.filter((q) => q.of[q.right] === Math.max(...q.of)).length;
      const shortest = lengths.filter((q) => q.of[q.right] === Math.min(...q.of)).length;
      // chance is 14/3: neither the longest nor the shortest may become a tell, whichever way
      expect(longest, `${lang}: the longest is right in ${longest} of ${questions.length}`).toBeGreaterThanOrEqual(3);
      expect(longest, `${lang}: the longest is right in ${longest} of ${questions.length}`).toBeLessThanOrEqual(6);
      expect(shortest, `${lang}: the shortest is right in ${shortest} of ${questions.length}`).toBeLessThanOrEqual(6);
    }
  });
  it('write French and English together, with the same numbers', () => {
    for (const [where, t] of texts()) {
      expect(t.fr.trim().length, where).toBeGreaterThan(0);
      expect(t.en.trim().length, where).toBeGreaterThan(0);
      expect(numbers(bare(t.fr, 'fr'), 'fr'), where).toEqual(numbers(bare(t.en, 'en'), 'en'));
      if (t.fr.length > 60 && t.en.length > 60) {
        expect(t.fr.length / t.en.length, `${where}: ${t.fr.length} / ${t.en.length}`).toBeGreaterThan(0.72);
        expect(t.fr.length / t.en.length, `${where}: ${t.fr.length} / ${t.en.length}`).toBeLessThan(1.45);
      }
    }
  });
  it('quote no number but the research’s, and mark every other', () => {
    const problems: string[] = [];
    for (const [where, t] of texts()) {
      for (const lang of ['fr', 'en'] as const) {
        const text = bare(t[lang], lang);
        const re = lang === 'fr' ? /\d+(?: \d{3})*(?:,\d+)?/g : /\d+(?:,\d{3})*(?:\.\d+)?/g;
        for (const m of text.matchAll(re)) {
          const n = numbers(m[0], lang)[0] ?? '';
          const after = text.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 14);
          const marked = /^(?: ?(?:°C|°|[\p{L}/%²³·]+)(?:\/\p{L}+)?\d?)?[†*]/u.test(after);
          if (marked) {
            if (!figNumbers.has(n)) problems.push(`${where} (${lang}): marked, no figure: ${m[0]}${after}`);
          } else if (!REPORTED.has(n)) problems.push(`${where} (${lang}): unmarked ${m[0]}${after}`);
        }
      }
    }
    expect(problems.join('\n')).toBe('');
  });
  it('open lesson 4 on what the model cannot decide, with the slider, and call no cold tank stopped as a fact', () => {
    const four = LESSONS.find((l) => l.id === 'warmth-and-time')!;
    expect(four.body[0]!.en).toMatch(/\*\*The model cannot decide\.\*\*/);
    expect(four.body[0]!.fr).toMatch(/\*\*Le modèle ne peut pas trancher\.\*\*/);
    expect(four.body[0]!.en).toMatch(/\*\*Activation energy\*\* slider/);
    expect(four.body[0]!.fr).toMatch(/\*\*Énergie d’activation\*\*/);
    expect(four.body[0]!.en).toMatch(/43 kJ\/mol\*/);
    expect(four.body[0]!.en).toMatch(/44 kJ\/mol\*/);
    expect(four.body[0]!.en).toMatch(/We found no measurement of a plant of this kind below about 25 °C/);
    expect(four.focus.scenario).toBe('geneva-january');
    expect(four.summary.en).toMatch(/The model cannot decide/);
    for (const [where, t] of texts()) {
      expect(t.en, where).not.toMatch(/a cold tank stops|cold tanks stop/i);
      expect(t.fr, where).not.toMatch(/une cuve froide s’arrête/i);
    }
  });
  it('tell the market waste as not retrieved, and draw no finding per kilo of solids', () => {
    const two = LESSONS.find((l) => l.id === 'wet-or-dry')!;
    expect(bodyOf(two, 'en')).toMatch(/Here the model does not retrieve the thesis/);
    expect(bodyOf(two, 'en')).toMatch(/64 L† to 76 L†/);
    expect(bodyOf(two, 'en')).toMatch(/settle nothing/);
    expect(bodyOf(two, 'en')).not.toMatch(/per kilo of solids/);
  });
  it('say the brick doubles the pressure, never the flame, and that 45 minutes is a sum', () => {
    const three = LESSONS.find((l) => l.id === 'the-bell')!;
    expect(bodyOf(three, 'en')).toMatch(/the pressure doubles/);
    expect(bodyOf(three, 'en')).toMatch(/The flame does not double/);
    expect(bodyOf(three, 'fr')).toMatch(/La flamme, elle, ne double pas/);
    const seven = LESSONS.find((l) => l.id === 'is-it-worth-it')!;
    expect(bodyOf(seven, 'fr')).toMatch(/un calcul de la thèse/);
    expect(bodyOf(seven, 'en')).toMatch(/the thesis worked it out from its two tests/);
  });
  it('say what we found rather than what nobody did, and promise no safety', () => {
    const claim = /personne n’a (rien )?mesuré|nobody has measured|jamais été mesuré|never measured/i;
    const promise =
      /\b(safe|safely|harmless|risk-free|no risk|no danger|non-toxic|clean water|free energy|zero waste|carbon neutral|guarantee)\b|sans (danger|risque)|\bsûr\b|\bsûre\b|inoffensi|eau propre|garanti/i;
    for (const [where, t] of texts()) {
      expect(t.fr + t.en, where).not.toMatch(claim);
      expect(t.fr + t.en, where).not.toMatch(promise);
    }
  });
  it('correct the research on the plant at pH 4.15: the thesis marks it as overfed', () => {
    const five = LESSONS.find((l) => l.id === 'feed-or-sour')!;
    expect(bodyOf(five, 'en')).toMatch(/stopped plant at pH 4\.15, which the thesis marks as overfed/);
  });
  it('do not repeat the reconstruction, and name no maker', () => {
    for (const [where, t] of texts()) {
      expect(/reconstitution|reconstruction/i.test(t.fr + t.en), where).toBe(false);
      expect(/\bARTI\b|Karve/.test(t.fr + t.en), where).toBe(false);
    }
  });
  it('show no research code and no placeholder, in British English', () => {
    const us =
      /\b(color|center|aluminum|gray|fiber|liter|organiz|recogniz|analyz|neighbor|labor|vapor|sulfur|sulfide)\b/i;
    for (const [where, t] of texts()) {
      for (const text of [t.fr, t.en]) {
        expect(text, where).not.toMatch(/\b[KS]\d{1,2}\b/);
        expect(text, where).not.toMatch(/\{\w+\}|undefined|NaN/);
        expect(text, where).not.toMatch(/[A-Za-zÀ-ÿ]'[A-Za-zÀ-ÿ]/);
        expect(text, where).not.toMatch(/ {2,}/);
      }
      expect(us.test(t.en), `${where}: ${t.en.match(us)?.[0]}`).toBe(false);
    }
  });
});
