// The Sources panel: notices, safety and law said once, credits and links. The lead wires it with `about: sourcesPanel` in src/lab.ts (and `video: { id: VIDEO_ID }`, see chapters.ts). ARTI is named here and in `noticeMachine`, and nowhere else; no endorsement is implied. From docs/research.md §1 and §7.
// Left out on purpose: S19 (no figure of it is used, the link answered 404), S26 and S33 (not used, not checked), S37 (popular histories the research rules out). Access notes stay in the research; a note here says plainly when a document was read only in part.
import { l, tr, type L } from '@onigam/lab-kit/i18n';
import { h, icon, ICONS, type AppContext } from '@onigam/lab-kit/ui';
import { t } from '../i18n/ui';
import { CHAPTERS, VIDEO_ID } from './chapters';

export interface SourceLink {
  href: string;
  label: string | L;
  note: L;
}

export interface SourceGroup {
  title: L;
  links: SourceLink[];
}

export const MAIN_VIDEO: SourceLink = {
  href: `https://www.youtube.com/watch?v=${VIDEO_ID}`,
  label: 'How to produce biogas at home? - DIY Tutorial',
  note: l(
    'Low-tech Lab, 27 octobre 2022, tourné avec l’équipage de Nomade des mers. Licence affichée : Creative Commons Attribution. Nous n’avons pas encore pu en lire la transcription : aucun chiffre du lab n’en vient, et aucune image n’en est reprise.',
    'Low-tech Lab, 27 October 2022, made with the Nomade des mers crew. Licence shown: Creative Commons Attribution. We have not yet been able to read a transcript: no figure of the lab comes from it, and no footage from it is reused.',
  ),
};

export const SOURCE_GROUPS: SourceGroup[] = [
  {
    title: l('La machine et sa mesure', 'The machine and its measurement'),
    links: [
      {
        href: 'https://www.eawag.ch/fileadmin/Domain1/Abteilungen/sandec/publikationen/SWM/Anaerobic_Digestion/Lohri_2009.pdf',
        label:
          'C. Lohri, Research on anaerobic digestion of organic solid waste at household level in Dar es Salaam, 2009',
        note: l(
          'Thèse de bachelor, ZHAW, avec l’Eawag et l’Université Ardhi : c’est « la thèse » de ce lab. Le plan, les pièces, le gaz, sa composition, les essais de flamme, les couches, l’enquête de terrain. Une installation, quatre mois. Ses annexes ne sont pas dans ce PDF.',
          'Bachelor thesis, ZHAW, with Eawag and Ardhi University: this lab’s “the thesis”. The drawing, the parts, the gas, its make-up, the flame tests, the layers, the field survey. One plant, four months. Its appendices are not in this PDF.',
        ),
      },
      {
        href: 'https://www.eawag.ch/fileadmin/Domain1/Abteilungen/sandec/publikationen/SWM/Anaerobic_Digestion/SN10_Kitchen_Waste.pdf',
        label: 'Y. Vögeli, C. Lohri, Renewable Energy from Kitchen Waste, Sandec News 10, 2009',
        note: l('La thèse en une page, par son encadrant.', 'The thesis in one page, by its supervisor.'),
      },
      {
        href: 'https://www.eawag.ch/fileadmin/Domain1/Abteilungen/sandec/publikationen/SWM/Anaerobic_Digestion/Gyalpo_2010.pdf',
        label: 'T. Gyalpo, Anaerobic digestion of canteen waste at a secondary school in Dar es Salaam, 2010',
        note: l(
          '« L’étude voisine » : trois cuves de 4 000 et 3 000 L dans une école. La perte de gaz à l’anneau, la flamme qui s’éteint avec du gaz restant, la casserole et le réchaud.',
          '“The neighbouring study”: three tanks of 4,000 and 3,000 L at a school. The gas lost at the ring, the flame going out with gas left, the pot and the stove.',
        ),
      },
      {
        href: 'https://www.eawag.ch/fileadmin/Domain1/Abteilungen/sandec/publikationen/SWM/Anaerobic_Digestion/biowaste.pdf',
        label: 'Y. Vögeli et al., Anaerobic Digestion of Biowaste in Developing Countries, Eawag, 2014',
        note: l(
          '« Le livre » : les stades de la digestion, les températures, la charge, les réchauds, l’hygiène, les pièges à eau. Reproductible à des fins non commerciales : le lab n’en reprend que des faits.',
          '“The book”: the stages of digestion, temperatures, loading, stoves, hygiene, water traps. Reproducible for non-commercial purposes: the lab takes only facts from it.',
        ),
      },
      {
        href: 'https://samplecontents.library.ph/en-practical_action/Energy/Biogas/ARTI-biodigester-construction-manual/page1.html',
        label: 'B. Dana, S. Crowe, Build Manual: ARTI Floating Dome Biodigestor, AIDG, 30 July 2009',
        note: l(
          '« Le manuel de construction » : une autre construction, au Guatemala, lue sur un miroir. D’où viennent le limiteur et le détail des joints. Aucune licence vue.',
          '“The build manual”: another build, in Guatemala, read on a mirror. Where the limiter and the detail of the joints come from. No licence seen.',
        ),
      },
      {
        href: 'https://www.ashden.org/winners/the-appropriate-rural-technology-institute-arti',
        label: 'Ashden, The Appropriate Rural Technology Institute, award of 2006',
        note: l(
          'La conception et ce qu’en dit son auteur : matière sèche, vitesse, économies annoncées. Ce sont ses chiffres, pas des mesures indépendantes.',
          'The design and what its author says of it: dry matter, speed, savings announced. These are its figures, not independent measurements.',
        ),
      },
      {
        href: 'https://energypedia.info/wiki/Biogas_Plant_by_ARTI',
        label: 'energypedia, Biogas Plant by ARTI',
        note: l(
          'L’article d’ARTI repris sous CC BY-SA, dernière édition en janvier 2015.',
          'ARTI’s article taken up under CC BY-SA, last edited in January 2015.',
        ),
      },
      {
        href: 'https://www.engineeringforchange.org/solutions/product/arti-biogas-plant/',
        label: 'Engineering for Change, ARTI Biogas Plant',
        note: l('L’emprise et le temps de pose annoncés.', 'The footprint and installation time announced.'),
      },
      {
        href: 'https://sswm.info/node/914',
        label: 'Voegeli et al., Technical and biological performance of the ARTI compact biogas plant, Sardinia, 2009',
        note: l(
          'La forme revue de la thèse. Non lue : signalée pour qui veut aller plus loin.',
          'The peer-reviewed form of the thesis. Not read: flagged for whoever wants to go further.',
        ),
      },
    ],
  },
  {
    title: l('Le Low-tech Lab, pour comparer', 'The Low-tech Lab, for comparison'),
    links: [
      {
        href: 'https://www.youtube.com/watch?v=f-Lz7vqIai0',
        label: 'How to build homemade biodigester - DIY / Le biodigesteur',
        note: l(
          'Low-tech Lab, 24 mai 2018, avec Picojoule, d’après B. Lagrange. Sa description porte une mention non standard, « CC-BY-NC-ND-SA » : aucune image n’en est reprise. Non visionnée pour ce lab.',
          'Low-tech Lab, 24 May 2018, with Picojoule, after B. Lagrange. Its description carries a non-standard label, “CC-BY-NC-ND-SA”: no footage from it is reused. Not watched for this lab.',
        ),
      },
      {
        href: 'https://wiki.lowtechlab.org/wiki/Biodigesteur_domestique',
        label: 'Low-tech Lab, Biodigesteur domestique',
        note: l(
          '« Le tutoriel » : le bidon de 60 L et sa poche, 38 °C, la soupape de 100 mbar, la paille d’acier. Sous CC BY. C. Chabot pour la première édition, Picojoule pour le prototype.',
          '“The tutorial”: the 60 L drum and its bag, 38 °C, the 100 mbar relief, the steel wool. Under CC BY. C. Chabot for the first edition, Picojoule for the prototype.',
        ),
      },
      {
        href: 'https://wiki.lowtechlab.org/wiki/Biodigesteur',
        label: 'Low-tech Lab, Biodigesteur',
        note: l(
          'Une fosse de 9 m³ d’après H. Marchand à Madagascar, sous CC BY : une autre machine, lue pour comparer.',
          'A 9 m³ pit after H. Marchand in Madagascar, under CC BY: another machine, read for comparison.',
        ),
      },
    ],
  },
  {
    title: l('Les dangers, et ce que les textes demandent ailleurs', 'The hazards, and what the texts ask elsewhere'),
    links: [
      {
        href: 'https://www.ineris.fr/fr/regles-securite-installations-methanisation-agricole',
        label: 'INERIS, Règles de sécurité des installations de méthanisation agricole, 2009',
        note: l(
          '« Le guide français » : le méthane et le biogaz dans l’air, l’échelle de l’H₂S, le manque d’oxygène. Écrit pour les fermes, pas pour les maisons.',
          '“The French guide”: methane and biogas in air, the H₂S ladder, the lack of oxygen. Written for farms, not homes.',
        ),
      },
      {
        href: 'https://www.ineris.fr/sites/ineris.fr/files/contribution/Documents/dra-12-117442-01013a-rex-2-1341240391.pdf',
        label: 'INERIS, Retour d’expérience relatif aux procédés de méthanisation, 2012',
        note: l(
          'Les accidents connus, et combien ces données sont difficiles à obtenir.',
          'The known accidents, and how hard such data are to obtain.',
        ),
      },
      {
        href: 'https://www.aria.developpement-durable.gouv.fr/fiche_detaillee/31000_en/?lang=en',
        label: 'BARPI, ARIA 31000, Hydrogen sulphide emissions in a biogas plant',
        note: l(
          'Rhadereistedt, Allemagne, 8 novembre 2005. Une installation industrielle, pas une maison.',
          'Rhadereistedt, Germany, 8 November 2005. An industrial plant, not a home.',
        ),
      },
      {
        href: 'https://www.osha.gov/hydrogen-sulfide/hazards',
        label: 'US OSHA, Hydrogen sulfide: hazards',
        note: l(
          'Une autre échelle de l’H₂S, de l’odeur à la mort. Cette page nous a refusé l’accès au moment de la relecture : le lab ne cite pas ses chiffres.',
          'Another H₂S ladder, from smell to death. This page refused us access at the time of the re-read: the lab does not quote its figures.',
        ),
      },
      {
        href: 'https://aida.ineris.fr/node/28034/printable/pdf',
        label: 'Arrêté du 10 novembre 2009, rubrique 2781-1, France',
        note: l(
          'Ce que la France demande à une installation déclarée. Ce n’est pas un texte pour les ménages : il n’en dit pas le statut.',
          'What France asks of a declared plant. It is no text for households: it does not say what their status is.',
        ),
      },
      {
        href: 'https://www.atee.fr/system/files/2022-04/6_Verney_ATEE_ICPE_JRI2022.pdf',
        label: 'ATEE, Révision de l’ICPE 2781, 2022',
        note: l('Un résumé des seuils français par tonnage.', 'A summary of French thresholds by tonnage.'),
      },
      {
        href: 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32009R1069',
        label: 'Regulation (EC) 1069/2009',
        note: l(
          'Les sous-produits animaux dans l’UE. Lu en partie : nous ne savons pas si cela s’applique à un ménage.',
          'Animal by-products in the EU. Read in part: we do not know whether it applies to a household.',
        ),
      },
      {
        href: 'https://www.legislation.gov.uk/eur/2011/142/annex/I',
        label: 'Regulation (EU) 142/2011, Annex I',
        note: l('La définition des déchets de cuisine.', 'The definition of catering waste.'),
      },
    ],
  },
  {
    title: l('Le climat, les fuites, la vitesse', 'The climate, the leaks, the rates'),
    links: [
      {
        href: 'https://re.jrc.ec.europa.eu/pvg_tools/en/',
        label: 'PVGIS 5.3, PVGIS-ERA5, 2016-2020',
        note: l(
          'Les températures et le soleil des quatre lieux, des mailles et non des stations. © European Union, 2001-2024, Commission européenne.',
          'The temperatures and the sun at the four places, grid cells and not stations. © European Union, 2001-2024, European Commission.',
        ),
      },
      {
        href: 'https://researchportal.hw.ac.uk/en/publications/measuring-biogas-venting-from-over-pressurisation-of-household-sc/',
        label: 'Chaney, Robinson, Clifford, Measuring biogas venting…, Energy for Sustainable Development, 2025',
        note: l(
          '53 cuves à dôme fixe, Kenya et Ouganda : d’autres machines, pas des cloches. Lu dans un résumé.',
          '53 fixed-dome tanks, Kenya and Uganda: other machines, not bells. Read in a summary.',
        ),
      },
      {
        href: 'https://vbn.aau.dk/ws/files/762254777/Mu_oz_2024_Environ._Res._Lett._19_121002.pdf',
        label: 'Muñoz, Environmental Research Letters, 2024',
        note: l(
          'Le potentiel de réchauffement du méthane, 27 sur cent ans, repris du GIEC. Vu dans un résumé.',
          'Methane’s warming potential, 27 over a hundred years, after the IPCC. Seen in a summary.',
        ),
      },
      {
        href: 'https://pubmed.ncbi.nlm.nih.gov/270744/',
        label: 'C. Woese, G. Fox, Phylogenetic structure of the prokaryotic domain, PNAS, 1977',
        note: l(
          'Les trois lignées, et la place des méthanogènes. Résumé lu.',
          'The three lines of descent, and the methanogens’ place. Abstract read.',
        ),
      },
      {
        href: 'https://doi.org/10.2166/wst.2002.0292',
        label: 'Batstone et al., The IWA Anaerobic Digestion Model No 1, 2002',
        note: l(
          '« Un modèle de référence » : la forme des fenêtres de pH et les vitesses des méthanogènes, relues de mémoire : ce sont des estimations.',
          '“A reference model”: the form of the pH windows and the methanogens’ rates, recalled from memory: they are estimates.',
        ),
      },
      {
        href: 'https://doaj.org/article/365cf72ffd95450db35ce082e90d1471',
        label: 'Onze déchets alimentaires, potentiel et hydrolyse / Eleven food wastes, potential and hydrolysis',
        note: l(
          'La seule vitesse que nous ayons vue sur des déchets alimentaires, à température inconnue. Vue dans un résumé : nous ne sommes pas certains que ce lien soit bien celui de cette étude.',
          'The only rate we saw on food waste, at an unknown temperature. Seen in a summary: we are not certain this link is that study’s.',
        ),
      },
      {
        href: 'https://acnpsearch.tweb-dev.unibo.it/singlejournalindex/11679895',
        label:
          'Activité méthanogène à basse température, 5-29 °C / Low-temperature methanogenic activity, 5-29 °C, 1997',
        note: l(
          'Le seul indice sur l’énergie d’activation : vu dans un résumé, sur une boue adaptée, et auteurs non identifiés. Tout l’hiver à Genève repose sur lui.',
          'The one clue to the activation energy: seen in a summary, on an adapted sludge, authors not identified. The whole Geneva winter rests on it.',
        ),
      },
      {
        href: 'https://catalogue.museogalileo.it/indepth/Methane.html',
        label: 'Museo Galileo, Methane',
        note: l(
          'Volta et l’« air inflammable natif des marais », 1776.',
          'Volta and the “inflammable air native to marshes”, 1776.',
        ),
      },
      {
        href: 'https://pelton-lab.vercel.app',
        label: 'Pelton Lab',
        note: l(
          'Le premier lab de la série, sur une micro-centrale hydraulique.',
          'The first lab of the series, on a micro-hydro plant.',
        ),
      },
    ],
  },
];

/** The Sources panel, for `about` in src/lab.ts. */
export function sourcesPanel(ctx: AppContext): HTMLElement[] {
  const link = (s: SourceLink): HTMLElement =>
    h(
      'li',
      {},
      h(
        'a',
        { href: s.href, target: '_blank', rel: 'noopener noreferrer' },
        typeof s.label === 'string' ? s.label : tr(s.label),
      ),
      ' — ',
      tr(s.note),
    );
  const warn = (key: 'safety' | 'legal'): HTMLElement =>
    h('div', { class: 'callout callout--warn' }, icon(ICONS.warn, 16), h('span', {}, t(key)));
  const tip = (key: 'disclaimer' | 'noticeMachine' | 'noticeMarks'): HTMLElement =>
    h('div', { class: 'callout callout--tip' }, h('span', {}, t(key)));
  return [
    tip('disclaimer'),
    tip('noticeMachine'),
    tip('noticeMarks'),
    warn('safety'),
    warn('legal'),
    h('h3', { class: 'section-title' }, t('sourceMain')),
    h('ul', { class: 'links' }, link(MAIN_VIDEO)),
    // no outline until someone has watched it (chapters.ts): the panel shows none
    ...(CHAPTERS.length
      ? [
          h(
            'ul',
            { class: 'chapters' },
            ...CHAPTERS.map(([ts, fr, en]) =>
              h(
                'li',
                {},
                h('a', { href: ctx.videoUrl(ts), target: '_blank', rel: 'noopener noreferrer' }, ts),
                ' ',
                tr({ fr, en }),
              ),
            ),
          ),
        ]
      : []),
    ...SOURCE_GROUPS.flatMap((g) => [
      h('h3', { class: 'section-title' }, tr(g.title)),
      h('ul', { class: 'links' }, ...g.links.map(link)),
    ]),
    h('p', { class: 'hint' }, t('sourcesNoCopy')),
    h('p', { class: 'hint' }, 'Three.js · TypeScript · Vite — MIT'),
  ];
}
