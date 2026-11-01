import { PersonalityArchetype, ScentDNAScores } from './types';

// Olfactory note keywords mapped to 6 primary dimensions
export const DIMENSION_KEYWORDS: Record<keyof ScentDNAScores, string[]> = {
  woody: [
    'boisé', 'bois', 'cèdre', 'cedar', 'santal', 'sandalwood', 'oud', 'vétiver', 'vetiver',
    'patchouli', 'gaïac', 'guaiac', 'cyprès', 'cypress', 'pin', 'mousse de chêne', 'oakmoss',
    'bouleau', 'ebène', 'ebony'
  ],
  oriental: [
    'oriental', 'ambré', 'ambre', 'amber', 'encens', 'incense', 'myrrhe', 'myrrh', 'benjoin',
    'benzoin', 'labdanum', 'résine', 'resin', 'opoponax', 'baume', 'balsam', 'cuir', 'leather'
  ],
  floral: [
    'floral', 'fleur', 'rose', 'jasmin', 'jasmine', 'tubéreuse', 'tuberose', 'fleur d\'oranger',
    'orange blossom', 'neroli', 'néroli', 'iris', 'gardénia', 'muguet', 'ylang-ylang', 'violette',
    'pivoine', 'peony', 'magnolia', 'freesia', 'orchidée', 'lavande', 'lavender'
  ],
  fresh: [
    'frais', 'fresh', 'hespéridé', 'citrus', 'bergamote', 'bergamot', 'citron', 'lemon',
    'mandarine', 'mandarin', 'pamplemousse', 'grapefruit', 'aquatique', 'aquatic', 'marin',
    'marine', 'menthe', 'mint', 'gingembre', 'ginger', 'vert', 'pomme', 'poire', 'agrumes', 'thé'
  ],
  spicy: [
    'épicé', 'spicy', 'poivre', 'pepper', 'poivre noir', 'cardamome', 'cardamom', 'cannelle',
    'cinnamon', 'safran', 'saffron', 'muscade', 'nutmeg', 'clou de girofle', 'clove', 'piment',
    'coriandre', 'anis', 'café', 'coffee'
  ],
  sweet: [
    'gourmand', 'sucré', 'sweet', 'vanille', 'vanilla', 'fève tonka', 'tonka', 'caramel',
    'miel', 'honey', 'praline', 'chocolat', 'cacao', 'amande', 'almond', 'barbe à papa',
    'fruits rouges', 'framboise', 'cerise', 'coco', 'noix de coco'
  ]
};

// Subcategory labels to dimension boosts
export const SUBCATEGORY_MAP: Record<string, Partial<ScentDNAScores>> = {
  'Ambré Boisé': { oriental: 40, woody: 40, spicy: 10 },
  'Ambré Épicé': { oriental: 45, spicy: 35, woody: 10 },
  'Ambré Floral': { oriental: 35, floral: 40, sweet: 15 },
  'Ambré Vanillé': { oriental: 35, sweet: 45, woody: 10 },
  'Ambré Fougère': { oriental: 30, fresh: 35, woody: 25 },
  'Boisé': { woody: 70, spicy: 15, fresh: 15 },
  'Boisé Aromatique': { woody: 50, fresh: 35, spicy: 15 },
  'Boisé Épicé': { woody: 50, spicy: 40, oriental: 10 },
  'Boisé Floral Musqué': { woody: 40, floral: 35, fresh: 15 },
  'Floral': { floral: 70, fresh: 20, sweet: 10 },
  'Floral Fruité': { floral: 45, fresh: 30, sweet: 25 },
  'Floral Blanc': { floral: 65, sweet: 15, fresh: 20 },
  'Floral Gourmand': { floral: 40, sweet: 45, oriental: 15 },
  'Floral Boisé': { floral: 45, woody: 40, fresh: 15 },
  'Oriental': { oriental: 60, spicy: 25, woody: 15 },
  'Oriental Floral': { oriental: 45, floral: 40, sweet: 15 },
  'Oriental Épicé': { oriental: 45, spicy: 40, woody: 15 },
  'Oriental Boisé': { oriental: 40, woody: 45, spicy: 15 },
  'Frais': { fresh: 70, floral: 15, woody: 15 },
  'Hespéridé': { fresh: 80, spicy: 10, floral: 10 },
  'Hespéridé Aromatique': { fresh: 65, woody: 20, spicy: 15 },
  'Aromatique': { fresh: 50, spicy: 25, woody: 25 },
  'Aromatique Boisé': { fresh: 40, woody: 45, spicy: 15 },
  'Aromatique Fougère': { fresh: 45, woody: 30, spicy: 25 },
  'Cuir': { oriental: 40, woody: 35, spicy: 25 },
  'Gourmand': { sweet: 70, oriental: 20, floral: 10 },
  'Chypré Floral': { floral: 45, woody: 30, fresh: 25 },
  'Chypré Fruité': { floral: 40, fresh: 35, sweet: 25 }
};

// Fragrance Personality Archetypes
export const PERSONALITY_ARCHETYPES: Record<string, PersonalityArchetype> = {
  LE_MAGNAT_BOISE: {
    key: 'LE_MAGNAT_BOISE',
    dominantDimension: 'woody',
    titleFr: 'Le Magnat Boisé',
    titleAr: 'سيد الأخشاب النبيلة',
    taglineFr: 'Autorité tranquille, profondeur et noblesse intemporelle.',
    taglineAr: 'هيبة هادئة، عمق ونبالة تتحدى الزمن.',
    descriptionFr: 'Votre signature respire la confiance inébranlable et le charisme sobre. Vous êtes attiré par les essences de cèdre de l\'Atlas, de santal crémeux, de vétiver fumé et de bois précieux qui laissent un sillage marquant et distingué.',
    descriptionAr: 'بصمتك العطرية تعكس ثقة راسخة وجاذبية راقية. تنجذب إلى خلاصات خشب الأرز، والصندل، والنجيل الهندي والأخشاب الفاخرة التي تترك أثراً مهيباً لا يُنسى.',
    signatureNotes: ['Bois de Santal', 'Cèdre de l\'Atlas', 'Vétiver', 'Bois de Gaïac', 'Patchouli'],
    idealSeasons: ['Automne', 'Hiver', 'Printemps']
  },
  L_ARISTOCRATE_MYSTERIEUX: {
    key: 'L_ARISTOCRATE_MYSTERIEUX',
    dominantDimension: 'oriental',
    titleFr: 'L\'Aristocrate Mystérieux',
    titleAr: 'الأرستقراطي الغامض',
    taglineFr: 'Sillage magnétique, opulence d\'Orient et aura énigmatique.',
    taglineAr: 'أثر مغناطيسي، فخامة شرقية وهالة من الغموض الساحر.',
    descriptionFr: 'Votre présence ne s\'oublie jamais. Vous privilégiez les accords riches et chauds d\'ambre gris, d\'encens sacré, de vanille noire et de notes balsamiques profondes. Un parfum est pour vous une armure invisible de séduction.',
    descriptionAr: 'حضورك لا يُنسى أبداً. تفضل التناغمات الدافئة والعميقة من العنبر، والبخور المقدس، والعود والراتنجات الشرقية الفاتنة التي تأسر الحواس.',
    signatureNotes: ['Ambre Gris', 'Encens Noble', 'Oud Majestueux', 'Myrrhe', 'Labdanum'],
    idealSeasons: ['Hiver', 'Automne', 'Soirée']
  },
  L_ELEGANT_ROMANTIQUE: {
    key: 'L_ELEGANT_ROMANTIQUE',
    dominantDimension: 'floral',
    titleFr: 'L\'Élégant Romantique',
    titleAr: 'الأنيق الرومانسي',
    taglineFr: 'Délicatesse lumineuse, poésie florale et charme aérien.',
    taglineAr: 'رقة مضيئة، شاعرية زهرية وجاذبية أثيرية تأسر القلوب.',
    descriptionFr: 'Vous appréciez la haute couture olfactive, les pétales veloutés de roses de Damas, le jasmin sambac impérial et les fleurs blanches solaires. Votre sillage est une invitation à la douceur et à l\'harmonie.',
    descriptionAr: 'تتميز بذوق رفيع يعشق التناغم الزهري الراقي، وبتلات ورد دمشق الفاخر، والياسمين الملكي وزهر البرتقال في توليفة راقية مليئة بالأنوثة والرقي.',
    signatureNotes: ['Rose de Damas', 'Jasmin Sambac', 'Tubéreuse', 'Fleur d\'Oranger', 'Iris'],
    idealSeasons: ['Printemps', 'Été', 'Toutes Saisons']
  },
  LE_VIRTUOSE_FRAIS: {
    key: 'LE_VIRTUOSE_FRAIS',
    dominantDimension: 'fresh',
    titleFr: 'Le Virtuose Frais',
    titleAr: 'الفنان الحيوي المنعش',
    taglineFr: 'Énergie vive, brise méditerranéenne et clarté souveraine.',
    taglineAr: 'طاقة حيوية، نسيم متوسطي وإشراقة عصرية مفعمة بالانتعاش.',
    descriptionFr: 'Toujours en mouvement, vous recherchez l\'élégance du zeste d\'agrumes italiens, de la bergamote de Calabre, de la menthe givrée et des accords marins cristallins. Votre parfum insuffle une bouffée vivifiante d\'optimisme.',
    descriptionAr: 'شخصية حيوية متجددة، تبحث عن نقاء البرغموت الإيطالي، ونفحات الحمضيات المنعشة، والنسيم البحري والأعشاب العطرية التي تبث الانتعاش والحيوية.',
    signatureNotes: ['Bergamote de Calabre', 'Citron Givré', 'Notes Marines', 'Menthe Poivrée', 'Néroli'],
    idealSeasons: ['Été', 'Printemps', 'Quotidien']
  },
  L_EPICURIEN_GOURMAND: {
    key: 'L_EPICURIEN_GOURMAND',
    dominantDimension: 'sweet',
    titleFr: 'L\'Épicurien Gourmand',
    titleAr: 'صاحب الذوق المخملي الجذاب',
    taglineFr: 'Chaleur addictive, réconfort sensuel et tentation vanillée.',
    taglineAr: 'دفء جذاب، إحساس مخملي ونغمات الفانيليا والكراميل الساحرة.',
    descriptionFr: 'Vous aimez les parfums irrésistibles qui procurent un plaisir immédiat. La vanille bourbon de Madagascar, la fève tonka torréfiée, le praliné velouté et les touches chocolatées créent autour de vous une atmosphère chaleureuse et réconfortante.',
    descriptionAr: 'تعشق العطور الجذابة التي تمنح إحساساً فورياً بالمتعة والدفء. فانيليا مدغشقر، حبوب التونكا المحمصة، واللمسات السكرية الدافئة تمنحك حضوراً محبباً لا يُقاوم.',
    signatureNotes: ['Vanille Bourbon', 'Fève Tonka', 'Caramel Chaud', 'Praliné', 'Amande Douce'],
    idealSeasons: ['Automne', 'Hiver', 'Rendez-vous']
  },
  L_ICONOCLASTE_EPICE: {
    key: 'L_ICONOCLASTE_EPICE',
    dominantDimension: 'spicy',
    titleFr: 'L\'Iconoclaste Épicé',
    titleAr: 'المتفرد الجريء',
    taglineFr: 'Caractère piquant, audace vibrante et tempérament affirmé.',
    taglineAr: 'شخصية جريئة، نوتات توابل نادرة وطابع واثق لا يتردد.',
    descriptionFr: 'Vous n\'aimez pas la tiédeur. Vous êtes captivé par la chaleur du poivre noir de Madagascar, la fraîcheur camphrée de la cardamome du Guatemala, la cannelle dorée et les accents de safran rouge. Votre sillage est électrique et fascinant.',
    descriptionAr: 'تبحث عن التفرد والجرأة. تأسر حواسك نوتات الفلفل الأسود، والهيل العطري، والقرفة الدافئة وخيوط الزعفران النادر لتمنحك هالة متألقة تنبض بالثقة.',
    signatureNotes: ['Cardamome Noire', 'Poivre Rose', 'Cannelle de Ceylan', 'Safran Rouge', 'Gingembre'],
    idealSeasons: ['Automne', 'Hiver', 'Soirée']
  }
};
