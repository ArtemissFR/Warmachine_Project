/**
 * CORE OPS — FOODS DATABASE
 * Base alimentaire simplifiée (CIQUAL) pour calcul automatique des macros.
 * Macros exprimées pour 100g de l'aliment.
 * Format : { name, aliases[], kcal, prot, gluc, lip }
 */
window.FOODS_DB = [

  /* ── PROTÉINES ANIMALES ─────────────────────────────── */
  { name: 'blanc de poulet',        aliases: ['filet de poulet', 'escalope de poulet', 'poitrine de poulet'], kcal: 110, prot: 23.1, gluc: 0,    lip: 1.2  },
  { name: 'poulet',                 aliases: ['cuisse de poulet', 'aile de poulet'],                           kcal: 165, prot: 17.9, gluc: 0,    lip: 9.3  },
  { name: 'blanc de dinde',         aliases: ['escalope de dinde', 'filet de dinde', 'dinde'],                 kcal: 97,  prot: 21.5, gluc: 0,    lip: 0.8  },
  { name: 'steak de boeuf',         aliases: ['bifteck', 'pavé de boeuf', 'entrecôte'],                        kcal: 158, prot: 26.4, gluc: 0,    lip: 5.5  },
  { name: 'viande hachée 5%',       aliases: ['boeuf haché 5%', 'steak haché 5%'],                             kcal: 121, prot: 20.2, gluc: 0,    lip: 5.0  },
  { name: 'viande hachée 15%',      aliases: ['boeuf haché', 'steak haché', 'viande hachée'],                  kcal: 215, prot: 17.4, gluc: 0,    lip: 15.0 },
  { name: 'saumon',                 aliases: ['saumon fumé', 'filet de saumon', 'pavé de saumon'],              kcal: 208, prot: 20.2, gluc: 0,    lip: 13.3 },
  { name: 'thon au naturel',        aliases: ['thon', 'thon en boîte'],                                        kcal: 103, prot: 23.3, gluc: 0,    lip: 1.0  },
  { name: 'cabillaud',              aliases: ['morue', 'colin', 'dos de cabillaud'],                            kcal: 82,  prot: 18.3, gluc: 0,    lip: 0.7  },
  { name: 'crevettes',              aliases: ['gambas', 'crevettes cuites'],                                    kcal: 85,  prot: 17.6, gluc: 0.9,  lip: 1.2  },
  { name: 'sardines',               aliases: ['sardines à l\'huile'],                                           kcal: 191, prot: 21.0, gluc: 0,    lip: 11.5 },
  { name: 'jambon blanc',           aliases: ['jambon de paris', 'jambon'],                                     kcal: 112, prot: 17.5, gluc: 0.5,  lip: 4.3  },
  { name: 'oeuf',                   aliases: ['oeufs', 'oeuf entier', 'oeufs entiers'],                         kcal: 143, prot: 12.6, gluc: 0.7,  lip: 9.9  },
  { name: 'blanc d\'oeuf',          aliases: ['blancs d\'oeuf', 'blancs d\'oeufs'],                             kcal: 52,  prot: 10.9, gluc: 0.7,  lip: 0.2  },

  /* ── PROTÉINES EN POUDRE ────────────────────────────── */
  { name: 'whey protéine',          aliases: ['whey', 'protéine en poudre', 'scoop', 'whey vanille', 'whey chocolat'], kcal: 380, prot: 75.0, gluc: 10.0, lip: 7.0 },
  { name: 'caséine',                aliases: ['casein', 'caséine protéine'],                                    kcal: 360, prot: 80.0, gluc: 8.0,  lip: 2.0  },

  /* ── PRODUITS LAITIERS ──────────────────────────────── */
  { name: 'fromage blanc 0%',       aliases: ['fromage blanc maigre', 'faisselle 0%'],                          kcal: 45,  prot: 7.8,  gluc: 4.0,  lip: 0.1  },
  { name: 'fromage blanc',          aliases: ['fromage blanc nature', 'fromage blanc 3%'],                      kcal: 77,  prot: 7.0,  gluc: 4.5,  lip: 3.5  },
  { name: 'yaourt grec',            aliases: ['yaourt grec nature', 'skyr', 'quark'],                           kcal: 95,  prot: 9.0,  gluc: 4.0,  lip: 5.0  },
  { name: 'yaourt nature',          aliases: ['yaourt', 'yoghourt'],                                            kcal: 56,  prot: 4.2,  gluc: 5.5,  lip: 1.5  },
  { name: 'fromage cottage',        aliases: ['cottage cheese', 'cottage'],                                     kcal: 98,  prot: 11.1, gluc: 3.4,  lip: 4.3  },
  { name: 'lait demi-écrémé',       aliases: ['lait', 'lait demi ecrémé'],                                      kcal: 46,  prot: 3.4,  gluc: 5.0,  lip: 1.5  },
  { name: 'lait entier',            aliases: ['lait entier bio'],                                               kcal: 64,  prot: 3.3,  gluc: 4.8,  lip: 3.5  },
  { name: 'lait écrémé',            aliases: ['lait 0%'],                                                       kcal: 34,  prot: 3.5,  gluc: 5.0,  lip: 0.1  },
  { name: 'feta',                   aliases: ['feta émiettée', 'feta grecque'],                                 kcal: 264, prot: 14.2, gluc: 0.0,  lip: 21.3 },
  { name: 'mozzarella',             aliases: ['mozzarella légère'],                                             kcal: 280, prot: 17.1, gluc: 2.2,  lip: 22.4 },
  { name: 'parmesan',               aliases: ['parmigiano'],                                                    kcal: 431, prot: 38.5, gluc: 0.0,  lip: 29.0 },
  { name: 'ricotta',                aliases: [],                                                                kcal: 174, prot: 11.3, gluc: 3.5,  lip: 13.0 },
  { name: 'beurre',                 aliases: ['beurre doux', 'beurre demi-sel'],                                kcal: 720, prot: 0.7,  gluc: 0.7,  lip: 80.0 },

  /* ── FÉCULENTS & CÉRÉALES ───────────────────────────── */
  { name: 'riz basmati',            aliases: ['basmati', 'riz basmati cru'],                                    kcal: 346, prot: 7.5,  gluc: 77.0, lip: 0.9  },
  { name: 'riz blanc',              aliases: ['riz cru', 'riz long', 'riz'],                                    kcal: 360, prot: 6.5,  gluc: 79.0, lip: 0.6  },
  { name: 'riz complet',            aliases: ['riz brun', 'riz intégral'],                                      kcal: 350, prot: 7.1,  gluc: 73.0, lip: 2.7  },
  { name: 'pâtes',                  aliases: ['spaghetti', 'macaroni', 'penne', 'tagliatelles', 'pates'],       kcal: 352, prot: 12.0, gluc: 72.0, lip: 1.5  },
  { name: 'flocons d\'avoine',      aliases: ['avoine', 'oats', 'flocons avoine', 'porridge'],                  kcal: 361, prot: 12.5, gluc: 58.7, lip: 6.9  },
  { name: 'quinoa',                 aliases: ['quinoa cru'],                                                    kcal: 368, prot: 14.1, gluc: 64.2, lip: 6.1  },
  { name: 'patate douce',           aliases: ['sweet potato', 'igname'],                                        kcal: 86,  prot: 1.6,  gluc: 20.1, lip: 0.1  },
  { name: 'pomme de terre',         aliases: ['pommes de terre', 'patate'],                                     kcal: 77,  prot: 2.0,  gluc: 17.0, lip: 0.1  },
  { name: 'pain complet',           aliases: ['pain intégral', 'pain de seigle'],                               kcal: 230, prot: 8.5,  gluc: 43.0, lip: 2.5  },
  { name: 'pain blanc',             aliases: ['baguette', 'pain de mie'],                                       kcal: 265, prot: 8.0,  gluc: 53.0, lip: 1.5  },
  { name: 'tortilla',               aliases: ['wrap'],                                                          kcal: 306, prot: 7.9,  gluc: 49.0, lip: 7.8  },

  /* ── LÉGUMINEUSES ───────────────────────────────────── */
  { name: 'lentilles',              aliases: ['lentilles vertes', 'lentilles corail', 'lentilles cuites'],      kcal: 116, prot: 9.0,  gluc: 14.5, lip: 0.4  },
  { name: 'pois chiches',           aliases: ['chickpeas', 'pois chiches cuits'],                               kcal: 164, prot: 8.9,  gluc: 27.4, lip: 2.6  },
  { name: 'haricots rouges',        aliases: ['haricots', 'kidney beans'],                                      kcal: 127, prot: 8.7,  gluc: 22.8, lip: 0.5  },
  { name: 'tofu',                   aliases: ['tofu ferme', 'tofu nature'],                                     kcal: 76,  prot: 8.1,  gluc: 1.9,  lip: 4.3  },
  { name: 'edamame',                aliases: ['fèves de soja'],                                                 kcal: 122, prot: 11.9, gluc: 9.9,  lip: 5.2  },

  /* ── LÉGUMES ────────────────────────────────────────── */
  { name: 'brocoli',                aliases: ['brocolis'],                                                      kcal: 34,  prot: 2.8,  gluc: 7.0,  lip: 0.4  },
  { name: 'épinards',               aliases: ['épinard', 'épinards frais', 'épinards surgelés'],                kcal: 23,  prot: 2.9,  gluc: 3.6,  lip: 0.4  },
  { name: 'tomate',                 aliases: ['tomates', 'tomates cerises'],                                    kcal: 18,  prot: 0.9,  gluc: 3.9,  lip: 0.2  },
  { name: 'concombre',              aliases: ['concombres'],                                                    kcal: 15,  prot: 0.6,  gluc: 3.6,  lip: 0.1  },
  { name: 'courgette',              aliases: ['zucchini', 'courgettes'],                                        kcal: 17,  prot: 1.2,  gluc: 3.4,  lip: 0.3  },
  { name: 'poivron',                aliases: ['poivrons', 'poivron rouge', 'poivron vert'],                     kcal: 27,  prot: 1.0,  gluc: 6.3,  lip: 0.3  },
  { name: 'champignons',            aliases: ['champignon de paris', 'champignons frais'],                      kcal: 22,  prot: 3.1,  gluc: 3.3,  lip: 0.3  },
  { name: 'oignon',                 aliases: ['oignons', 'échalote', 'oignon rouge'],                           kcal: 40,  prot: 1.1,  gluc: 9.3,  lip: 0.1  },
  { name: 'carotte',                aliases: ['carottes'],                                                      kcal: 41,  prot: 0.9,  gluc: 10.0, lip: 0.2  },
  { name: 'salade verte',           aliases: ['laitue', 'roquette', 'mâche', 'radis'],                          kcal: 15,  prot: 1.3,  gluc: 2.9,  lip: 0.3  },
  { name: 'haricots verts',         aliases: ['haricot vert'],                                                  kcal: 31,  prot: 1.8,  gluc: 7.0,  lip: 0.1  },
  { name: 'asperge',                aliases: ['asperges'],                                                      kcal: 20,  prot: 2.2,  gluc: 3.9,  lip: 0.2  },
  { name: 'ail',                    aliases: ['gousses d\'ail', 'ail frais'],                                   kcal: 149, prot: 6.4,  gluc: 33.1, lip: 0.5  },
  { name: 'maïs',                   aliases: ['maïs en boîte', 'maïs doux'],                                    kcal: 96,  prot: 3.4,  gluc: 19.0, lip: 1.5  },
  { name: 'olives',                 aliases: ['olives noires', 'olives vertes'],                                kcal: 145, prot: 1.0,  gluc: 3.8,  lip: 15.3 },

  /* ── FRUITS ─────────────────────────────────────────── */
  { name: 'banane',                 aliases: ['bananes', 'banane mûre'],                                        kcal: 89,  prot: 1.1,  gluc: 22.8, lip: 0.3  },
  { name: 'pomme',                  aliases: ['pommes'],                                                        kcal: 52,  prot: 0.3,  gluc: 13.8, lip: 0.2  },
  { name: 'orange',                 aliases: ['oranges', 'clémentine'],                                        kcal: 47,  prot: 0.9,  gluc: 11.8, lip: 0.1  },
  { name: 'fraises',                aliases: ['fraise'],                                                        kcal: 32,  prot: 0.7,  gluc: 7.7,  lip: 0.3  },
  { name: 'myrtilles',              aliases: ['blueberries'],                                                   kcal: 57,  prot: 0.7,  gluc: 14.5, lip: 0.3  },
  { name: 'avocat',                 aliases: ['avocats'],                                                       kcal: 160, prot: 2.0,  gluc: 9.0,  lip: 14.7 },
  { name: 'citron',                 aliases: ['jus de citron', 'citron jaune'],                                 kcal: 29,  prot: 1.1,  gluc: 9.3,  lip: 0.3  },
  { name: 'mangue',                 aliases: ['mangues'],                                                       kcal: 60,  prot: 0.8,  gluc: 15.0, lip: 0.4  },

  /* ── MATIÈRES GRASSES ───────────────────────────────── */
  { name: 'huile d\'olive',         aliases: ['huile olive', 'olive oil'],                                      kcal: 900, prot: 0.0,  gluc: 0.0,  lip: 100.0},
  { name: 'huile de coco',          aliases: ['huile coco'],                                                    kcal: 890, prot: 0.0,  gluc: 0.0,  lip: 99.0 },
  { name: 'huile',                  aliases: ['huile végétale', 'huile de tournesol', 'huile de colza'],        kcal: 900, prot: 0.0,  gluc: 0.0,  lip: 100.0},
  { name: 'amandes',                aliases: ['amande', 'amandes effilées'],                                    kcal: 575, prot: 21.2, gluc: 21.7, lip: 49.9 },
  { name: 'noix',                   aliases: ['cerneaux de noix', 'noix de cajou'],                             kcal: 654, prot: 15.2, gluc: 13.7, lip: 65.2 },
  { name: 'beurre de cacahuète',    aliases: ['peanut butter', 'beurre de cacahouète', 'beurre de cacahuètes'],kcal: 598, prot: 25.1, gluc: 20.1, lip: 49.9 },
  { name: 'graines de chia',        aliases: ['chia'],                                                          kcal: 490, prot: 16.5, gluc: 42.1, lip: 30.7 },
  { name: 'graines de sésame',      aliases: ['sésame'],                                                        kcal: 573, prot: 17.7, gluc: 23.5, lip: 49.7 },
  { name: 'graines de tournesol',   aliases: ['tournesol'],                                                     kcal: 570, prot: 20.8, gluc: 20.0, lip: 47.5 },

  /* ── DIVERS ─────────────────────────────────────────── */
  { name: 'sauce soja',             aliases: ['soja sauce', 'tamari'],                                          kcal: 60,  prot: 8.1,  gluc: 5.6,  lip: 0.1  },
  { name: 'miel',                   aliases: ['sirop d\'érable'],                                               kcal: 304, prot: 0.3,  gluc: 82.4, lip: 0.0  },
  { name: 'cacao',                  aliases: ['cacao en poudre', 'poudre de cacao'],                            kcal: 228, prot: 19.6, gluc: 57.9, lip: 13.7 },
  { name: 'levure chimique',        aliases: ['levure', 'bicarbonate'],                                         kcal: 97,  prot: 0.0,  gluc: 24.5, lip: 0.0  },
  { name: 'farine',                 aliases: ['farine de blé', 'farine blanche'],                               kcal: 364, prot: 10.3, gluc: 76.3, lip: 1.0  },
  { name: 'maïzena',                aliases: ['fécule de maïs', 'amidon'],                                      kcal: 365, prot: 0.3,  gluc: 91.3, lip: 0.1  },
];

/**
 * Poids typiques pour une unité usuelle.
 * Clé = mot-clé trouvé dans la ligne d'ingrédient.
 */
window.FOODS_UNIT_WEIGHTS = {
  'c.s':     15,   // cuillère à soupe
  'c.c':     5,    // cuillère à café
  'cs':      15,
  'cc':      5,
  'scoop':   30,   // dose protéine
  'verre':   200,
  'bol':     300,
  'tasse':   240,
  'tranche': 25,
  'portion': 100,
  'boîte':   100,
  'sachet':  10,
  'ml':      1,    // 1ml ≈ 1g pour les liquides
  'cl':      10,
  'l':       1000,
};

/**
 * Poids d'une unité pour les aliments comptés à la pièce.
 */
window.FOODS_ITEM_WEIGHTS = {
  'oeuf':        60,
  'oeufs':       60,
  'banane':      120,
  'pomme':       150,
  'orange':      180,
  'citron':      80,
  'tomate':      120,
  'avocat':      200,
  'tranche':     25,
  'escalope':    150,
  'steak':       150,
  'filet':       150,
};
