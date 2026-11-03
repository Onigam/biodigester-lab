// The 58 parts of research §4, in one list. `src/data/parts.ts` must carry the same ids: this file is what the data role and the 3D agreed, and a test holds the registry to it.

export type WorldId = 'yard' | 'digester' | 'slurry' | 'gas-line';

export interface PartName {
  id: string;
  world: WorldId;
  fr: string;
  en: string;
}

const row = (world: WorldId, id: string, fr: string, en: string): PartName => ({ id, world, fr, en });

export const PART_NAMES: PartName[] = [
  row('yard', 'biogas-plant', 'Installation', 'Biogas plant'),
  row('yard', 'kitchen-house', 'Maison et cuisine', 'House and kitchen'),
  row('yard', 'yard-pad', 'Dalle', 'Yard pad'),
  row('yard', 'water-butt', 'Réserve d’eau', 'Water butt'),
  row('yard', 'overflow-bucket', 'Seau de trop-plein', 'Overflow bucket'),
  row('yard', 'vegetable-bed', 'Potager', 'Vegetable bed'),
  row('yard', 'shade-tree', 'Arbre d’ombre', 'Shade tree'),
  row('yard', 'compost-heap', 'Compost', 'Compost heap'),
  row('yard', 'scrap-caddy', 'Seau à déchets', 'Scrap caddy'),
  row('yard', 'hose-run', 'Conduite de gaz', 'Gas hose run'),

  row('digester', 'digester-tank', 'Cuve', 'Digester tank'),
  row('digester', 'gas-bell', 'Cloche', 'Gas bell'),
  row('digester', 'gas-space', 'Volume de gaz', 'Gas space'),
  row('digester', 'rim-gap', 'Anneau ouvert', 'Open rim'),
  row('digester', 'scale-marks', 'Graduations', 'Scale marks'),
  row('digester', 'half-brick', 'Demi-parpaing', 'Half brick'),
  row('digester', 'feed-funnel', 'Entonnoir', 'Feed funnel'),
  row('digester', 'feed-riser', 'Colonne d’alimentation', 'Feed riser'),
  row('digester', 'feed-tee', 'Té d’alimentation', 'Feed tee'),
  row('digester', 'clean-out-plug', 'Bouchon de curage', 'Clean-out plug'),
  row('digester', 'inner-feed-pipe', 'Tube intérieur', 'Inner feed pipe'),
  row('digester', 'tank-connector', 'Traversée de paroi', 'Tank connector'),
  row('digester', 'overflow-pipe', 'Trop-plein', 'Overflow pipe'),
  row('digester', 'gas-tap', 'Robinet de gaz', 'Gas tap'),
  row('digester', 'bottom-valve', 'Vanne de fond', 'Bottom valve'),
  row('digester', 'pallet', 'Palette', 'Pallet'),
  row('digester', 'float-limiter', 'Limiteur de course', 'Float limiter'),
  row('digester', 'scum-layer', 'Croûte', 'Scum layer'),
  row('digester', 'clear-liquor', 'Liquide clair', 'Clear liquor'),
  row('digester', 'sludge-bed', 'Boues', 'Sludge bed'),

  row('slurry', 'food-particle', 'Particule de nourriture', 'Food particle'),
  row('slurry', 'hydrolysers', 'Hydrolyseurs', 'Hydrolysers'),
  row('slurry', 'acid-makers', 'Acidogènes', 'Acid-makers'),
  row('slurry', 'acetogens', 'Acétogènes', 'Acetogens'),
  row('slurry', 'methanogens', 'Méthanogènes', 'Methanogens'),
  row('slurry', 'sulphate-reducers', 'Sulfato-réducteurs', 'Sulphate reducers'),
  row('slurry', 'fatty-acid-pool', 'Acides gras', 'Fatty-acid pool'),
  row('slurry', 'bicarbonate-buffer', 'Tampon bicarbonate', 'Bicarbonate buffer'),
  row('slurry', 'ammonium', 'Ammonium', 'Ammonium'),
  row('slurry', 'gas-bubble', 'Bulle', 'Gas bubble'),
  row('slurry', 'surviving-germs', 'Germes survivants', 'Surviving germs'),

  row('gas-line', 'mincer', 'Hachoir', 'Mincer'),
  row('gas-line', 'dilution-bucket', 'Seau de dilution', 'Dilution bucket'),
  row('gas-line', 'bell-hose', 'Tuyau souple', 'Bell hose'),
  row('gas-line', 'condensate-trap', 'Piège à condensats', 'Condensate trap'),
  row('gas-line', 'hydraulic-relief', 'Soupape hydraulique', 'Hydraulic relief'),
  row('gas-line', 'h2s-filter', 'Filtre à H₂S', 'H₂S filter'),
  row('gas-line', 'flame-arrester', 'Arrête-flamme', 'Flame arrester'),
  row('gas-line', 'pressure-gauge', 'Manomètre', 'Pressure gauge'),
  row('gas-line', 'wall-sleeve', 'Fourreau de traversée', 'Wall sleeve'),
  row('gas-line', 'kitchen-valve', 'Vanne de cuisine', 'Kitchen valve'),
  row('gas-line', 'biogas-burner', 'Brûleur à biogaz', 'Biogas burner'),
  row('gas-line', 'primary-air-sleeve', 'Virole d’air primaire', 'Primary-air sleeve'),
  row('gas-line', 'blue-flame', 'Flamme', 'Blue flame'),
  row('gas-line', 'pot-stand', 'Support de casserole', 'Pot stand'),
  row('gas-line', 'cooking-pot', 'Casserole', 'Cooking pot'),
  row('gas-line', 'vent-opening', 'Aération', 'Vent opening'),
  row('gas-line', 'gas-detector', 'Détecteur', 'Gas detector'),
];

const BY_ID = new Map(PART_NAMES.map((p) => [p.id, p]));

export function partName(id: string): { fr: string; en: string } {
  const p = BY_ID.get(id);
  if (!p) throw new Error(`no such part: ${id}`);
  return { fr: p.fr, en: p.en };
}
