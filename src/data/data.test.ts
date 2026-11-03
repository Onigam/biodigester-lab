import { describe, expect, it } from 'vitest';
import type { GuideStep, PartInfo } from '@onigam/lab-kit/content';
import { setLang, type L } from '@onigam/lab-kit/i18n';
import type { AppContext } from '@onigam/lab-kit/ui';
import { SHEETS } from '../drawings';
import { installFakeDom } from '../drawings/test-dom';
import { LAB_STRINGS } from '../i18n/ui';
import { checkStandard, STANDARD } from '../standard';
import { WORLD } from '../three/index';
import { PART_NAMES } from '../three/part-ids';
import { ASSEMBLY, ORIGIN } from './assembly';
import { CHAPTERS, VIDEO_ID } from './chapters';
import { FIG, markOf, type Fig } from './figures';
import { INSTALL } from './install';
import { LESSONS } from './lessons';
import { OVERVIEWS, WORLD_IDS } from './overviews';
import { figText } from './part-helpers';
import { PARTS } from './parts';
import { DIM_SPECS } from './parts/dim-specs';
import { MAIN_VIDEO, SOURCE_GROUPS, sourcesPanel } from './sources';
import { nEn, nFr } from './units';
import partsYard from './parts/yard.ts?raw';
import partsDigester from './parts/digester.ts?raw';
import partsSlurry from './parts/slurry.ts?raw';
import partsGasLine from './parts/gasline.ts?raw';
import assemblySource from './assembly.ts?raw';
import installSource from './install.ts?raw';
import overviewsSource from './overviews.ts?raw';
import lessonsSource from './lessons.ts?raw';

// Content checks: the catalogue and the guides against the ids of src/three/part-ids.ts, FR/EN parity, the rules of the visitor's texts (no research code, no internal word, ARTI named in the Sources only, British spelling, no wording that promises safety, no build instruction), the marks on the numbers, and what must be said once.

const SHEET_SOURCES = import.meta.glob('../drawings/pl*.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const isL = (v: unknown): v is L => typeof v === 'object' && v !== null && 'fr' in v && 'en' in v;

function partTexts(p: PartInfo): [string, L][] {
  const out: [string, L][] = [
    ['name', p.name],
    ['short', p.short],
    ['description', p.description],
    ['material', p.material],
  ];
  if (p.maintenance) out.push(['maintenance', p.maintenance]);
  if (p.tip) out.push(['tip', p.tip]);
  if (p.design) out.push(['design', p.design]);
  const generated = DIM_SPECS[p.id]?.length ?? 0;
  p.specs.slice(0, p.specs.length - generated).forEach((s, i) => {
    out.push([`specs[${i}].label`, s.label]);
    if (isL(s.value)) out.push([`specs[${i}].value`, s.value]);
    else out.push([`specs[${i}].value`, { fr: s.value, en: s.value }]);
  });
  return out;
}

function stepTexts(s: GuideStep): [string, L][] {
  const out: [string, L][] = [
    ['title', s.title],
    ['text', s.text],
  ];
  if (s.tip) out.push(['tip', s.tip]);
  if (s.warning) out.push(['warning', s.warning]);
  return out;
}

/** Every bilingual text of the sheets, the guides and the overviews, labelled. The Sources have their own rules. */
function allTexts(): [string, L][] {
  const out: [string, L][] = [];
  for (const p of PARTS) for (const [k, v] of partTexts(p)) out.push([`part ${p.id}.${k}`, v]);
  for (const [guide, steps] of [
    ['assembly', ASSEMBLY],
    ['install', INSTALL],
  ] as const)
    for (const s of steps) for (const [k, v] of stepTexts(s)) out.push([`${guide} ${s.id}.${k}`, v]);
  for (const [world, o] of Object.entries(OVERVIEWS)) {
    out.push([`overview ${world}.title`, o.title]);
    out.push([`overview ${world}.text`, o.text]);
  }
  return out;
}

/** Numbers of a text, normalised so that the French and English spellings compare equal (7,5 / 7.5, 5 700 / 5,700). */
function numbers(text: string, lang: 'fr' | 'en'): string[] {
  let t = text.replace(/[−–]/g, '-');
  if (lang === 'fr') t = t.replace(/(\d) (\d{3})(?!\d)/g, '$1$2').replace(/(\d),(\d)/g, '$1.$2');
  else t = t.replace(/(\d),(\d{3})(?!\d)/g, '$1$2');
  return (t.match(/\d+(?:\.\d+)?/g) ?? []).sort();
}

/** Figures with a text value (a size, a range), as they read: their numbers are checked as one piece. */
const TEXT_FIGS = Object.values(FIG as Record<string, Fig>).filter((f) => f.t);

/** Names and units that hold a digit and are no figures; hours; the figures written as words or sizes. */
const bare = (t: string, lang: 'fr' | 'en'): string => {
  let out = t;
  for (const f of TEXT_FIGS) out = out.split(figText(f, lang)).join('FIGURE');
  return out
    .replace(/CaCO₃/g, 'CaCO')
    .replace(/kg VS\/m³/g, 'unit')
    .replace(/\bm²|\bm³\/h|\bm³/g, 'surface')
    .replace(/L\/h|L\/min|mg\/L|g\/L|meq\/L/g, 'unit')
    .replace(/8 h 30|8:30/g, 'morning')
    .replace(/17 h\b|17:00/g, 'evening')
    .replace(/½|¾/g, 'part');
};

/**
 * The figures REPORTED by a source, written in the text with no mark, each with where it comes from (research numbers). Anything else must carry a mark: `lf` adds it to a placeholder, and the test below catches a number typed by hand.
 */
const REPORTED = new Set(
  [
    '750',
    '1000',
    '850',
    '1.04',
    '1.25',
    '51.5',
    '0.90',
    '1.30', // K1, K2, K3
    '0.83',
    '0.65',
    '22',
    '0.43',
    '0.58',
    '0.581',
    '0.69',
    '400',
    '17.25',
    '20', // K4, K5
    '1.18',
    '1.06',
    '0.51',
    '0.74', // K6
    '3',
    '2',
    '1.80',
    '1.00',
    '5',
    '0.62',
    '60', // K7; 60 mbar, 60 L, 60 kg
    '2.5',
    '7.5',
    '295.6',
    '550',
    '3.5', // K8, K9, K10, K11
    '1500',
    '173',
    '129',
    '756',
    '1.15',
    '1.73',
    '1.10',
    '1.29', // K12
    '18',
    '9',
    '10',
    '42.5',
    '1', // K13; 1 kg twice a day, 1 inch, 1 cm
    '24',
    '94',
    '88',
    '0.451',
    '0.18',
    '0.53', // K14, K15
    '150',
    '300', // K16
    '6.5',
    '30',
    '27.8',
    '30.9',
    '26',
    '28',
    '6.2',
    '4.5',
    '6.8', // K17, K47, physics §6 (Fig. 16)
    '4',
    '12',
    '12.1',
    '22.3',
    '19',
    '27', // K18, K22
    '289',
    '259',
    '126',
    '113',
    '56.8',
    '66.4', // K19, K20
    '144',
    '63',
    '640',
    '700', // K21
    '200',
    '45', // K23; 45 % methane is reported too (S5, S8)
    '670',
    '70', // K25, K26
    '92',
    '83', // K27
    '74.1',
    '248',
    '85.5',
    '225', // K28
    '74',
    '85',
    '600',
    '3.3',
    '3.6',
    '41',
    '10.61',
    '1.47', // K29, Table 17 in physics §1.1
    '2008', // the thesis's year; 18 and 19 October, 30 July, 26 November
    '8',
    '4.15', // K30, K31
    '72',
    '100', // K32
    '17.5',
    '0.25',
    '500', // K33, K36; 2 kg give about 500 g
    '40', // K36 (S11), K44
    '0.4',
    '55', // K42
    '7', // K43, 2 % at 20 °C to 7 % at 40 °C
    '15',
    '37',
    '20000',
    '1130',
    '22.6', // K44, K43, Table 18 in physics §1
    '124',
    '195',
    '0.3', // Table 18 in physics §7, S7's limit
    '1.6',
    '38',
    '4',
    '0.008', // S3, S15
    '2005', // ARIA 31000
    '1977', // S31
    '9.0', // Table 17 in physics §3.2 (K29)
    '53', // S28
    '0',
    '50',
    '6',
    '1.20',
    '1.40',
    '35',
    '0.19',
    '0.65',
    '90',
    '32',
    '107', // the slider's and the gauge's 0 (K7); S15's 50 %; S5's and S8's 6 to 12 %, S5's pH 6, a lesson's number; S9's limiter; S5's test at 35 °C; S35; a share of a meal's gas; the temperature a model run is held at; a day of the thesis's calendar
  ].map(String),
);

const figNumbers = new Set(
  Object.values(FIG as Record<string, Fig>).flatMap((f) => [
    numbers(nFr(f.v, f.d), 'fr')[0],
    numbers(nEn(f.v, f.d), 'en')[0],
  ]),
);

const ALL_IDS = PART_NAMES.map((p) => p.id);

describe('parts catalogue', () => {
  it('has exactly the ids of src/three/part-ids.ts, in that order, 58 in all, and the same names', () => {
    expect(PARTS.map((p) => p.id)).toEqual(ALL_IDS);
    expect(ALL_IDS.length).toBe(58);
    for (const p of PARTS) {
      const named = PART_NAMES.find((n) => n.id === p.id)!;
      expect(p.scene, p.id).toBe(named.world);
      expect(p.name.fr, p.id).toBe(named.fr);
      expect(p.name.en, p.id).toBe(named.en);
    }
  });
  it('gives every part the four tabs: an overview, specs, maintenance and design, with a concrete tip', () => {
    for (const p of PARTS) {
      for (const lang of ['fr', 'en'] as const) {
        expect(p.short[lang].length, `${p.id} short`).toBeGreaterThan(40);
        expect(p.description[lang].length, `${p.id} description`).toBeGreaterThan(280);
        expect(p.maintenance?.[lang].length, `${p.id} maintenance`).toBeGreaterThan(120);
        expect(p.design?.[lang].length, `${p.id} design`).toBeGreaterThan(60);
        expect(p.tip?.[lang].length, `${p.id} tip`).toBeGreaterThan(40);
      }
      expect(p.specs.length, `${p.id} specs`).toBeGreaterThanOrEqual(2);
      expect(['hydraulic', 'mechanical', 'electrical', 'structure', 'site'], p.id).toContain(p.category);
    }
  });
  it('opens the maintenance tab on the failure, the check and the care, in that order, in both languages', () => {
    for (const p of PARTS) {
      expect(p.maintenance?.fr.indexOf('**Panne à prévoir.**'), p.id).toBe(0);
      expect(p.maintenance?.fr, p.id).toContain('**À vérifier.**');
      expect(p.maintenance?.fr, p.id).toContain('**Entretien.**');
      expect(p.maintenance?.en.indexOf('**Typical failure.**'), p.id).toBe(0);
    }
  });
  it('reads the dimension rows from dims.ts only', () => {
    for (const [id, specs] of Object.entries(DIM_SPECS)) {
      expect(ALL_IDS, id).toContain(id);
      expect(specs.length, id).toBeGreaterThan(0);
    }
  });
});

describe('the guides', () => {
  const sceneOf = new Map(PART_NAMES.map((p) => [p.id, p.world]));
  const check = (steps: GuideStep[]): void => {
    expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
    for (const s of steps) {
      expect(s.parts.length, s.id).toBeGreaterThan(0);
      for (const id of s.parts) {
        expect(sceneOf.has(id), `${s.id}: ${id}`).toBe(true);
        expect(sceneOf.get(id), `${s.id}: ${id} is not in ${s.scene}`).toBe(s.scene);
      }
      // what the step installs, it names in bold
      expect(s.text.fr, s.id).toContain('**');
      expect(s.text.en, s.id).toContain('**');
      // no torque, no tool list, no duration as an instruction: nothing here is to follow
      expect(s.torque, s.id).toBeUndefined();
      expect(s.duration, s.id).toBeUndefined();
      expect(s.tools, s.id).toBeUndefined();
    }
  };
  it('run to 20 and 10 steps, each in one world, each with its parts in that world', () => {
    expect(ASSEMBLY.length).toBe(20);
    expect(INSTALL.length).toBe(10);
    check(ASSEMBLY);
    check(INSTALL);
  });
  it('end every step on where it comes from', () => {
    const origins = Object.values(ORIGIN);
    for (const s of [...ASSEMBLY, ...INSTALL]) {
      expect(
        origins.some((o) => s.text.fr.endsWith(o.fr)),
        s.id,
      ).toBe(true);
      expect(
        origins.some((o) => s.text.en.endsWith(o.en)),
        s.id,
      ).toBe(true);
    }
  });
  it('install every part of the three worlds that have guides at least once, nothing twice in the assembly, and only the drop stays out', () => {
    const inAssembly = ASSEMBLY.flatMap((s) => s.parts);
    const inInstall = INSTALL.flatMap((s) => s.parts);
    expect(new Set(inAssembly).size).toBe(inAssembly.length);
    const all = new Set([...inAssembly, ...inInstall]);
    for (const p of PART_NAMES) {
      if (p.world === 'slurry') expect(all.has(p.id), p.id).toBe(false);
      else expect(all.has(p.id), p.id).toBe(true);
    }
  });
  it('leave nothing in the assembly’s two worlds to show before its time: every part but the props of the bench is in a step', () => {
    const inAssembly = new Set(ASSEMBLY.flatMap((s) => s.parts));
    for (const p of PART_NAMES.filter((n) => n.world === 'digester')) expect(inAssembly.has(p.id), p.id).toBe(true);
    const free = PART_NAMES.filter((n) => n.world === 'gas-line' && !inAssembly.has(n.id)).map((n) => n.id);
    expect(free.sort()).toEqual(['dilution-bucket', 'gas-detector', 'mincer', 'vent-opening']);
  });
  it('say it is no plan to follow once, at the top of each guide, as the owner accepted it', () => {
    const count = (steps: GuideStep[]): number => steps.filter((s) => /not a plan to follow/.test(s.text.en)).length;
    expect(count(ASSEMBLY)).toBe(1);
    expect(count(INSTALL)).toBe(1);
    for (const first of [ASSEMBLY[0]!, INSTALL[0]!]) {
      expect(first.text.en).toMatch(/not a plan to follow, and it proves nothing about safety/);
      expect(first.text.fr).toMatch(/pas un plan à suivre, et cela ne prouve rien sur la sécurité/);
    }
    expect(ASSEMBLY[0]!.text.en).toMatch(/No cut line here, no torque/);
    expect(ASSEMBLY[0]!.text.fr).toMatch(/Aucune cote de découpe ici, aucun couple de serrage/);
  });
  it('keep the warnings to the steps where the gesture is risky', () => {
    const warned = [...ASSEMBLY, ...INSTALL].filter((s) => s.warning).map((s) => s.id);
    expect(warned).toEqual(['tee-plug', 'filter-arrester', 'leak-test', 'seed', 'unfed']);
  });
});

describe('the world overviews', () => {
  it('cover the four worlds, named as the 3D names them', () => {
    expect(Object.keys(OVERVIEWS)).toEqual([...WORLD_IDS]);
    expect(Object.keys(WORLD).sort()).toEqual([...WORLD_IDS].sort());
  });
  it('tell the marks once, in the first world', () => {
    const count = Object.values(OVERVIEWS).filter((o) => /The figures/.test(o.text.en)).length;
    expect(count).toBe(1);
    expect(OVERVIEWS.yard.text.en).toMatch(/The figures/);
  });
  it('say what the 3D role asked: the digester opens cut, the tool cuts the other way, the drop is stylised, the yard stays', () => {
    expect(OVERVIEWS.digester.text.en).toMatch(/opens already cut/);
    expect(OVERVIEWS.digester.text.fr).toMatch(/s’ouvre déjà coupé/);
    expect(OVERVIEWS.digester.text.en).toMatch(/\*\*Section\*\* tool cuts the other way/);
    expect(OVERVIEWS.digester.text.fr).toMatch(/\*\*Coupe\*\* tranche donc dans l’autre sens/);
    expect(OVERVIEWS.digester.text.en).toMatch(/this 3D stays that of the 1,000 L tank/);
    expect(OVERVIEWS.slurry.text.en).toMatch(/\*\*This world is stylised\*\*/);
    expect(OVERVIEWS.slurry.text.fr).toMatch(/\*\*Ce monde est stylisé\*\*/);
    expect(OVERVIEWS.yard.text.en).toMatch(/it is not Geneva they show/);
    expect(OVERVIEWS['gas-line'].text.en).toMatch(/the measured plant had only a tap, a hose and a stove/);
  });
  it('say stylised once only, in the whole lab', () => {
    const said = allTexts().filter(([, t]) => /stylis/i.test(t.fr + t.en));
    expect(said.map(([w]) => w)).toEqual(['overview slurry.text']);
  });
  it('name no tool in a world that does not have it', () => {
    // no section in the yard, the drop or the line; no explode in the yard
    expect(OVERVIEWS.yard.text.en).not.toMatch(/\*\*Section\*\*|\*\*Explode\*\*/);
    expect(OVERVIEWS.slurry.text.en).not.toMatch(/\*\*Section\*\*/);
    expect(OVERVIEWS['gas-line'].text.en).not.toMatch(/\*\*Section\*\*/);
    for (const p of PARTS) {
      if (p.scene !== 'digester')
        for (const t of [p.tip, p.design, p.description]) {
          expect(t?.en ?? '', p.id).not.toMatch(/\bSection tool\b/);
          expect(t?.fr ?? '', p.id).not.toMatch(/\boutil Coupe\b/);
        }
      if (p.scene === 'yard') {
        expect(p.tip?.en ?? '', p.id).not.toMatch(/\bExplode\b/);
        expect(p.tip?.fr ?? '', p.id).not.toMatch(/Éclaté/);
      }
    }
  });
});

describe('what the sheets must say for the 3D and the sources to read honest', () => {
  const part = (id: string): PartInfo => PARTS.find((p) => p.id === id)!;
  it('composite parts carry their origin, and are not on the measured plant', () => {
    for (const id of ['condensate-trap', 'hydraulic-relief', 'h2s-filter', 'flame-arrester']) {
      expect(part(id).description.en, id).toMatch(/not on the measured plant|measured plant had none|not there/);
      expect(part(id).description.en, id).toMatch(/ours|generic|our estimate|Low-tech Lab/);
    }
    expect(part('float-limiter').description.en).toMatch(/not on the measured plant/);
    expect(part('float-limiter').description.en).toMatch(/This drawing has scaled it/);
    expect(part('float-limiter').description.en).toMatch(/The model does not see it/);
  });
  it('the relief says its depth is ours and that the model has none', () => {
    expect(part('hydraulic-relief').description.en).toMatch(/8 cm\*, is our estimate/);
    expect(part('hydraulic-relief').description.en).toMatch(/it has no relief/);
    expect(part('hydraulic-relief').description.fr).toMatch(/8 cm\*, est notre estimation/);
  });
  it('the saddle and the bracket say no source shows them', () => {
    expect(part('inner-feed-pipe').description.en).toMatch(/adds a saddle.*no source shows one/);
    expect(part('feed-riser').description.en).toMatch(/adds a bracket.*no source shows one/);
    expect(part('inner-feed-pipe').description.fr).toMatch(/selle.*aucune source ne la montre/);
    expect(part('feed-riser').description.fr).toMatch(/patte.*aucune source ne la montre/);
  });
  it('the flame says there is nothing to outline when it is off, and offers the button', () => {
    expect(part('blue-flame').tip?.en).toMatch(/nothing to outline/);
    expect(part('blue-flame').tip?.fr).toMatch(/rien à entourer/);
    expect(part('blue-flame').design?.en).toMatch(/It does not double with the half-brick/);
    expect(LAB_STRINGS.lightBurner[1]).toBe('Light the burner');
  });
  it('H₂S stays unknown, wherever the gas is described, and the smell is no alarm', () => {
    expect(part('h2s-filter').description.en).toMatch(/So the smell is no alarm/);
    expect(part('h2s-filter').specs.find((s) => s.label.en === 'In this gas')?.value).toEqual({
      fr: 'inconnu',
      en: 'unknown',
    });
    expect(part('sulphate-reducers').specs[0]!.value).toEqual({
      fr: 'inconnu : capteur plafonné à 100 ppm',
      en: 'unknown: sensor capped at 100 ppm',
    });
    expect(part('gas-space').description.en).toMatch(/Its H₂S stays unknown/);
  });
  it('states the explosive ranges with their condition, and none as a safe side', () => {
    const t = part('gas-space').maintenance!;
    expect(t.en).toMatch(/between 5 and 15 %/);
    expect(t.en).toMatch(/at 50 % methane, in saturated air, one test measured 10 to 24 %/);
    expect(t.en).toMatch(/None of these ranges is a line to rely on/);
    expect(t.fr).toMatch(/Aucune de ces plages n’est une limite sur laquelle compter/);
  });
  it('the anoxia warning stands once, on the tank', () => {
    const said = allTexts().filter(([where, t]) => where.startsWith('part') && /take the oxygen’s place/.test(t.en));
    expect(said.map(([w]) => w)).toEqual(['part digester-tank.maintenance']);
  });
  it('never says the brick doubles the flame, nor that leftovers lose per kilo of solids, nor that a cold tank stops as a fact', () => {
    const texts = [...allTexts(), ...LESSONS.flatMap((les) => les.body.map((b): [string, L] => [les.id, b]))];
    for (const [where, t] of texts) {
      expect(t.en, where).not.toMatch(/doubles the flame|flame doubles/i);
      expect(t.fr, where).not.toMatch(/double la flamme|la flamme double/i);
      expect(t.en, where).not.toMatch(/per kilo of solids/);
    }
  });
  it('keeps the thesis’s sentences out as reassurance', () => {
    const part2 = part('h2s-filter').design!;
    expect(part2.en).toMatch(/We do not repeat that as an assurance/);
  });
});

describe('the Sources', () => {
  it('credits the videos, and links every source over https, each once', () => {
    expect(MAIN_VIDEO.href).toContain(VIDEO_ID);
    const links = SOURCE_GROUPS.flatMap((g) => g.links);
    expect(links.length).toBeGreaterThan(20);
    for (const s of [MAIN_VIDEO, ...links]) {
      expect(s.href, String(s.label)).toMatch(/^https:\/\//);
      expect(s.note.fr.length).toBeGreaterThan(15);
      expect(s.note.en.length).toBeGreaterThan(15);
      expect(s.note.fr).not.toBe(s.note.en);
      for (const text of [s.note.fr, s.note.en]) expect(text).not.toMatch(/\b[KS]\d{1,2}\b/);
    }
    expect(links.map((s) => s.href).length).toBe(new Set(links.map((s) => s.href)).size);
  });
  it('shows no outline of a video nobody watched', () => {
    expect(CHAPTERS).toEqual([]);
    expect(MAIN_VIDEO.note.en).toMatch(/not yet been able to read a transcript/);
  });
  it('builds in both languages', () => {
    installFakeDom();
    for (const lang of ['fr', 'en'] as const) {
      setLang(lang);
      expect(sourcesPanel({ videoUrl: (ts: string) => `#${ts}` } as unknown as AppContext).length).toBeGreaterThan(10);
    }
    setLang('fr');
  });
  it('holds the reconstruction, the machine’s name and the law once', () => {
    const count = (re: RegExp): number => Object.values(LAB_STRINGS).filter(([, en]) => re.test(en)).length;
    expect(count(/independent educational reconstruction/i)).toBe(1);
    expect(count(/\bARTI\b/)).toBe(1);
    expect(count(/ask your local authority/)).toBe(1);
    expect(LAB_STRINGS.legal[1]).toBe(
      'Such an installation is subject to the rules of your country: ask your local authority before you build anything.',
    );
    expect(LAB_STRINGS.legal[0]).toMatch(/renseignez-vous auprès de votre autorité locale/);
  });
  it('credits PVGIS as it asks, and says what the marks do not prove', () => {
    const notes = SOURCE_GROUPS.flatMap((g) => g.links.map((s) => s.note.en)).join(' ');
    expect(notes).toMatch(/© European Union/);
    expect(LAB_STRINGS.noticeMarks[1]).toMatch(/We found no measurement of a plant of this kind below about 25 °C/);
    expect(LAB_STRINGS.noticeMarks[1]).toMatch(/does not force it/);
    expect(LAB_STRINGS.noticeMarks[1]).toMatch(/H₂S stays unknown/);
  });
});

describe('the visitor’s texts', () => {
  const texts = allTexts();
  it('say everything in French and English, with no placeholder, no research code and no internal word', () => {
    for (const [where, t] of texts) {
      expect(t.fr.trim().length, where).toBeGreaterThan(0);
      expect(t.en.trim().length, where).toBeGreaterThan(0);
      for (const text of [t.fr, t.en]) {
        expect(text, where).not.toMatch(/\b[KS]\d{1,2}\b/);
        expect(text, where).not.toMatch(/\{\w+\}|undefined|\bNaN\b|TODO|FIXME|lorem/);
        expect(text, where).not.toMatch(/\bworld id\b|\bpreset id\b|\bthe owner\b|propriétaire/i);
        expect(text, where).not.toMatch(/[A-Za-zÀ-ÿ]'[A-Za-zÀ-ÿ]/);
        expect(text, where).not.toMatch(/ {2,}/);
      }
    }
  });
  it('name ARTI nowhere but the Sources', () => {
    for (const [where, t] of texts) for (const text of [t.fr, t.en]) expect(text, where).not.toMatch(/\bARTI\b|Karve/);
  });
  it('promise no safety: nothing is called safe, harmless or clean, outside the one sentence that says the opposite', () => {
    const promise =
      /\b(safe|safely|harmless|risk-free|no risk|no danger|non-toxic|nontoxic|clean energy|clean water|free energy|zero waste|carbon neutral|guarantee)\b|sans (danger|risque)|\bsûr\b|\bsûre\b|sécurisé|inoffensi|non toxique|eau propre|énergie gratuite|neutre en carbone|zéro déchet|garanti/i;
    for (const [where, t] of texts) for (const text of [t.fr, t.en]) expect(text, where).not.toMatch(promise);
    for (const [where, t] of Object.entries(LAB_STRINGS))
      for (const text of t) expect(text, where).not.toMatch(promise);
  });
  it('give no build instruction: it is told, not ordered', () => {
    const plan =
      /\b(you should|you must|drill the|cut the|build it|install it)\b|\b(construisez|percez|découpez|il faut|vous devez|il vous faut)\b/i;
    for (const [where, t] of texts) for (const text of [t.fr, t.en]) expect(text, where).not.toMatch(plan);
  });
  it('claim no universal the research does not hold: what we found, not what nobody did', () => {
    const claim =
      /personne n’a (rien )?mesuré|nobody has measured|jamais été mesuré|has never been measured|never measured|aucune installation au monde|no plant anywhere|tous les digesteurs|every digester|all digesters/i;
    for (const [where, t] of texts) for (const text of [t.fr, t.en]) expect(text, where).not.toMatch(claim);
  });
  it('name the X-ray tool as the kit’s button does in French', () => {
    for (const [where, t] of texts) expect(t.fr, where).not.toMatch(/x-ray/i);
  });
  it('write British English', () => {
    const us =
      /\b(color|center|aluminum|gray|fiber|liter|organiz|recogniz|analyz|neighbor|labor|vapor|mold|sulfur|sulfide|sulfate)\b/i;
    for (const [where, t] of texts) expect(us.test(t.en), `${where}: ${t.en}`).toBe(false);
  });
  it('carry the same numbers in French and in English', () => {
    for (const [where, t] of texts)
      expect(numbers(bare(t.fr, 'fr'), 'fr'), where).toEqual(numbers(bare(t.en, 'en'), 'en'));
  });
  it('have the same level of detail in both', () => {
    for (const [where, t] of texts) {
      if (t.fr.length < 60 || t.en.length < 60) continue;
      expect(t.fr.length / t.en.length, `${where}: ${t.fr.length} / ${t.en.length}`).toBeGreaterThan(0.72);
      expect(t.fr.length / t.en.length, `${where}: ${t.fr.length} / ${t.en.length}`).toBeLessThan(1.45);
    }
  });
  it('are not one language in both: only a unit or a name may read the same', () => {
    for (const [where, t] of texts) {
      if (t.fr === t.en && !/\d/.test(t.fr))
        expect(t.fr.split(/\s+/).length, `${where}: ${t.fr}`).toBeLessThanOrEqual(5);
    }
  });
  it('quote no number but the research’s, and mark every other', () => {
    const problems: string[] = [];
    for (const [where, t] of texts) {
      for (const lang of ['fr', 'en'] as const) {
        const text = bare(t[lang], lang);
        const re = lang === 'fr' ? /\d+(?: \d{3})*(?:,\d+)?/g : /\d+(?:,\d{3})*(?:\.\d+)?/g;
        for (const m of text.matchAll(re)) {
          const n = numbers(m[0], lang)[0] ?? '';
          const after = text.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 16);
          const marked = /^(?: ?(?:°C|°|[\p{L}/%²³·]+)(?:\/\p{L}+)?\d?)?(?: de DCO| of COD)?[†*]/u.test(after);
          if (marked) {
            if (!figNumbers.has(n)) problems.push(`${where} (${lang}): marked but no figure ${m[0]}${after}`);
          } else if (!REPORTED.has(n)) problems.push(`${where} (${lang}): unmarked ${m[0]}${after}`);
        }
      }
    }
    expect(problems.join('\n')).toBe('');
  });
  it('type no marked number by hand: every † and * comes from a figure of figures.ts', () => {
    for (const [name, src] of [
      ['yard', partsYard],
      ['digester', partsDigester],
      ['slurry', partsSlurry],
      ['gas line', partsGasLine],
      ['assembly', assemblySource],
      ['install', installSource],
      ['overviews', overviewsSource],
      ['lessons', lessonsSource],
    ] as const) {
      const code = src.replace(/^\s*\/\/.*$/gm, '');
      expect(code.match(/\d[^'’\s]{0,8}\s?[a-zA-Z/²%]{0,6}[†*](?!\*)/g) ?? [], name).toEqual([]);
    }
  });
  it('use every figure of the table, in a text or on a sheet, and each with the mark of its status', () => {
    const used = [
      partsYard,
      partsDigester,
      partsSlurry,
      partsGasLine,
      assemblySource,
      installSource,
      overviewsSource,
      lessonsSource,
      ...Object.values(SHEET_SOURCES),
    ].join(' ');
    const unused = Object.keys(FIG).filter((k) => !used.includes(`{${k}}`) && !used.includes(`'${k}'`));
    expect(unused).toEqual([]);
    for (const f of Object.values(FIG as Record<string, Fig>)) {
      expect(markOf(f.s)).toBe(f.s === 'derived' || f.s === 'model' ? '†' : '*');
    }
  });
});

describe('the standard, on the data alone (src/lab.ts is the lead’s to wire)', () => {
  it('meets the bar: 4 worlds, 36 parts, 20 and 10 steps, 6 lessons, 12 questions, 8 sheets', () => {
    const missing = checkStandard({
      worlds: Object.keys(WORLD),
      parts: PARTS.length,
      assembly: ASSEMBLY.length,
      install: INSTALL.length,
      lessons: LESSONS.length,
      quiz: LESSONS.reduce((n, les) => n + (les.quiz?.length ?? 0), 0),
      sheets: SHEETS.length,
      narration: { fr: 999, en: 999 },
      readmeBilingual: true,
      labJsonFilled: true,
    });
    expect(missing).toEqual([]);
    expect(PARTS.length).toBeGreaterThanOrEqual(STANDARD.parts);
    expect(SHEETS.length).toBeGreaterThanOrEqual(STANDARD.sheets);
  });
});
