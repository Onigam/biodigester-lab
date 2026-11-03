import {
  fill,
  h,
  icon,
  ICONS,
  LineChart,
  SERIES_COLORS,
  section as kitSection,
  select as kitSelect,
  slider as kitSlider,
  toggle as kitToggle,
  type AppContext,
  type PanelController,
} from '@onigam/lab-kit/ui';
import { t, type UiKey } from '../i18n/ui';
import { SITE_IDS, type SiteId } from '../sim/climate';
import type { BiodigesterSim } from '../sim/engine';
import { PRESET_IDS, RANGES, SCENARIO_IDS, type RangedKey } from '../sim/presets';
import type { BioParams, BurnerMode, PresetId, ScenarioId } from '../sim/types';
import { mainReadouts, moreReadouts, niceCeil3, statusOf, type Readout } from './model';
import { months, num, st, sx, type PanelKey } from './strings';

// Simulation mode: starting points and scenarios, what is happening now, the settings the sheets and lessons name, the charts, and the rest folded. Built only from the kit's widgets and charts.

/** The air's dashed line, a reference: the same grey as the other labs', readable on both cards, which a canvas cannot read from a token. */
const AIR_LINE = '#78838d';
/** The scenario whose lesson asks to move the activation energy. */
const SLIDER_SCENARIO: ScenarioId = 'geneva-january';

interface Control {
  key: keyof BioParams;
  el: HTMLElement;
  kind: 'slider' | 'toggle' | 'select';
  fmt?: (v: number) => string;
}

export class SimPanel implements PanelController {
  readonly el = h('div', { class: 'sim' });
  private presetSelect: HTMLSelectElement | null = null;
  private lesson = h('div', {});
  private status = h('div', {});
  private readouts = h('div', { class: 'readouts' });
  private more = h('div', { class: 'loss-legend' });
  private drawnHint = h('div', {});
  private siteHint = h('div', {});
  private chartMarks: HTMLElement[] = [];
  private controls: Control[] = [];
  private shownScenario: ScenarioId | null = null;
  private lastReadouts = 0;
  private lastLive = 0;

  private bellChart: LineChart;
  private gasChart: LineChart;
  private phChart: LineChart;
  private acidChart: LineChart;
  private tempChart: LineChart;
  private bellOpts: ConstructorParameters<typeof LineChart>[0];
  private gasOpts: ConstructorParameters<typeof LineChart>[0];
  private acidOpts: ConstructorParameters<typeof LineChart>[0];
  private tempOpts: ConstructorParameters<typeof LineChart>[0];

  constructor(private ctx: AppContext<BiodigesterSim>) {
    const plain = (v: number) => num(v);
    const days = (v: number) => (v === 0 ? '0' : `${num(v, v < 2 ? 1 : 0)} ${st('unitDays')}`);
    this.bellOpts = {
      height: 120,
      series: [{ key: 'bell', label: () => st('seriesBell'), color: SERIES_COLORS.hydro, bold: true }],
      yMin: 0,
      yFmt: plain,
      xFmt: days,
      legend: false,
    };
    this.bellChart = new LineChart(this.bellOpts);
    this.gasOpts = {
      height: 120,
      series: [
        { key: 'in', label: () => st('seriesIn'), color: SERIES_COLORS.load, bold: true },
        { key: 'burnt', label: () => st('seriesBurnt'), color: SERIES_COLORS.dump },
      ],
      yMin: 0,
      yFmt: plain,
      xFmt: days,
    };
    this.gasChart = new LineChart(this.gasOpts);
    this.phChart = new LineChart({
      height: 110,
      series: [{ key: 'pH', label: () => st('seriesPH'), color: SERIES_COLORS.dump, bold: true }],
      yMin: 3,
      yMax: 9,
      yFmt: plain,
      xFmt: days,
      legend: false,
    });
    this.acidOpts = {
      height: 110,
      series: [{ key: 'acids', label: () => st('seriesAcids'), color: SERIES_COLORS.dump, bold: true }],
      yMin: 0,
      yFmt: (v) => num(v, v < 3 ? 1 : 0),
      xFmt: days,
      legend: false,
    };
    this.acidChart = new LineChart(this.acidOpts);
    this.tempOpts = {
      height: 120,
      series: [
        { key: 'tank', label: () => st('seriesTank'), color: SERIES_COLORS.dump, bold: true },
        { key: 'air', label: () => st('seriesAir'), color: AIR_LINE, dash: true },
      ],
      yFmt: plain,
      xFmt: days,
    };
    this.tempChart = new LineChart(this.tempOpts);
  }

  /** Apply a change live: the panel is not rebuilt, so the dragged input survives. */
  private set(patch: Partial<BioParams>): void {
    this.ctx.sim.set(patch);
    this.renderStatus();
    this.renderReadouts();
  }

  render(): void {
    const sim = this.ctx.sim;
    const p = sim.params;
    this.controls = [];
    this.chartMarks = [];
    this.shownScenario = sim.scenarioNow;

    const presetSelect = h(
      'select',
      {
        'aria-label': st('preset'),
        onchange: (ev: Event) => {
          sim.applyPreset((ev.target as HTMLSelectElement).value as PresetId);
          this.render();
        },
      },
      ...PRESET_IDS.map((id) => h('option', { value: id, selected: p.preset === id }, sx('preset', id))),
      h('option', { value: 'custom', selected: p.preset === 'custom', disabled: true }, st('custom')),
    );
    this.presetSelect = presetSelect;

    const track = (key: keyof BioParams, el: HTMLElement, kind: Control['kind'], fmt?: (v: number) => string) => {
      this.controls.push({ key, el, kind, fmt });
      return el;
    };
    const slider = (label: PanelKey | UiKey, field: RangedKey, fmt: (v: number) => string) => {
      const r = RANGES[field];
      return track(
        field,
        kitSlider(words(label), p[field] as number, r.min, r.max, r.step, fmt, (v) =>
          this.set({ [field]: v } as Partial<BioParams>),
        ),
        'slider',
        fmt,
      );
    };
    const hint = (key: PanelKey | 'tagNote') => h('p', { class: 'hint' }, st(key));
    const folded = (title: string, ...children: (HTMLElement | null)[]) => {
      const d = kitSection(title, ...children) as HTMLDetailsElement;
      d.open = false;
      return d;
    };
    const chartTitle = (key: PanelKey, unit: string) => {
      const mark = h('small', {}, ` ${sim.state.figureTag}`);
      this.chartMarks.push(mark);
      // the eyebrow's capitals would turn g/L into G/L
      const units = unit ? [h('span', { style: 'text-transform:none' }, ` (${unit})`)] : [];
      return h('div', { class: 'eyebrow' }, st(key), ...units, mark);
    };
    const pctOf = (v: number) => `${num(100 * v)} %`;
    const eaFmt = (v: number) => `${num(v / 1000)} kJ/mol *`;
    const scenario = sim.scenarioNow;

    fill(
      this.el,
      h('div', { class: 'eyebrow eyebrow--accent' }, st('simTitle')),
      hint('simIntro'),
      hint('tagNote'),
      h(
        'div',
        { class: 'sim-top' },
        presetSelect,
        h(
          'button',
          {
            class: 'btn',
            'aria-label': st('resetSim'),
            title: st('resetSim'),
            onclick: () => (sim.reset(), this.render()),
          },
          icon(ICONS.reset, 16),
        ),
      ),
      this.drawnHint,
      h('div', { class: 'eyebrow' }, st('scenarios')),
      h(
        'div',
        { class: 'part-chips' },
        ...SCENARIO_IDS.map((id) =>
          h(
            'button',
            {
              class: 'part-chip',
              onclick: () => {
                sim.applyScenario(id);
                this.render();
              },
            },
            sx('scenario', id),
          ),
        ),
      ),
      this.lesson,
      // the Geneva scenario turns on this one figure, so its slider stands beside its words. Each setting starts the same plant's history again, from April: the question is how it would have lived at this Ea
      ...(scenario === SLIDER_SCENARIO
        ? [
            track(
              'Ea',
              kitSlider(t('sliderEa'), p.Ea, RANGES.Ea.min, RANGES.Ea.max, RANGES.Ea.step, eaFmt, (v) => {
                sim.applyScenario(SLIDER_SCENARIO, { Ea: v });
                this.renderStatus();
                this.renderReadouts();
              }),
              'slider',
              eaFmt,
            ),
            h('p', { class: 'hint' }, t('eaHint')),
          ]
        : []),
      this.status,
      this.readouts,
      h(
        'div',
        { class: 'part-chips' },
        h('button', { class: 'part-chip', onclick: () => sim.feedNow() }, st('feedNow')),
        h('button', { class: 'part-chip', onclick: () => sim.lightBurner() }, t('lightBurner')),
        h('button', { class: 'part-chip', onclick: () => sim.shutBurner() }, st('shutBurner')),
      ),
      hint('speedHint'),

      h('div', { class: 'eyebrow' }, st('secFood')),
      slider('sliderFeed', 'feedKg', (v) => `${num(v, 1)} ${st('unitKgDay')}`),
      slider('sliderCooked', 'shareCooked', (v) => `${num(v)} %`),
      slider('sliderWater', 'waterPerKg', (v) => `${num(v, 1)} ${st('unitLitresKg')}`),
      slider('flush', 'flushWater', (v) => `${num(v)} ${st('unitLitresDay')}`),
      hint('flushHint'),

      h('div', { class: 'eyebrow' }, st('secKitchen')),
      slider('sliderMinutes', 'cookMinutes', (v) => `${num(v)} min`),
      track(
        'burner',
        kitSelect<BurnerMode>(
          st('burner'),
          p.burner,
          (['meals', 'on', 'off'] as const).map((id) => [id, sx('burner', id)] as [BurnerMode, string]),
          (v) => this.set({ burner: v }),
        ),
        'select',
      ),
      slider('sliderBurner', 'burnerLph', (v) => `${num(v)} L/h`),
      track(
        'trap',
        kitToggle(t('toggleTrap'), p.trap, (v) => this.set({ trap: v })),
        'toggle',
      ),

      h('div', { class: 'eyebrow' }, st('secBell')),
      slider('sliderWeight', 'addedWeight', (v) => `${num(v)} kg`),
      slider('sliderRim', 'rimLoss', pctOf),

      h('div', { class: 'eyebrow' }, st('secPlace')),
      track(
        'site',
        kitSelect<SiteId>(
          st('site'),
          p.site,
          SITE_IDS.map((id) => [id, sx('site', id)] as [SiteId, string]),
          (v) => this.set({ site: v }),
        ),
        'select',
      ),
      this.siteHint,
      slider('month', 'month', (v) => months()[v - 1] ?? ''),
      track(
        'seasons',
        kitToggle(st('seasons'), p.seasons, (v) => this.set({ seasons: v })),
        'toggle',
      ),
      slider('sliderSun', 'sunHours', (v) => `${num(v, 1)} ${st('unitHours')}`),

      chartTitle('chartBell', 'L'),
      this.bellChart.el,
      chartTitle('chartGas', 'L/h'),
      this.gasChart.el,
      chartTitle('chartPH', ''),
      this.phChart.el,
      chartTitle('chartAcids', 'g/L'),
      this.acidChart.el,
      chartTitle('chartTemps', '°C'),
      this.tempChart.el,
      hint('chartsHint'),

      folded(
        st('secHeat'),
        slider('wallU', 'wallU', (v) => `${num(v, 2)} W/m²·K`),
        hint('wallHint'),
        slider('heater', 'heaterW', (v) => `${num(v)} W`),
        slider('setPoint', 'setPointT', (v) => `${num(v)} °C`),
      ),
      folded(
        st('secEstimates'),
        ...(scenario === SLIDER_SCENARIO ? [] : [slider('sliderEa', 'Ea', eaFmt)]),
        slider('kFast', 'kFast', (v) => `${num(v, 2)} ${st('unitPerDay')} *`),
        slider('kSlow', 'kSlow', (v) => `${num(v, 3)} ${st('unitPerDay')} *`),
        slider('solids', 'solidsRetention', (v) => `${num(v, 1)} × †`),
        slider('bellWall', 'bellWall', (v) => `${num(v * 1000, 1)} mm *`),
        slider('hoseSlope', 'hoseSlope', (v) => `${num(v, 1)} % *`),
        slider('hoseWater', 'hoseWater', (v) => `${num(v)} mL *`),
        slider('burnerExponent', 'burnerExponent', (v) => num(v, 2)),
        hint('exponentHint'),
        hint('estimatesHint'),
      ),
      folded(st('moreTitle'), this.more),
    );
    this.renderLesson();
    this.refresh();
  }

  /** Called every frame while the panel is open: figures at 5 Hz, charts at 2 Hz. */
  tick(dt: number): void {
    this.lastReadouts += dt;
    this.lastLive += dt;
    // a lesson or the spoken guide can start a scenario from outside
    if (this.ctx.sim.scenarioNow !== this.shownScenario) {
      this.render();
      return;
    }
    if (this.lastReadouts > 0.2) {
      this.lastReadouts = 0;
      this.renderStatus();
      this.renderReadouts();
      this.followScript();
    }
    if (this.lastLive > 0.5) {
      this.lastLive = 0;
      this.drawCharts();
    }
  }

  private refresh(): void {
    this.renderStatus();
    this.renderReadouts();
    this.drawCharts();
  }

  private renderLesson(): void {
    const id = this.ctx.sim.scenarioNow;
    if (id) {
      fill(
        this.lesson,
        // the callout's own `b` is a narrow column for one word: the name stays in the running text
        h(
          'div',
          { class: 'callout callout--tip' },
          h('span', {}, h('strong', {}, sx('scenario', id)), '. ', sx('lesson', id)),
        ),
      );
    } else fill(this.lesson, h('p', { class: 'hint' }, st('scenarioHint')));
  }

  private renderStatus(): void {
    const sim = this.ctx.sim;
    const s = sim.state;
    if (this.presetSelect && this.presetSelect.value !== sim.params.preset) this.presetSelect.value = sim.params.preset;
    const status = statusOf(s);
    const text = 'text' in status ? status.text : st(status.key);
    fill(
      this.status,
      status.tone === 'warn'
        ? h('div', { class: 'callout callout--warn' }, icon(ICONS.warn, 16), h('span', {}, text))
        : h('p', { class: 'hint' }, text),
    );
    // said only when it applies: the 3D stays this machine and this yard
    fill(this.drawnHint, ...(s.onDrawnMachine ? [] : [h('p', { class: 'hint' }, t('drawnHint'))]));
    fill(this.siteHint, ...(s.siteMeasured ? [] : [h('p', { class: 'hint' }, t('siteHint'))]));
    for (const mark of this.chartMarks) mark.textContent = ` ${s.figureTag}`;
  }

  private renderReadouts(): void {
    const s = this.ctx.sim.state;
    const unit = (r: Readout) => (isPanelUnit(r.unit) ? st(r.unit) : r.unit);
    const small = (r: Readout) =>
      h(
        'small',
        {},
        [unit(r), r.mark]
          .filter(Boolean)
          .join(' ')
          .replace(/^(?=.)/, ' '),
      );
    fill(
      this.readouts,
      ...mainReadouts(s).map((r) =>
        h('div', { class: 'readout' }, h('span', {}, st(r.key)), h('b', {}, num(r.value, r.digits), small(r))),
      ),
    );
    fill(
      this.more,
      ...moreReadouts(s).map((r) => h('span', {}, `${st(r.key)} `, h('b', {}, num(r.value, r.digits)), small(r))),
      // not a number here: the only instrument that read it stopped at its ceiling
      h('span', {}, `${st('moreH2S')} `, h('b', {}, st('moreUnknown'))),
    );
  }

  /** A scenario can move a slider or flip a switch by itself: the controls follow. With the seasons on, the month is the clock's. */
  private followScript(): void {
    const sim = this.ctx.sim;
    const p = sim.params;
    for (const c of this.controls) {
      const value = c.key === 'month' && p.seasons ? sim.state.month : p[c.key];
      if (c.kind === 'select') {
        const sel = c.el.querySelector('select') as HTMLSelectElement | null;
        if (sel && sel.value !== String(value)) sel.value = String(value);
        continue;
      }
      const input = c.el.querySelector('input') as HTMLInputElement | null;
      if (!input) continue;
      if (c.kind === 'toggle') {
        if (input.checked !== value) input.checked = Boolean(value);
      } else if (typeof value === 'number' && Math.abs(Number(input.value) - value) > 1e-9) {
        input.value = String(value);
        const out = c.el.querySelector('output');
        if (out && c.fmt) out.textContent = c.fmt(value);
      }
    }
  }

  private drawCharts(): void {
    const sc = this.ctx.sim.scope;
    this.bellOpts.yMax = niceCeil3(Math.max(100, ...sc.bellLitres) * 1.05);
    this.bellChart.setData(sc.t, { bell: sc.bellLitres });
    this.bellChart.draw();
    this.gasOpts.yMax = niceCeil3(Math.max(10, ...sc.gasLph, ...sc.flame) * 1.05);
    this.gasChart.setData(sc.t, { in: sc.gasLph, burnt: sc.flame });
    this.gasChart.draw();
    this.phChart.setData(sc.t, { pH: sc.pH });
    this.phChart.draw();
    this.acidOpts.yMax = niceCeil3(Math.max(0.3, ...sc.acids) * 1.05);
    this.acidChart.setData(sc.t, { acids: sc.acids });
    this.acidChart.draw();
    const all = [...sc.slurryT, ...sc.airT];
    const low = all.length ? Math.floor(Math.min(...all) / 10) * 10 : 0;
    this.tempOpts.yMin = low;
    this.tempOpts.yMax = low + niceCeil3(Math.max(all.length ? Math.max(...all) - low : 30, 3) * 1.05);
    this.tempChart.setData(sc.t, { tank: sc.slurryT, air: sc.airT });
    this.tempChart.draw();
  }
}

const PANEL_UNITS = new Set<string>(['unitLoad', 'unitDays']);
const isPanelUnit = (u: string): u is PanelKey => PANEL_UNITS.has(u);

/** A control's label: the words the sheets quote are in src/i18n/ui.ts, the panel's own in strings.ts. Both are registered with the kit. */
const words = (key: PanelKey | UiKey): string => t(key as UiKey);
