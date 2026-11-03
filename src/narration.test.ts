import { readManifest, validateManifest } from '@onigam/lab-kit/narration';
import type { SceneModule } from '@onigam/lab-kit/three';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { FIG } from './data/figures';
import { LESSONS } from './data/lessons';
import { OVERVIEWS, WORLD_IDS, type WorldId } from './data/overviews';
import { PARTS } from './data/parts';
import { SHEETS } from './drawings';
import { LAB_STRINGS } from './i18n/ui';
import { DEFAULT_TIME_SCALE, presetParams, SCENARIO_IDS } from './sim/presets';
import { PLANT_1000 } from './sim/machine';
import { SCENARIO_TEXTS } from './sim/texts';
import type { BioState } from './sim/types';
import { WORLD } from './three';
import { PAD, PALLET } from './three/dims';
import { createDigesterScene } from './three/digester/scene';
import { createDropScene } from './three/drop/scene';
import { createGasLineScene } from './three/gasline/scene';
import gasLineSource from './three/gasline/scene.ts?raw';
import { PART_NAMES } from './three/part-ids';
import { stateWith, view } from './three/test-utils';
import { createYardScene } from './three/yard/scene';

// The spoken guide: the scripts (narration/<lang>.json) and the manifests generated from them (public/audio/<lang>) must agree with the lab's worlds, parts and modes, say each of the
// lab's truths once, say today's figures, name only the tools a world has, and point only at what can be seen from where the camera goes. The audio files are only listed, never loaded.

const sceneIds: string[] = [...WORLD_IDS];
const partIds: string[] = PARTS.map((p) => p.id);
const worldOf = (partId: string): string | undefined => PARTS.find((p) => p.id === partId)?.scene;

const CUE = /\[\[([a-z]+)(?::([^\]]*))?\]\]/g;
const BOOLEAN_CUES = ['xray', 'cutaway', 'flows', 'isolate'];
const MODES = ['explore', 'assembly', 'install', 'sim', 'plans', 'lessons'];
const CAMERA_CUES = ['home', 'scene', 'frame', 'select'];
/** Ceiling set by the owner for the spoken characters of one language. */
const BUDGET = 30_000;
/** What this lab's guide aims for: the research said about 22,000, the series 17,000 to 24,000. */
const AIM = [19_000, 24_000] as const;
/** generate.mjs refuses a longer segment. */
const SEGMENT_CAP = 2_500;
/** This lab's guide is in the local voice (generate.mjs --engine voicebox): a change of voice must be a decision, not an accident. */
const LOCAL_VOICE = 'qwen3-tts-1.7B';

interface Segment {
  id: string;
  scope: string;
  title: string;
  scene: string;
  text: string;
}
interface Script {
  lang: string;
  segments: Segment[];
}
type Lang = 'fr' | 'en';

const langOf = (path: string, folder: RegExp): string => folder.exec(path)![1]!;
const scripts = Object.fromEntries(
  Object.entries(
    import.meta.glob('../narration/*.json', { import: 'default', eager: true }) as Record<string, Script>,
  ).map(([path, script]) => [langOf(path, /\/(\w+)\.json$/), script]),
);
const manifests = Object.fromEntries(
  Object.entries(import.meta.glob('../public/audio/*/manifest.json', { import: 'default', eager: true })).map(
    ([path, raw]) => [langOf(path, /\/audio\/(\w+)\//), raw],
  ),
);
const audioFiles = Object.keys(import.meta.glob('../public/audio/*/*.mp3'));

const spokenOf = (s: Pick<Segment, 'text'>): string => s.text.replace(CUE, '').replace(/\s+/g, ' ').trim();

/**
 * Each truth of the lab, said in one segment and no other (the owner, of the disclaimers: « à chaque fois c'est un peu chiant »).
 * Regular expressions per language; the segment is the only one allowed.
 */
const ONCE: Record<Lang, Record<string, [RegExp, string]>> = {
  fr: {
    reconstruction: [/reconstitution pédagogique/i, 'intro'],
    onePlant: [/une seule, quatre mois/i, 'intro'],
    noPlan: [/ni un plan à suivre/i, 'intro'],
    provesNothing: [/ne prouve rien sur la sécurité/i, 'intro'],
    law: [/votre autorité locale/i, 'intro'],
    figures: [/les chiffres viennent/i, 'intro'],
    sources: [/qui a dit quoi/i, 'intro'],
    winterUndecided: [/ne peut pas trancher/i, 'intro'],
    noMeasurement: [/aucune mesure de ce genre d’installation/i, 'intro'],
    yardStays: [/ses manguiers/i, 'scene-yard'],
    nightFalls: [/la nuit tombe/i, 'scene-yard'],
    opensCut: [/déjà coupée/i, 'scene-digester'],
    clock: [/une heure par seconde/i, 'scene-digester'],
    oneSize: [/cuve de mille litres/i, 'scene-digester'],
    stylised: [/stylisé/i, 'scene-slurry'],
    composite: [/viennent d’ailleurs/i, 'scene-gas-line'],
    gasTrueSpeed: [/à sa vraie vitesse/i, 'scene-gas-line'],
    noOxygen: [/la place de l’oxygène/i, 'part-digester-tank'],
    airMix: [/peut exploser/i, 'part-gas-space'],
    bellWeight: [/peut glisser/i, 'part-half-brick'],
    pressureDoubles: [/la pression double/i, 'part-half-brick'],
    trapped: [/deux cent trente/i, 'part-gas-bell'],
    larvae: [/larves/i, 'part-rim-gap'],
    plugAtTheKnee: [/hauteur de genou/i, 'part-clean-out-plug'],
    marketNotForced: [/ne force pas le chiffre/i, 'part-scrap-caddy'],
    modelHopeful: [/ce modèle est optimiste/i, 'part-fatty-acid-pool'],
    aReading: [/si notre lecture est bonne/i, 'part-fatty-acid-pool'],
    germs: [/inactivés/i, 'part-surviving-germs'],
    h2sKills: [/il tue d’un coup/i, 'part-h2s-filter'],
    h2sUnknown: [/\binconnu\b/i, 'part-h2s-filter'],
    lowPressure: [/le gaz reste du gaz/i, 'part-hydraulic-relief'],
    closedRoom: [/pièce fermée/i, 'part-wall-sleeve'],
    noOdour: [/n’a pas d’odeur/i, 'part-primary-air-sleeve'],
    burns: [/on se brûle/i, 'part-blue-flame'],
    noDinner: [/ne promet pas un dîner/i, 'part-cooking-pot'],
  },
  en: {
    reconstruction: [/educational reconstruction/i, 'intro'],
    onePlant: [/just one, four months/i, 'intro'],
    noPlan: [/neither a plan to follow/i, 'intro'],
    provesNothing: [/proves nothing about the safety/i, 'intro'],
    law: [/your local authority/i, 'intro'],
    figures: [/the figures come from/i, 'intro'],
    sources: [/who said what/i, 'intro'],
    winterUndecided: [/cannot decide/i, 'intro'],
    noMeasurement: [/no measurement of a plant of this kind/i, 'intro'],
    yardStays: [/its mango trees/i, 'scene-yard'],
    nightFalls: [/night falls/i, 'scene-yard'],
    opensCut: [/already cut/i, 'scene-digester'],
    clock: [/an hour a second/i, 'scene-digester'],
    oneSize: [/thousand-litre tank/i, 'scene-digester'],
    stylised: [/stylised/i, 'scene-slurry'],
    composite: [/come from elsewhere/i, 'scene-gas-line'],
    gasTrueSpeed: [/at its true speed/i, 'scene-gas-line'],
    noOxygen: [/the oxygen’s place/i, 'part-digester-tank'],
    airMix: [/can explode/i, 'part-gas-space'],
    bellWeight: [/can slide off/i, 'part-half-brick'],
    pressureDoubles: [/the pressure doubles/i, 'part-half-brick'],
    trapped: [/two hundred and thirty/i, 'part-gas-bell'],
    larvae: [/larvae/i, 'part-rim-gap'],
    plugAtTheKnee: [/knee height/i, 'part-clean-out-plug'],
    marketNotForced: [/does not force the figure/i, 'part-scrap-caddy'],
    modelHopeful: [/this model is hopeful/i, 'part-fatty-acid-pool'],
    aReading: [/if our reading is right/i, 'part-fatty-acid-pool'],
    germs: [/inactivated/i, 'part-surviving-germs'],
    h2sKills: [/it kills at once/i, 'part-h2s-filter'],
    h2sUnknown: [/\bunknown\b/i, 'part-h2s-filter'],
    lowPressure: [/the gas is still gas/i, 'part-hydraulic-relief'],
    closedRoom: [/closed room/i, 'part-wall-sleeve'],
    noOdour: [/has no smell/i, 'part-primary-air-sleeve'],
    burns: [/people get burnt/i, 'part-blue-flame'],
    noDinner: [/does not promise a dinner/i, 'part-cooking-pot'],
  },
};

/**
 * Never said, anywhere: a promise; what docs/physics.md §9 asks not to write (half a brick doubling the flame, leftovers against peelings per kilo of solids, a cold tank stopping as a fact);
 * the winter's switch in numbers, which moves with the tank's history (`eaHint` of src/i18n/ui.ts); a month of the model's winter, as if it were a forecast; the 232 L a figure this exact would pretend;
 * a video nobody has watched; a level of hydrogen sulphide that is low, slight or small; « tourner » for souring, which in this lab's French also means running (README).
 */
const REFUSED: Record<Lang, RegExp> = {
  fr: /sans danger|sans risque|en toute sécurité|(?<!\p{L})sûre?s?(?!\p{L})|garanti|protég|tout va bien|rassur|inoffensi|eau propre|flamme double|double la flamme|par kilo de (matière sèche|solides)|cuve froide|froid.{0,40}s’arrête|s’arrête.{0,40}froid|kilojoule|quarante-trois|quarante-quatre|deux cent trente-deux|novembre|décembre|vidéo|personne n’a mesuré|plein soleil|(?<!\p{L})(tourne|tourné|tourner)(?!\p{L})|(peu|faible|faibles|un peu) d’hydrogène sulfuré/iu,
  en: /without danger|no risk|without risk|\bsafely\b|\bsafe\b|guarantee|protect|all is well|reassur|harmless|clean water|flame doubles|doubles the flame|per kilo of (solids|dry)|cold tank|cold.{0,40}\bstops\b|\bstops\b.{0,40}cold|kilojoule|forty-three|forty-four|two hundred and thirty-two|november|december|video|nobody has measured|full sun|(little|low|slight|small) hydrogen sulphide/i,
};

/** Figures of src/data/figures.ts, as the voice rounds them, and where the voice says them: if the physics moves, this says which segments to rewrite. */
const FIGURES: [value: number, said: number, fr: RegExp, en: RegExp, id: string][] = [
  // the model where a plant was measured
  [FIG.gasAbout.v, 280, /environ deux cent quatre-vingts/, /about two hundred and eighty/, 'part-biogas-plant'],
  [FIG.marketLow.v, 64, /soixante-quatre à soixante-seize/, /sixty-four to seventy-six/, 'part-scrap-caddy'],
  [FIG.marketHigh.v, 76, /soixante-quatre à soixante-seize/, /sixty-four to seventy-six/, 'part-scrap-caddy'],
  [
    FIG.pressureRest.v,
    1.3,
    /un virgule trois à trois millibars/,
    /one point three to three millibars/,
    'part-gas-bell',
  ],
  [FIG.pressureFull.v, 3, /un virgule trois à trois millibars/, /one point three to three millibars/, 'part-gas-bell'],
  [
    FIG.pHNoReturn.v,
    6.4,
    /six virgule quatre sur l’échelle d’acidité/,
    /six point four on the acidity scale/,
    'part-bicarbonate-buffer',
  ],
  [FIG.pHTooLate.v, 6.35, /six virgule trente-cinq/, /six point three five/, 'part-bicarbonate-buffer'],
  [
    FIG.mealHalf.v,
    2,
    /la moitié de son gaz en deux jours/,
    /half the gas of a cooked meal in two days/,
    'part-hydrolysers',
  ],
  [FIG.condensate.v, 2.5, /deux grammes et demi/, /two and a half grams/, 'part-condensate-trap'],
  // arithmetic on reported figures
  [FIG.dayRise.v, 50, /cinquante centimètres par jour/, /fifty centimetres a day/, 'scene-digester'],
  [FIG.pushCm.v, 2, /deux centimètres d’eau/, /two centimetres of water/, 'intro'],
  [FIG.pushCm.v, 2, /deux centimètres d’eau/, /two centimetres of water/, 'part-hose-run'],
  [FIG.brickMbar.v, 2.03, /deux virgule zéro trois millibars/, /two point zero three millibars/, 'part-half-brick'],
  [FIG.flowRatio.v, 1.84, /un virgule quatre-vingt-quatre/, /one point eight four/, 'part-half-brick'],
  [FIG.orificeRatio.v, 1.4, /donne un virgule quatre/, /gives one point four/, 'part-half-brick'],
  [FIG.methaneWet.v, 105, /environ cent cinq grammes/, /about a hundred and five grams/, 'part-food-particle'],
  [FIG.minPerKgFood.v, 32, /environ trente-deux minutes/, /about thirty-two minutes/, 'part-biogas-burner'],
  [FIG.minPerKgFood.v, 32, /trente-deux minutes le kilo/, /thirty-two minutes a kilo/, 'part-blue-flame'],
  [FIG.minPerKgMarket.v, 14, /épluchures quatorze/, /peelings fourteen/, 'part-biogas-burner'],
  [FIG.bellMinutes.v, 90, /une heure et demie/, /an hour and a half/, 'part-gas-space'],
  [FIG.boilLitres.v, 6, /environ six litres/, /about six litres/, 'part-cooking-pot'],
  // estimates, each said with « about » or as ours
  [FIG.plantMass.v, 900, /environ neuf cents kilos/, /about nine hundred kilos/, 'part-yard-pad'],
  [FIG.trappedL.v, 230, /environ deux cent trente litres/, /about two hundred and thirty litres/, 'part-gas-bell'],
];

/** What a source reports, as a sheet or a string prints it: a sheet that changes names the segment to read again. `where` is a part's id, or a key of LAB_STRINGS. */
const REPORTED: [where: string, printed: string, fr: RegExp, en: RegExp, id: string][] = [
  [
    'biogas-plant',
    '289 L',
    /deux cent quatre-vingt-neuf litres/,
    /two hundred and eighty-nine litres/,
    'part-biogas-plant',
  ],
  ['biogas-plant', '12 installations', /douze installations/, /twelve plants/, 'part-biogas-plant'],
  ['noticeMarks', '126 L', /cent vingt-six/, /a hundred and twenty-six/, 'part-scrap-caddy'],
  ['shade-tree', '7,5 h', /sept heures et demie/, /seven and a half hours/, 'part-shade-tree'],
  ['shade-tree', 'trois arbres', /trois ont été abattus/, /three were cut down/, 'part-shade-tree'],
  ['rim-gap', '22 %', /vingt-deux pour cent/, /twenty-two per cent/, 'part-rim-gap'],
  ['gas-space', '400 L', /quatre cents litres/, /four hundred usable litres/, 'part-gas-space'],
  ['gas-space', 'dix jours', /dix jours/, /ten days/, 'part-gas-space'],
  ['half-brick', '12 kg', /douze kilos/i, /twelve kilos/i, 'part-half-brick'],
  ['inner-feed-pipe', '0,51 m', /cinquante et un centimètres/, /fifty-one centimetres/, 'part-inner-feed-pipe'],
  ['scum-layer', '74 g', /soixante-quatorze grammes/i, /seventy-four grams/i, 'part-scum-layer'],
  ['scum-layer', '41 g/L', /quarante et un au fond/, /forty-one at the bottom/, 'part-scum-layer'],
  ['clear-liquor', '600 L', /six cents litres/, /six hundred litres/, 'part-clear-liquor'],
  ['clear-liquor', '42,5 jours', /quarante-deux jours et demi/, /forty-two and a half days/, 'part-clear-liquor'],
  ['clear-liquor', '300 jours', /trois cents jours/, /stay about three hundred/, 'part-clear-liquor'],
  ['sludge-bed', '60 kg', /soixante kilos/, /sixty kilos/, 'part-sludge-bed'],
  ['bell-hose', '0,69 m', /soixante-neuf centimètres/, /sixty-nine centimetres/, 'part-bell-hose'],
  ['pressure-gauge', '60 mbar', /soixante millibars/, /sixty millibars/, 'part-pressure-gauge'],
  ['h2s-filter', '100 ppm', /cent parties par million/, /a hundred parts per million/, 'part-h2s-filter'],
  ['h2s-filter', '500 ppm', /vers cinq cents/i, /about five hundred/i, 'part-h2s-filter'],
  ['blue-flame', '45 min', /quarante-cinq minutes/, /forty-five minutes/, 'part-blue-flame'],
  ['cooking-pot', '55 %', /cinquante-cinq pour cent/, /fifty-five per cent/, 'part-cooking-pot'],
];

describe('narration wiring', () => {
  // the lab asks for the manifests only once the audio is generated
  it.skipIf(Object.keys(manifests).length === 0)('asks for the manifest of the interface language', async () => {
    const { lab } = await import('./lab');
    expect(lab.narration?.manifest).toBe('audio/{lang}/manifest.json');
  });
});

describe('the contract', () => {
  it('has 4 worlds and 58 parts, so 63 segments per language, in French and in English', () => {
    expect(sceneIds).toHaveLength(4);
    expect(partIds).toHaveLength(58);
    expect(Object.keys(scripts).sort()).toEqual(['en', 'fr']);
    for (const lang of Object.keys(scripts)) expect(scripts[lang]!.segments, lang).toHaveLength(1 + 4 + 58);
  });
});

describe.each(Object.keys(scripts))('narration script %s', (lang) => {
  const script = scripts[lang]!;
  const i = lang === 'fr' ? 0 : 1;
  const seg = (id: string): Segment => script.segments.find((s) => s.id === id)!;
  const where = (re: RegExp): string[] => script.segments.filter((s) => re.test(spokenOf(s))).map((s) => s.id);

  it('has the lab language and a segment for the intro, every world and every part, once each', () => {
    expect(script.lang).toBe(lang);
    const scopes = script.segments.map((s) => s.scope);
    expect(new Set(scopes).size).toBe(scopes.length);
    expect(new Set(script.segments.map((s) => s.id)).size).toBe(script.segments.length);
    expect([...scopes].sort()).toEqual(
      ['intro', ...sceneIds.map((id) => `scene:${id}`), ...partIds.map((id) => `part:${id}`)].sort(),
    );
  });

  it('names its segments intro, scene-<world> and part-<id>, titles a part by its sheet and a world by its overview, and shows the voice label', () => {
    for (const s of script.segments) {
      const [kind, id = ''] = s.scope.split(':');
      expect(s.id, s.scope).toBe(kind === 'intro' ? 'intro' : `${kind === 'part' ? 'part' : 'scene'}-${id}`);
      expect(s.title.trim().length, s.id).toBeGreaterThan(2);
      expect(s.title, s.id).not.toMatch(/\d/);
      expect(spokenOf(s).length, s.id).toBeGreaterThan(200);
      if (kind === 'part') expect(s.title, s.id).toBe(PART_NAMES.find((p) => p.id === id)![lang as Lang]);
      if (kind === 'scene') expect(s.title, s.id).toBe(OVERVIEWS[id as WorldId].title[lang as Lang]);
    }
    expect(script).toHaveProperty('voiceLabel.fr', 'Voix de synthèse');
    expect(script).toHaveProperty('voiceLabel.en', 'Synthetic voice');
  });

  it('starts every segment in the right world', () => {
    for (const s of script.segments) {
      const [kind, id = ''] = s.scope.split(':');
      const expected = kind === 'part' ? worldOf(id) : kind === 'scene' ? id : 'yard';
      expect(s.scene, s.id).toBe(expected);
    }
  });

  it('writes only cues the app knows, on worlds, parts and modes of the lab', () => {
    for (const s of script.segments) {
      for (const [, name = '', arg = ''] of s.text.matchAll(CUE)) {
        const at = `${s.id}: [[${name}${arg ? ':' + arg : ''}]]`;
        if (name === 'home') expect(arg, at).toBe('');
        else if (name === 'scene') expect(sceneIds, at).toContain(arg);
        else if (name === 'frame') for (const id of arg.split(',')) expect(partIds, at).toContain(id);
        else if (name === 'select') expect([...partIds, 'none'], at).toContain(arg);
        else if (name === 'explode') {
          expect(Number(arg), at).toBeGreaterThanOrEqual(0);
          expect(Number(arg), at).toBeLessThanOrEqual(1);
        } else if (BOOLEAN_CUES.includes(name)) expect(['on', 'off'], at).toContain(arg);
        else if (name === 'mode') expect(MODES, at).toContain(arg);
        // no `lab:` cue: src/lab.ts defines no narration.onCue, so the voice cannot light the burner or change the clock (README)
        else expect.fail(`${at}: unknown cue`);
      }
    }
  });

  it('frames only parts of the current world and switches off what it switches on', () => {
    for (const s of script.segments) {
      let world = s.scene;
      const on = new Set<string>();
      for (const [, name = '', arg = ''] of s.text.matchAll(CUE)) {
        if (name === 'scene') world = arg;
        if (name === 'frame') for (const id of arg.split(',')) expect(worldOf(id), `${s.id}: frame ${id}`).toBe(world);
        if (name === 'select' && arg !== 'none') expect(worldOf(arg), `${s.id}: select ${arg}`).toBe(world);
        if (BOOLEAN_CUES.includes(name)) {
          if (arg === 'on') on.add(name);
          else on.delete(name);
        }
        if (name === 'explode') {
          if (Number(arg) === 0) on.delete(name);
          else on.add(name);
        }
      }
      expect([...on], `${s.id} leaves cues on`).toEqual([]);
    }
  });

  it('uses only the tools of the world it is in (src/three/index.ts), and never one that hides what the other shows', () => {
    for (const s of script.segments) {
      let world = s.scene as WorldId;
      const on = new Set<string>();
      for (const [, name = '', arg = ''] of s.text.matchAll(CUE)) {
        if (name === 'scene') world = arg as WorldId;
        if (name === 'cutaway' && arg === 'on') expect(WORLD[world].cutaway, `${s.id}: section in ${world}`).toBe(true);
        // a yard does not come apart
        if (name === 'explode' && Number(arg) > 0) expect(world, `${s.id}: explode in the yard`).not.toBe('yard');
        // x-ray and isolate need a selection, which only a part segment starts with
        if ((name === 'xray' || name === 'isolate') && arg === 'on')
          expect(s.scope, `${s.id}: ${name} with nothing selected`).toMatch(/^part:/);
        if (BOOLEAN_CUES.includes(name)) {
          if (arg === 'on') on.add(name);
          else on.delete(name);
        }
        if (name === 'explode') {
          if (Number(arg) === 0) on.delete(name);
          else on.add(name);
        }
        // the dots stand down in an exploded view, and in the digester under x-ray or the section across (the scenes' `showFlows`)
        expect(on.has('flows') && on.has('explode'), `${s.id}: flows under explode`).toBe(false);
        if (world === 'digester') {
          expect(on.has('flows') && on.has('xray'), `${s.id}: flows under x-ray`).toBe(false);
          expect(on.has('flows') && on.has('cutaway'), `${s.id}: flows under the section`).toBe(false);
        }
      }
    }
  });

  it('names a tool of the toolbar only in a world that has it, and only when it switches it on', () => {
    const tools = {
      fr: { section: /\bCoupe\b/, explode: /Éclaté/, xray: /Transparence/, flows: /\bFlux\b/ },
      en: { section: /\bSection\b/, explode: /\bExplode\b/, xray: /\bX-ray\b/, flows: /\bFlows\b/ },
    }[lang as Lang];
    for (const s of script.segments) {
      const spoken = spokenOf(s);
      if (tools.section.test(spoken)) {
        expect(s.scene, s.id).toBe('digester');
        expect(s.text, s.id).toContain('[[cutaway:on]]');
      }
      if (tools.flows.test(spoken)) expect(s.text, s.id).toContain('[[flows:on]]');
      if (tools.explode.test(spoken)) expect(s.scene, s.id).not.toBe('yard');
      if (tools.xray.test(spoken)) expect(s.text, s.id).toContain('[[xray:on]]');
    }
  });

  it('keeps a part segment framed by itself: no camera cue, no change of world or mode', () => {
    for (const s of script.segments.filter((x) => x.scope.startsWith('part:'))) {
      const camera = [...s.text.matchAll(CUE)].filter((m) => CAMERA_CUES.includes(m[1] ?? '') || m[1] === 'mode');
      expect(
        camera.map((m) => m[0]),
        s.id,
      ).toEqual([]);
    }
  });

  it('moves the camera at most once every 35 spoken characters', () => {
    for (const s of script.segments) {
      let last: { at: number; cue: string } | undefined;
      for (const m of s.text.matchAll(CUE)) {
        if (!CAMERA_CUES.includes(m[1] ?? '')) continue;
        const at = spokenOf({ text: s.text.slice(0, m.index) }).length;
        if (last) expect(at - last.at, `${s.id}: ${last.cue} then ${m[0]}`).toBeGreaterThanOrEqual(35);
        last = { at, cue: m[0] };
      }
    }
  });

  it('hops through the worlds and the modes in the introduction, and ends on the yard, nothing selected', () => {
    const cues = [...seg('intro').text.matchAll(CUE)].map((m) => m[0]);
    for (const w of sceneIds) if (w !== 'yard') expect(cues, w).toContain(`[[scene:${w}]]`);
    const modes = cues.filter((c) => c.startsWith('[[mode:'));
    expect(modes).toEqual(['assembly', 'install', 'sim', 'lessons', 'plans', 'explore'].map((m) => `[[mode:${m}]]`));
    expect(cues.slice(-2)).toEqual(['[[scene:yard]]', '[[select:none]]']);
  });

  it('counts in the introduction what the lab has', () => {
    const intro = spokenOf(seg('intro'));
    expect(SCENARIO_IDS).toHaveLength(12);
    expect(LESSONS).toHaveLength(7);
    expect(SHEETS).toHaveLength(10);
    const counts = {
      fr: [/douze scénarios/, /sept leçons/i, /dix planches/i, /quatre vues/],
      en: [/twelve scenarios/, /seven lessons/i, /ten sheets/i, /four views/],
    }[lang as Lang];
    for (const re of counts) expect(intro).toMatch(re);
  });

  it('gives each world a home view first and walks through its parts', () => {
    for (const w of sceneIds) {
      const text = seg(`scene-${w}`).text;
      expect(text.startsWith('[[home]]'), w).toBe(true);
      const framed = new Set([...text.matchAll(/\[\[frame:([^\]]*)\]\]/g)].flatMap((m) => m[1]!.split(',')));
      expect(framed.size, `${w} frames at least 5 parts`).toBeGreaterThanOrEqual(5);
    }
  });

  it('carries each truth of the lab once, in its place, and never again', () => {
    for (const [truth, [re, id]] of Object.entries(ONCE[lang as Lang])) expect(where(re), truth).toEqual([id]);
  });

  it('says the Geneva winter first as what the model cannot decide', () => {
    const intro = spokenOf(seg('intro'));
    const geneva = { fr: /l’hiver à Genève : une cuve nue/, en: /the winter at Geneva: does a bare tank/ }[
      lang as Lang
    ];
    const undecided = ONCE[lang as Lang]!.winterUndecided![0];
    expect(intro.search(geneva)).toBeGreaterThan(0);
    expect(intro.search(undecided)).toBeGreaterThan(intro.search(geneva));
    // the first thing said of that winter: no outcome before it, and the scenario only after it
    expect(intro.slice(0, intro.search(geneva))).not.toMatch(/hiver|winter/i);
    const scenario = SCENARIO_TEXTS['geneva-january'].name[i]!;
    expect(intro.indexOf(scenario)).toBeGreaterThan(intro.search(undecided));
    // and nothing else names it
    expect(where(new RegExp(scenario))).toEqual(['intro']);
  });

  it('never makes a promise, and never says what the physics withdrew', () => {
    expect(where(REFUSED[lang as Lang])).toEqual([]);
  });

  it('leaves the level of hydrogen sulphide unknown: only three segments speak of that gas, and none gives it a level', () => {
    const gas = { fr: /hydrogène sulfuré/i, en: /hydrogen sulphide/i }[lang as Lang];
    expect(where(gas)).toEqual(['part-sulphate-reducers', 'part-h2s-filter', 'part-vent-opening', 'part-gas-detector']);
    const noLevel = {
      fr: /(de|d’)\s*(peu|faibles?)\s+(teneur|quantité)|sa teneur (est|reste) (basse|faible)|pas d’hydrogène sulfuré/i,
      en: /(low|small|slight) (level|amount)|no hydrogen sulphide/i,
    }[lang as Lang];
    expect(where(noLevel)).toEqual([]);
  });

  it('says only today’s figures', () => {
    const k = lang === 'fr' ? 2 : 3;
    for (const row of FIGURES) {
      const [value, said] = row;
      const re = row[k] as RegExp;
      expect(Math.abs(value - said), `${re} against ${value}`).toBeLessThanOrEqual(Math.max(0.05, said * 0.02));
      expect(where(re), String(re)).toContain(row[4]);
    }
  });

  it('says what a source reports as the sheets print it', () => {
    const k = lang === 'fr' ? 2 : 3;
    const strings = LAB_STRINGS as unknown as Record<string, readonly [string, string]>;
    for (const row of REPORTED) {
      const [at, printed] = row;
      const part = PARTS.find((p) => p.id === at);
      const text = part ? JSON.stringify(part) : strings[at]![0];
      expect(text, `${at} prints ${printed}`).toContain(printed);
      expect(where(row[k] as RegExp), String(row[k])).toContain(row[4]);
    }
  });

  it('holds the sums the voice does itself', () => {
    // « a third of the energy in the day's gas » (part-water-butt): 0.46 kWh against 1.47 kWh
    expect(FIG.coldWaterKwh.v / FIG.kwhFood.v).toBeGreaterThan(0.28);
    expect(FIG.coldWaterKwh.v / FIG.kwhFood.v).toBeLessThan(0.36);
    // « nearly twice as much » (part-gas-bubble): 1.47 kWh against 0.75 kWh
    expect(FIG.kwhFood.v / FIG.kwhMarket.v).toBeGreaterThan(1.8);
    expect(FIG.kwhFood.v / FIG.kwhMarket.v).toBeLessThan(2);
    // « a tenth of a second » (intro, part-blue-flame): a cooked grain of rice, a few hundredths of a gram, an estimate of this script (README), at 32 minutes a kilo
    const GRAIN_KG = 0.06e-3;
    const seconds = FIG.minPerKgFood.v * 60 * GRAIN_KG;
    expect(seconds).toBeGreaterThan(0.05);
    expect(seconds).toBeLessThan(0.2);
    const tenth = { fr: /un dixième de seconde/, en: /a tenth of a second/ }[lang as Lang];
    expect(where(tenth)).toEqual(['intro', 'part-blue-flame']);
    // « at head height » (part-half-brick): the top of the bell at rest above the ground, on its pallet and pad, an arithmetic of this script on src/three/dims.ts
    const topAtRest = PLANT_1000.bellRestRim + PLANT_1000.bellHeight + PALLET.h + PAD.h;
    expect(topAtRest).toBeGreaterThan(1.5);
    expect(topAtRest).toBeLessThan(1.9);
    // « an hour a second » (scene-digester)
    expect(DEFAULT_TIME_SCALE).toBe(3600);
  });

  it('does not hang a hedge on every figure', () => {
    const inTheModel = { fr: /dans le modèle/i, en: /in the model/i }[lang as Lang];
    expect(where(inTheModel)).toEqual([]);
    const ours = {
      fr: /notre (modèle|simulation|estimation)|ce modèle/i,
      en: /our (model|simulation|estimate)|this model/i,
    }[lang as Lang];
    expect(where(ours).length).toBeLessThanOrEqual(20);
  });

  it('points to the controls the lab really has: the scenarios and the slider, in the panel’s own words', () => {
    const named: [keyof typeof SCENARIO_TEXTS, string[]][] = [
      ['geneva-january', ['intro']],
      ['geneva-heated', ['part-water-butt']],
      ['overfeed', ['scene-slurry', 'part-acid-makers', 'part-fatty-acid-pool']],
      ['water-in-hose', ['scene-gas-line']],
      ['flame-out', ['part-kitchen-valve']],
    ];
    for (const [id, segments] of named) {
      expect(where(new RegExp(`[Ss]c[ée]nario ${SCENARIO_TEXTS[id].name[i]}`)), id).toEqual(segments);
    }
    const slider = (LAB_STRINGS.sliderEa[i] as string).toLowerCase();
    expect(where(new RegExp(slider))).toEqual(['intro']);
  });

  it('shows the flame by a tool, and leaves the burner’s button to the listener', () => {
    // no cue can press `lightBurner`; `[[isolate:on]]` shows the flame, lit or not (gasline/scene.ts), as its sheet's tip says
    expect(gasLineSource).toMatch(/const alone = registry\.get\('blue-flame'\)!\.display === 'solid' && now\.isolated/);
    expect(gasLineSource).toMatch(/const on = s\.flameOn \|\| alone/);
    expect(seg('part-blue-flame').text.startsWith('[[isolate:on]]')).toBe(true);
    const button = {
      fr: /le bouton de cette fiche allume le brûleur/i,
      en: /the button on this sheet lights the burner/i,
    }[lang as Lang];
    expect(where(button)).toEqual(['part-blue-flame']);
  });

  it('follows one grain of rice through the machine, from the intro to the pot', () => {
    const grain = { fr: /notre grain|grain de riz/i, en: /our grain|grain of rice/i }[lang as Lang];
    const heard = where(grain);
    for (const id of [
      'intro',
      'scene-yard',
      'scene-digester',
      'scene-slurry',
      'scene-gas-line',
      'part-scrap-caddy',
      'part-dilution-bucket',
      'part-feed-funnel',
      'part-inner-feed-pipe',
      'part-sludge-bed',
      'part-food-particle',
      'part-hydrolysers',
      'part-methanogens',
      'part-gas-bubble',
      'part-bell-hose',
      'part-blue-flame',
      'part-cooking-pot',
    ])
      expect(heard, id).toContain(id);
  });

  it('is anonymous: no person, channel, company, brand, institution or series, in a text or a title; ARTI above all', () => {
    const names =
      /\barti\b|karve|lohri|vögeli|vogeli|gyalpo|\bdana\b|crowe|aidg|ashden|energypedia|low-?tech|nomade|eawag|sandec|zhaw|ardhi|woese|\bfox\b|deublein|steinhauser|ineris|pvgis|homebiogas|tipp-?ex|youtube|wikipedia|rhadereistedt|veeken|hamelers|pelton|il était une fois|once upon a time|maestro/i;
    for (const s of script.segments) expect(`${s.title} ${spokenOf(s)}`, s.id).not.toMatch(names);
  });

  it('names its sources by the lab’s six words only', () => {
    const words = {
      fr: [
        /la thèse/i,
        /le livre/i,
        /l’étude voisine/i,
        /le manuel de construction/i,
        /le tutoriel/i,
        /le guide français/i,
      ],
      en: [
        /the thesis/i,
        /the book/i,
        /the neighbouring study/i,
        /the build manual/i,
        /the tutorial/i,
        /the French guide/i,
      ],
    }[lang as Lang];
    for (const re of words) expect(where(re).length, String(re)).toBeGreaterThan(0);
  });

  it('is spoken text: no digit, symbol, abbreviation or straight quote, one space, no markdown', () => {
    for (const s of script.segments) {
      const spoken = spokenOf(s);
      expect(spoken, s.id).not.toMatch(/[*≈×Ø″%°²³₂_#<>/\\|†«»]|\d/);
      expect(spoken, s.id).not.toMatch(/\b(kWh|Wh|kW|mbar|ppm|pH|CO|H2S|CH4|CO2|mm|cm|km|kg|etc|3D)\b/);
      expect(spoken, s.id).not.toMatch(/['"]/);
      // a cue stands between two spaces (or at an edge), so that taking it out never glues two words together
      expect(s.text, s.id).not.toMatch(/ {2}|\n|^\s|\s$|\S\[\[|\]\]\S/);
      expect(spoken, s.id).not.toMatch(/\.\.(?!\.)|\.{3}/);
    }
  });

  it('avoids the words the local voice reads by their commonest sense', () => {
    const risky = {
      fr: /(?<!\p{L})(fils|couvent|content|portions|président|résident|négligent)(?!\p{L})/iu,
      en: /\b(wind|winds|wound|tear|tears|lead|leads|read|live|lives|close|closes|produce|content|record|present|object|refuse|separate|bow|row|sow|sewer|minute)\b/i,
    }[lang as Lang];
    expect(where(risky)).toEqual([]);
  });

  it('keeps the sentences short enough for the subtitles', () => {
    let over120 = 0;
    for (const s of script.segments) {
      for (const sentence of spokenOf(s).split(/(?<=[.!?…])\s+/)) {
        expect(sentence.length, `${s.id}: ${sentence.slice(0, 60)}`).toBeLessThanOrEqual(135);
        if (sentence.length > 120) over120++;
      }
    }
    expect(over120).toBeLessThanOrEqual(6);
  });

  it('marvels without gushing, and asks questions: exclamations and questions as in the style page', () => {
    const all = script.segments.map(spokenOf).join(' ');
    const per1000 = (re: RegExp): number => ((all.match(re) ?? []).length / all.length) * 1000;
    expect(per1000(/!/g)).toBeGreaterThanOrEqual(0.5);
    expect(per1000(/!/g)).toBeLessThanOrEqual(1);
    expect(per1000(/\?/g)).toBeGreaterThanOrEqual(0.25);
    expect(per1000(/\?/g)).toBeLessThanOrEqual(0.65);
  });

  it('speaks to the listener the way the series does: "vous", "on", never "tu"', () => {
    if (lang !== 'fr') return;
    const tu = /(?<!\p{L})(tu|ton|ta|tes|toi)(?!\p{L})/iu;
    for (const s of script.segments) expect(spokenOf(s), s.id).not.toMatch(tu);
  });

  it('writes British English', () => {
    if (lang !== 'en') return;
    for (const s of script.segments)
      expect(`${s.title} ${spokenOf(s)}`, s.id).not.toMatch(
        /\b(color\w*|center\w*|liter\w*|fiber\w*|neighbor\w*|gray|meters|kilometers|centimeters|millimeters|aluminum|labor|faucet|gallons?|inches|sulfur\w*|sulfide)\b/i,
      );
  });

  it('stays within the budget, the aim and what the generator accepts', () => {
    const lengths = script.segments.map((s) => spokenOf(s).length);
    const total = lengths.reduce((n, l) => n + l, 0);
    expect(total).toBeLessThanOrEqual(BUDGET);
    expect(total).toBeGreaterThanOrEqual(AIM[0]);
    expect(total).toBeLessThanOrEqual(AIM[1]);
    expect(Math.max(...lengths)).toBeLessThanOrEqual(SEGMENT_CAP);
  });
});

describe.each(Object.keys(manifests))('narration audio %s', (lang) => {
  const { manifest, problems } = readManifest(manifests[lang]);

  it('is a usable manifest that agrees with the lab, in the local voice', () => {
    expect(problems).toEqual([]);
    expect(manifest).not.toBeNull();
    expect(validateManifest(manifest!, { scenes: sceneIds, parts: partIds })).toEqual([]);
    expect((manifests[lang] as { model?: string }).model).toBe(LOCAL_VOICE);
  });

  it('has an audio file for every segment and none without a segment', () => {
    const files = audioFiles.filter((f) => f.includes(`/audio/${lang}/`)).map((f) => f.split('/').pop());
    expect(files.sort()).toEqual(manifest!.segments.map((s) => s.file).sort());
  });

  it('is the audio of the script of the same language', () => {
    const script = scripts[lang];
    if (!script) return;
    expect(manifest!.segments.map((s) => s.id).sort()).toEqual(script.segments.map((s) => s.id).sort());
  });
});

describe('the voice points at what can be seen', () => {
  // A cue as the kit flies it (`Stage.frameParts`, `framePadding` of the narration), with no canvas: one part from its own `viewDir`, several parts or a part with none from where the camera
  // already is, so a view direction given to a part also moves the camera of the cues after it. Distances are those of a wide view, the dock of the narration down. The rays are those of the
  // solar heater's test, on the default machine in the state the simulation opens on: points sampled inside the triangles, and instanced meshes among what stands in the way.
  type Module = SceneModule<BioState>;
  const SIN_FIT = Math.sin((20 * Math.PI) / 180);
  const params = presetParams('plant-1000');
  const homeDir = (m: Module): THREE.Vector3 => m.home.position.clone().sub(m.home.target).normalize();
  const distance = (mod: Module, box: THREE.Box3, padding: number): number =>
    Math.min(
      mod.maxDistance,
      Math.max(mod.minDistance, (box.getBoundingSphere(new THREE.Sphere()).radius * padding) / SIN_FIT),
    );
  const shown = (o: THREE.Object3D): boolean => {
    for (let q: THREE.Object3D | null = o; q; q = q.parent) if (!q.visible) return false;
    return true;
  };
  const worlds = (() => {
    const made: Partial<Record<string, Module>> = {};
    return (id: string): Module => {
      if (!made[id]) {
        const make: Record<string, () => Module> = {
          yard: () => createYardScene(() => params),
          digester: () => createDigesterScene(() => params),
          slurry: () => createDropScene(),
          'gas-line': () => createGasLineScene(() => params),
        };
        made[id] = make[id]!();
      }
      return made[id]!;
    };
  })();
  const state = stateWith({}, 0.2);

  /** Points on the part: inside its triangles, inside its frame box if it has one. A fixed generator: a stride falls in step with a mesh's rings. */
  const pointsOn = (mod: Module, id: string): THREE.Vector3[] => {
    const part = mod.registry.get(id)!;
    const box = part.frame ? mod.registry.frameBounds(id) : null;
    const near = box?.getBoundingSphere(new THREE.Sphere());
    if (near) near.radius *= 1.5;
    const out: THREE.Vector3[] = [];
    const aside: THREE.Vector3[] = [];
    const inst = new THREE.Matrix4();
    const [a, b, c] = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    let seed = 777;
    const next = (): number => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 2 ** 32;
    };
    for (const m of part.meshes) {
      if (!shown(m)) continue;
      const pos = m.geometry.attributes.position as THREE.BufferAttribute | undefined;
      if (!pos || pos.count === 0) continue;
      const index = m.geometry.index;
      const many = m as THREE.Mesh & {
        isInstancedMesh?: boolean;
        count?: number;
        getMatrixAt?(i: number, to: THREE.Matrix4): void;
      };
      const triangles = (index ? index.count : pos.count) / 3;
      let found = 0;
      for (let draw = 0; draw < 4000 && found < 200; draw++) {
        if (many.isInstancedMesh) many.getMatrixAt!(Math.floor(next() * many.count!), inst);
        const k = Math.floor(next() * triangles) * 3;
        const at = (n: number): number => (index ? index.getX(k + n) : k + n);
        a.fromBufferAttribute(pos, at(0));
        b.fromBufferAttribute(pos, at(1));
        c.fromBufferAttribute(pos, at(2));
        const [u, v] = [next(), next()];
        const [s, w] = u + v > 1 ? [1 - u, 1 - v] : [u, v];
        const p = a
          .clone()
          .multiplyScalar(1 - s - w)
          .addScaledVector(b, s)
          .addScaledVector(c, w);
        if (many.isInstancedMesh) p.applyMatrix4(inst);
        p.applyMatrix4(m.matrixWorld);
        if (!box || box.containsPoint(p)) {
          out.push(p);
          found++;
        } else if (near && p.distanceTo(near.center) <= near.radius) {
          aside.push(p);
        }
      }
    }
    return out.length ? out : aside;
  };

  /** The share of the rays from the eye that reach the part. */
  const seen = (mod: Module, id: string, eye: THREE.Vector3): number => {
    const part = mod.registry.get(id)!;
    const points = pointsOn(mod, id);
    const own = new Set<THREE.Object3D>(part.meshes);
    const rc = new THREE.Raycaster();
    let seed = 12345;
    let arrive = 0;
    const count = Math.min(points.length, 48);
    for (let k = 0; k < count; k++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const point = points[points.length <= 48 ? k : Math.floor((seed / 2 ** 32) * points.length)]!;
      const dir = point.clone().sub(eye);
      const far = dir.length();
      rc.set(eye, dir.normalize());
      rc.far = far + 0.05;
      const hit = rc.intersectObjects(mod.scene.children, true).find((h) => {
        const o = h.object as THREE.Mesh;
        const mat = o.material as THREE.Material | undefined;
        // as `raysToPart` of test-utils.ts: what is transparent stands in the way of nothing, and the drop's surface is one of those
        return o.isMesh && shown(o) && !mat?.transparent;
      });
      if (!hit || own.has(hit.object) || hit.distance >= far - 0.02) arrive++;
    }
    return count ? arrive / count : 0;
  };

  /**
   * A closed solid shows at most half its surface to one eye: 0.5 is out of reach for these, and each is near it (0.42 to 0.48 when written). Named one by one, each to confirm by eye (README, « what only a look can confirm »).
   */
  const LOWER: Record<string, number> = {
    'gas-bell': 0.4,
    'gas-space': 0.4,
    'rim-gap': 0.4,
    'scum-layer': 0.4,
    'biogas-burner': 0.4,
    'blue-flame': 0.4,
  };
  /** The tree stands 7.4 m: framed whole, its view is a little wider than the yard's home. */
  const WIDER: Record<string, number> = { 'shade-tree': 1.1 };

  it.each(['intro', 'scene-yard', 'scene-digester', 'scene-slurry', 'scene-gas-line'])(
    '%s: each part is seen, from no farther than home',
    (id) => {
      const segment = scripts.fr!.segments.find((s) => s.id === id)!;
      let world = segment.scene;
      let dir = homeDir(worlds(world));
      let cutaway = false;
      const cues = [...segment.text.matchAll(CUE)];
      cues.forEach((m, c) => {
        const [, name = '', arg = ''] = m;
        if (name === 'scene' && arg !== world) {
          world = arg;
          cutaway = false;
          dir = homeDir(worlds(world));
        }
        const mod = worlds(world);
        if (name === 'home') dir = homeDir(mod);
        if (name === 'cutaway') cutaway = arg === 'on';
        if (name !== 'frame') return;
        // cues that fall together run as one batch, and the camera measures after them
        const next = cues[c + 1];
        const together = next && !segment.text.slice(m.index + m[0].length, next.index).trim();
        const cut = cutaway || (together && next![1] === 'cutaway' && next![2] === 'on');
        mod.registry.setAllDisplay('solid');
        mod.update(state, 1 / 60, view({ cutaway: !!cut }));
        mod.scene.updateMatrixWorld(true);
        const ids = arg.split(',');
        const box = new THREE.Box3();
        for (const part of ids) box.union(mod.registry.frameBounds(part));
        const own = ids.length === 1 ? mod.registry.get(ids[0]!)?.viewDir : undefined;
        dir = (own ?? dir).clone().normalize();
        const padding = Math.min(WORLD[world as WorldId].partPadding, ids.length > 1 ? 1.5 : 1.9);
        const far = distance(mod, box, padding);
        const eye = box.getCenter(new THREE.Vector3()).addScaledVector(dir, far);
        for (const part of ids) {
          expect(seen(mod, part, eye), `${id}: ${part}`).toBeGreaterThanOrEqual(LOWER[part] ?? 0.5);
        }
        const whole = new THREE.Box3();
        for (const part of mod.registry.ids()) whole.union(mod.registry.bounds(part));
        expect(far, `${id}: ${arg}`).toBeLessThanOrEqual(
          distance(mod, whole, mod.homePadding ?? 0.82) * (WIDER[arg] ?? 1),
        );
      });
      for (const w of sceneIds) worlds(w).registry.setAllDisplay('solid');
    },
    120_000,
  );

  it.each(partIds)(
    'part %s: seen from its own framing, with what its segment switches on as it starts',
    (id) => {
      const segment = scripts.fr!.segments.find((s) => s.id === `part-${id}`)!;
      const mod = worlds(segment.scene);
      const opening = /^(?:\[\[[a-z]+(?::[^\]]*)?\]\] ?)*/.exec(segment.text)![0];
      const isolate = opening.includes('[[isolate:on]]');
      const cutaway = opening.includes('[[cutaway:on]]');
      for (const part of mod.registry.ids()) mod.registry.setDisplay(part, isolate && part !== id ? 'hidden' : 'solid');
      mod.update(state, 1 / 60, view({ cutaway }));
      mod.scene.updateMatrixWorld(true);
      const box = mod.registry.frameBounds(id);
      const dir = (mod.registry.get(id)!.viewDir ?? homeDir(mod)).clone().normalize();
      const far = distance(mod, box, Math.min(WORLD[segment.scene as WorldId].partPadding, 1.9));
      const eye = box.getCenter(new THREE.Vector3()).addScaledVector(dir, far);
      expect(seen(mod, id, eye), id).toBeGreaterThanOrEqual(LOWER[id] ?? 0.5);
      mod.registry.setAllDisplay('solid');
      mod.update(state, 1 / 60, view());
    },
    60_000,
  );

  it('asks for the section only from where its cut can be read: from above', () => {
    // the section tool cuts `digester` across, at the overflow's height (docs/3d.md §1): the home view sees it at a low angle, and `rim-gap` frames it from 48° up
    for (const lang of ['fr', 'en']) {
      for (const s of scripts[lang]!.segments) {
        if (!s.text.includes('[[cutaway:on]]')) continue;
        const mod = worlds(s.scene);
        let dir = s.scope.startsWith('part:')
          ? (mod.registry.get(s.scope.slice(5))!.viewDir ?? homeDir(mod)).clone().normalize()
          : homeDir(mod);
        for (const [, name = '', arg = ''] of s.text.matchAll(CUE)) {
          if (name === 'home') dir = homeDir(mod);
          if (name === 'frame') {
            const ids = arg.split(',');
            const own = ids.length === 1 ? mod.registry.get(ids[0]!)?.viewDir : undefined;
            dir = (own ?? dir).clone().normalize();
          }
          if (name === 'cutaway' && arg === 'on')
            expect(dir.y, `${lang} ${s.id}: section seen edge on`).toBeGreaterThan(0.5);
        }
      }
    }
  });
});

describe('the private transcripts', () => {
  // Transcripts of third-party videos stay private, in ~/.cache/lab-review/research/biodigester-lab/. When they are present, no run of seven words of a script may be copied from them (they only serve to
  // check facts). Today none exists: nobody has watched S1 or S2, so this is skipped. It is here for the day they do.
  const words = (t: string): string[] =>
    t
      .toLowerCase()
      .replace(/’/g, "'")
      .replace(/[^a-zàâäçéèêëîïôöùûüÿœ0-9' ]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  const grams = (w: string[], n: number): string[] =>
    Array.from({ length: Math.max(0, w.length - n + 1) }, (_, i) => w.slice(i, i + n).join(' '));
  /** Only what was said: no WebVTT or SubRip header, no timing line, no inline tag, and rolling captions counted once. */
  const captions = (raw: string): string =>
    raw
      .split('\n')
      .filter((line) => !/^WEBVTT|^Kind:|^Language:|-->|^\d+$/.test(line.trim()))
      .map((line) => line.replace(/<[^>]*>/g, '').trim())
      .filter((line, i, all) => line && line !== all[i - 1])
      .join(' ');
  /** The cache is outside the repository, so it is read at run time; this repo has no Node types, hence the narrow one here. */
  interface Files {
    existsSync(path: string): boolean;
    readdirSync(path: string): string[];
    readFileSync(path: string, encoding: 'utf8'): string;
  }
  const inCache = async (): Promise<string[]> => {
    const home = (globalThis as unknown as { process?: { env: Record<string, string | undefined> } }).process?.env.HOME;
    if (!home) return [];
    const fs = (await import(/* @vite-ignore */ `node:${'fs'}`)) as Files;
    const root = `${home}/.cache/lab-review/research/biodigester-lab`;
    if (!fs.existsSync(root)) return [];
    const out: string[] = [];
    for (const dir of [root, `${root}/whisper`, `${root}/whisper-tiny`, `${root}/audio`]) {
      if (!fs.existsSync(dir)) continue;
      for (const f of fs.readdirSync(dir))
        if (/\.(srt|vtt|txt|description)$/.test(f)) out.push(fs.readFileSync(`${dir}/${f}`, 'utf8'));
    }
    return out;
  };

  it('copies no seven-word run of the captions', async (ctx) => {
    const transcripts = await inCache();
    if (transcripts.length === 0) ctx.skip();
    const source = new Set(transcripts.flatMap((t) => grams(words(captions(t)), 7)));
    const copied = Object.entries(scripts).flatMap(([lang, script]) =>
      script.segments.flatMap((s) =>
        grams(words(spokenOf(s)), 7)
          .filter((g) => source.has(g))
          .map((g) => `${lang}/${s.id}: "${g}"`),
      ),
    );
    expect(copied).toEqual([]);
  });
});

describe('narration scripts agree between languages', () => {
  const cues = (text: string) => [...text.matchAll(CUE)].map((m) => m[0]);

  it('have the same segments and the same cues in the same order', () => {
    const [fr, en] = [scripts.fr!, scripts.en!];
    expect(en.segments.map((s) => [s.id, s.scope, s.scene])).toEqual(fr.segments.map((s) => [s.id, s.scope, s.scene]));
    for (const s of fr.segments) expect(cues(en.segments.find((x) => x.id === s.id)!.text), s.id).toEqual(cues(s.text));
  });

  it('put the cues at the same place in the sentence (within a tenth of the segment)', () => {
    const [fr, en] = [scripts.fr!, scripts.en!];
    const share = (s: Segment): number[] => {
      const total = spokenOf(s).length || 1;
      return [...s.text.matchAll(CUE)].map((m) => spokenOf({ text: s.text.slice(0, m.index) }).length / total);
    };
    for (const s of fr.segments) {
      const [a, b] = [share(s), share(en.segments.find((x) => x.id === s.id)!)];
      a.forEach((x, i) => expect(Math.abs(x - b[i]!), `${s.id}: cue ${i}`).toBeLessThanOrEqual(0.1));
    }
  });
});
