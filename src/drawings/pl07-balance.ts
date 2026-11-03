import { COLORS, Drawing, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { lf } from '../data/part-helpers';
import { box, cat, fig, FILL, grid, heading, marksLegend, note } from './draw';

// PL-B07: the mass balance: 2 kg and 18 L in, gas, effluent and sludge out, what was measured beside what the model gives. Where it does not retrieve a figure, the cell says so.

export const ITEMS = [
  'biogas-plant',
  'clear-liquor',
  'sludge-bed',
  'scum-layer',
  'overflow-bucket',
  'food-particle',
] as const;

/** Three bars for one sentence: the same 2 kg, by the designer's count and by the scale. */
function bars(d: Drawing, x: number, y: number): void {
  const p = d.paper();
  const k = 0.24;
  const rows: { name: L; g: number; label: L; fill: string }[] = [
    {
      name: l('Selon le concepteur, sec', 'By the designer, dry'),
      g: 500,
      label: l('environ 500 g', 'about 500 g'),
      fill: FILL.cold,
    },
    { name: l('Thèse, humide, recueilli', 'Thesis, wet, caught'), g: 105, label: fig('methaneWet'), fill: FILL.hot },
    { name: l('Modèle, humide', 'Model, wet'), g: 98, label: fig('methaneModel'), fill: FILL.hot },
    { name: l('Thèse, épluchures', 'Thesis, peelings'), g: 54, label: fig('methaneMarket'), fill: FILL.green },
  ];
  rows.forEach((r, i) => {
    const yy = y + i * 12;
    p.text([x, yy + 4], r.name, { size: 1.85, baseline: 'middle' });
    p.rect([x + 46, yy], [x + 46 + r.g * k, yy + 8], { w: W.thin, fill: r.fill });
    p.text([x + 48 + r.g * k, yy + 4], r.label, { size: 1.85, baseline: 'middle', mono: true });
  });
}

function flow(d: Drawing): void {
  const p = d.paper();
  const arrow = (x0: number, y0: number, x1: number, y1: number): void => {
    p.line([x0, y0], [x1, y1], { w: W.medium, color: COLORS.copper });
    const a = Math.atan2(y1 - y0, x1 - x0);
    p.polyline(
      [
        [x1 - 2 * Math.cos(a) - Math.sin(a), y1 - 2 * Math.sin(a) + Math.cos(a)],
        [x1, y1],
        [x1 - 2 * Math.cos(a) + Math.sin(a), y1 - 2 * Math.sin(a) - Math.cos(a)],
      ],
      { w: W.medium, color: COLORS.copper },
    );
  };
  box(d, 16, 26, 44, 20, l('Restes de cuisine', 'Kitchen leftovers'), { fill: FILL.green, sub: '2 kg', size: 1.95 });
  box(d, 16, 52, 44, 20, l('Eau', 'Water'), { fill: FILL.cold, sub: '18 L', size: 1.95 });
  box(d, 86, 30, 66, 38, l('Cuve, environ 850 L', 'Tank, about 850 L'), {
    fill: FILL.liquor,
    sub: l('42,5 jours', '42.5 days'),
    size: 2.2,
  });
  arrow(60, 36, 86, 42);
  arrow(60, 62, 86, 56);
  box(d, 178, 20, 60, 19, l('Gaz recueilli', 'Gas caught'), { fill: FILL.gas, sub: l('289 L', '289 L'), size: 1.95 });
  box(d, 178, 41, 60, 16, l('Effluent', 'Effluent'), {
    fill: FILL.cold,
    sub: l('environ 20 L', 'about 20 L'),
    size: 1.95,
  });
  box(d, 178, 59, 60, 16, l('Reste dans la cuve', 'Stays in the tank'), {
    fill: FILL.sludge,
    sub: l('environ 300 jours', 'about 300 days'),
    size: 1.95,
  });
  arrow(152, 40, 178, 30);
  arrow(152, 49, 178, 49);
  arrow(152, 58, 178, 67);
  // the rim, the leak
  arrow(119, 30, 119, 18);
  p.text(
    [121, 18],
    l('perdu à l’anneau : 22 % par l’aire, non mesuré ici', 'lost at the ring: 22 % by area, not measured here'),
    { size: 1.75, baseline: 'middle' },
  );
}

export const balanceSheet: DrawingSheet = {
  id: 'mass-balance',
  number: 'PL-B07',
  group: 'life',
  title: l('Le bilan de matière', 'The mass balance'),
  description: lf(
    'Ce qui entre, ce qui sort, par jour, sur 2 kg de restes, et le tableau de ce que la thèse a mesuré à côté de ce que le modèle trouve : sur le calendrier de la thèse, et à régime. Sur les restes, le modèle est proche ; sur les déchets de marché, il ne retrouve pas le gaz, {marketLow} à {marketHigh} contre 126 L, et il le dit. La nourriture mesurée contenait au plus {maxFromCod} de méthane, et la cuve en a recueilli {caughtMarket}. En bas, le même poids compté sec et humide.',
    'What goes in, what comes out, per day, on 2 kg of leftovers, and the table of what the thesis measured beside what the model finds: on the thesis’s calendar, and steady. On leftovers the model is close; on market waste it does not retrieve the gas, {marketLow} to {marketHigh} against 126 L, and says so. The food measured held at most {maxFromCod} of methane, and the tank caught {caughtMarket}. Below, the same weight counted dry and wet.',
  ),
  scene: 'digester',
  parts: ['clear-liquor', 'sludge-bed', 'scum-layer'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Le bilan de matière', 'The mass balance'),
      subtitle: l('2 kg et 18 L par jour, à environ 30 °C', '2 kg and 18 L a day, at about 30 °C'),
      number: 'PL-B07',
      scale: '—',
    });
    heading(d, 14, 14, l('UN JOUR, SUR LES RESTES', 'ONE DAY, ON LEFTOVERS'));
    flow(d);
    heading(d, 14, 82, l('LA THÈSE ET LE MODÈLE', 'THE THESIS AND THE MODEL'));
    grid(
      d,
      14,
      90,
      [
        { label: l('Par jour, sur 2 kg', 'A day, on 2 kg'), w: 62 },
        { label: l('Restes, mesuré', 'Leftovers, measured'), w: 27, align: 'end', mono: true },
        { label: l('Restes, calendrier', 'Leftovers, calendar'), w: 27, align: 'end', mono: true },
        { label: l('Restes, à régime', 'Leftovers, steady'), w: 27, align: 'end', mono: true },
        { label: l('Marché, mesuré', 'Market, measured'), w: 27, align: 'end', mono: true },
        { label: l('Marché, calendrier', 'Market, calendar'), w: 27, align: 'end', mono: true },
        { label: l('Marché, à régime', 'Market, steady'), w: 27, align: 'end', mono: true },
      ],
      [
        [l('Gaz', 'Gas'), '289 L', fig('gasCalendar'), fig('gasSteady'), '126 L', fig('marketLow'), fig('marketHigh')],
        [
          l('Méthane', 'Methane'),
          l('56,8 %', '56.8 %'),
          fig('ch4Calendar'),
          fig('ch4Food'),
          l('66,4 %', '66.4 %'),
          fig('ch4MarketCalendar'),
          fig('ch4Market'),
        ],
        [
          l('Normaux litres', 'Normal litres'),
          '259 NL',
          l('239,5 NL†', '239.5 NL†'),
          '—',
          '113 NL',
          '55 NL†',
          '65 NL†',
        ],
        [l('Par kg humide', 'Per wet kg'), '144 L', '140 L†', '—', '63 L', '38 L†', '—'],
        [l('Par kg organique', 'Per kg organic'), '640 L', '619 L†', '—', '700 L', '434 L†', '—'],
        [
          l('Matière organique ôtée', 'Organic matter removed'),
          l('92,2 %', '92.2 %'),
          l('91,4 %†', '91.4 %†'),
          '—',
          l('85,3 %', '85.3 %'),
          l('83,3 %†', '83.3 %†'),
          '—',
        ],
        [
          l('DCO ôtée', 'COD removed'),
          l('83,1 %', '83.1 %'),
          '90 %†',
          '—',
          l('83,9 %', '83.9 %'),
          l('79,8 %†', '79.8 %†'),
          '—',
        ],
        [
          l('Solides ôtés', 'Solids removed'),
          l('84,9 %', '84.9 %'),
          l('84,3 %†', '84.3 %†'),
          '—',
          l('72,8 %', '72.8 %'),
          l('70,1 %†', '70.1 %†'),
          '—',
        ],
      ],
      { size: 1.75 },
    );
    grid(
      d,
      246,
      14,
      [
        { label: l('La nourriture', 'The food'), w: 80 },
        { label: l('Restes', 'Leftovers'), w: 40, align: 'end', mono: true },
        { label: l('Marché', 'Market'), w: 40, align: 'end', mono: true },
      ],
      [
        [l('Matière sèche', 'Dry matter'), '24 %', '10 %'],
        [l('Part organique', 'Organic share'), '94 %', '88 %'],
        [l('Matière organique, par jour', 'Organic matter, a day'), l('0,451 kg', '0.451 kg'), l('0,18 kg', '0.18 kg')],
        [
          l('Charge, par m³ et par jour', 'Loading, per m³ a day'),
          l('0,53 kg', '0.53 kg'),
          l('0,17 à 0,21 kg', '0.17 to 0.21 kg'),
        ],
        [
          l('Azote ammoniacal, effluent', 'Ammonium nitrogen, effluent'),
          l('74,1 mg/L', '74.1 mg/L'),
          l('85,5 mg/L', '85.5 mg/L'),
        ],
        [l('Phosphore, effluent', 'Phosphorus, effluent'), '248 mg/L', '225 mg/L'],
      ],
      { size: 1.75 },
    );
    grid(
      d,
      246,
      66,
      [
        { label: l('Les couches, dix de 85 L', 'The layers, ten of 85 L'), w: 80 },
        { label: l('Matière sèche', 'Dry matter'), w: 80, align: 'end', mono: true },
      ],
      [
        [l('Surface', 'Surface'), '74 g/L'],
        [l('Environ 600 L', 'About 600 L'), l('3,3 à 3,6 g/L', '3.3 to 3.6 g/L')],
        [l('Fond', 'Bottom'), '41 g/L'],
      ],
      { size: 1.75 },
    );
    heading(d, 14, 146, l('DEUX KILOS, COMPTÉS DE DEUX FAÇONS', 'TWO KILOS, COUNTED TWO WAYS'));
    bars(d, 14, 156);
    let y = marksLegend(d, 246, 92, 150);
    y = note(
      d,
      246,
      y + 1,
      150,
      cat(
        l(
          'La part organique de 94 % vient du tableau de la thèse ; son résumé imprime 91 %. ',
          'The 94 % organic share comes from the thesis’s table; its abstract prints 91 %. ',
        ),
        lf(
          'Les 700 L par kilo organique du marché dépassent ce que le chiffre de DCO de la même thèse peut donner : nous ne concluons pas sur le rendement par kilo de solides. Le jour mélangé, environ 200 L à 61 % et 45 min, est un calcul de la thèse : {mixLitres} à {mixCh4} et {mixMinutes} selon le modèle. L’amidon permet au plus {starchCeiling} de méthane par kilo.',
          'The 700 L per organic kilo for the market pass what the COD figure of the same thesis can give: we draw no conclusion on the yield per kilo of solids. The mixed day, about 200 L at 61 % and 45 min, is a sum by the thesis: {mixLitres} at {mixCh4} and {mixMinutes} by the model. Starch allows at most {starchCeiling} of methane per kilo.',
        ),
      ),
      { size: 1.85 },
    );
    return d;
  },
};
