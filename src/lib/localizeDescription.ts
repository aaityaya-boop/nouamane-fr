import { 
  translatePerfumeNote, 
  translateOlfactoryFamily, 
  translateSeason, 
  translateConcentration 
} from '@/lib/perfumeNotes';
import type { Locale } from '@/app/[locale]/product/[slug]/translations';
import type { Product } from '@/lib/products';

/**
 * 77 standard luxury perfume note descriptions from the boutique database
 * Mapped to native, elegant Arabic and English
 */
const NOTE_DESC_TRANSLATIONS: Record<string, { ar: string; en: string }> = {
  "Une baie rouge parfumée, juteuse et légèrement acide, apportant une gourmandise raffinée et un charme fruité chic.": {
    ar: "توت بري أحمر معطر، غني بالعصارة ومنعش بنعومة، يضفي لمسة سكرية راقية وسحراً فاكهياً جذاباً.",
    en: "A fragrant red berry, juicy and subtly tart, delivering refined sweetness and chic fruity charm."
  },
  "Une épice précieuse, luxueuse, cuirée et légèrement amère qui apporte un raffinement rare et une sensualité dorée.": {
    ar: "توابل شرقية نادرة وفاخرة، بلمسات جلدية دافئة تمنح العطر أناقة استثنائية وجاذبية ملكية.",
    en: "A precious, luxurious, leathery, and subtly bitter spice bringing rare refinement and golden sensuality."
  },
  "Une note sélectionnée pour sa qualité supérieure et son intégration harmonieuse, apportant de la texture et du relief à cette composition.": {
    ar: "مكون نخبوي تم اختياره بعناية فائقة لندرته وجودته العالية، ليمنح التركيبة العطرية عمقاً وتوازناً استثنائياً.",
    en: "A premium note carefully selected for its superior quality and seamless harmony, adding remarkable texture and dimension."
  },
  "Une résine sacrée, mystique et fumée qui apporte une profondeur boisée et une aura de mystère envoûtante.": {
    ar: "راتنج عطري مقدس ومدخن يفيض بالروحانية والغموض، ويمنح القاعدة عمقاً خشبياً آسراً ومهيباً.",
    en: "A sacred, mystical, and smoky resin bringing woody depth and an enchanting aura of mystery."
  },
  "Une fleur blanche riche, charnelle et lumineuse qui offre une sensualité éclatante et une féminité envoûtante.": {
    ar: "زهرة بيضاء غنية ومشرقة تفيض بالأنوثة الطاغية والجاذبية الساحرة التي تأسر الحواس.",
    en: "A rich, opulent, and radiant white flower offering striking sensuality and captivating femininity."
  },
  "Une fleur blanche riche, charnelle et lumineuse qui offre une sensualité éclatante et une féminité affirmée.": {
    ar: "زهرة بيضاء فاخرة ومشرقة تفيض بالأنوثة الطاغية والجاذبية الساحرة والثقة المطلقة.",
    en: "A rich, opulent, and luminous white flower radiating striking sensuality and confident femininity."
  },
  "Une note brute, texturée et animale qui évoque la sophistication, la force et une virilité brute ou un glamour rebelle.": {
    ar: "نفحة جلدية فاخرة ودافئة تعكس الفخامة والهيبة والقوة الذكورية مع لمسة كاريزمية جريئة.",
    en: "A bold, textured, and animalic note evoking sophistication, strength, and rebellious glamour."
  },
  "Une note résineuse chaude, enveloppante et magnétique qui confère au sillage une profondeur sensuelle et un caractère oriental persistant.": {
    ar: "نفحة عنبرية دافئة، مغناطيسية وغنية تمنح الأثر العطري عمقاً حسياً جذاباً وطابعاً شرقياً أصيلاً يدوم طويلاً.",
    en: "A warm, enveloping, and magnetic resinous note giving the sillage sensual depth and an enduring oriental character."
  },
  "Une note fruitée rouge, sucrée et juteuse, apportant une gourmandise espiègle et joyeuse.": {
    ar: "نفحة فاكهية حمراء حلوة ومبهجة مفعمة بالحيوية والانتعاش السكري اللطيف.",
    en: "A sweet and juicy red fruity note bringing playful sweetness and radiant joy."
  },
  "Une baie noire veloutée, douce et profonde, qui apporte un caractère fruité sombre, riche et sophistiqué.": {
    ar: "توت أسود مخملي وناعم يضفي طابعاً فاكهياً غنياً وعميقاً بلمسة فاخرة وساحرة.",
    en: "A velvety, sweet, and deep dark berry bringing a rich, sophisticated, and dusky fruit character."
  },
  "Une cerise charnue, sucrée, sombre et liquoreuse, qui enveloppe le sillage d'une gourmandise veloutée et mystérieuse.": {
    ar: "كرز أسود ممتلئ وسكري غني بالنكهة الدافئة، يغلف الأثر العطري بجاذبية مخملية غامضة ومغرية.",
    en: "A luscious, sweet, dark, and liqueur-like cherry wrapping the sillage in velvety, mysterious gourmandise."
  },
  "Une baie sombre, fruitée, juteuse et légèrement acide, apportant une profondeur mystérieuse et un caractère fruité noble.": {
    ar: "توت داكن عصاري منعش بنعومة، يضفي عمقاً غامضاً وطابعاً فاكهياً نبيلاً وأنيقاً.",
    en: "A dark, juicy, and subtly tart berry bringing mysterious depth and noble fruity distinction."
  },
  "Une note florale poudrée, douce, nostalgique et verte, apportant de l'élégance, du raffinement et de l'équilibre.": {
    ar: "نفحة زهرية بودرية ناعمة وخضراء تضفي لمسة من الأناقة الكلاسيكية والتناغم الراقي.",
    en: "A soft, powdery, and green floral note bringing timeless elegance, refinement, and balance."
  },
  "Une note douce, propre et poudrée comme une seconde peau, apportant un confort intime et une sensualité subtile.": {
    ar: "نفحة مسكية ناعمة ونقية كالبشرة الثانية، تمنح إحساساً دافئاً بالنظافة والراحة والجاذبية الهادئة.",
    en: "A soft, clean, and powdery note like a second skin, providing intimate comfort and subtle sensuality."
  },
  "Une note douce, propre et poudrée comme une seconde peau, apportant un confort intime et une sensualité pure.": {
    ar: "نفحة ناعمة ونقية وبودرية تحتضن البشرة برقة وتمنح شعوراً بالنظافة والراحة المطلقة والجاذبية النقية.",
    en: "A soft, clean, and powdery note that wears like a second skin, offering intimate comfort and pure sensuality."
  },
  "Une note douce, crémeuse, gourmande et réconfortante qui enveloppe la peau d'une chaleur suave et hautement addictive.": {
    ar: "نفحة فانيليا ناعمة وكريمية وغنية تغمر البشرة بدفء ساحر وجاذبية استثنائية تأسر الحواس.",
    en: "A soft, creamy, and comforting gourmand note wrapping the skin in sweet warmth and addictive allure."
  },
  "Un agrume amer, zesté et tonifiant qui apporte une fraîcheur dynamique et hespéridée.": {
    ar: "نفحة حمضية منعشة ومحفزة تمنح انتعاشاً حيوياً مفعماً بالطاقة والأناقة.",
    en: "A zesty, invigorating citrus note bringing crisp, dynamic freshness."
  },
  "Une épice douce, chaude et légèrement boisée qui apporte une sophistication aromatique et un caractère mystérieux.": {
    ar: "هيل دافئ وتوابل لطيفة وخشبية تضفي لمسة من الغموض والأناقة الشرقية الراقية.",
    en: "A warm, sweet, and subtly woody spice bringing aromatic sophistication and mysterious depth."
  },
  "Une note épicée, pétillante, fraîche et légèrement fruitée qui apporte de l'énergie et de la vivacité dès le départ.": {
    ar: "نفحة توابل منعشة ومشرقة ولمسة فاكهية خفيفة تضفي طاقة فورية وحيوية متألقة من اللحظة الأولى.",
    en: "A sparkling, fresh, and slightly fruity spicy note delivering vibrant energy right from the start."
  },
  "Une note aromatique herbacée, ambrée et légèrement poivrée qui apporte une masculinité raffinée et de la structure.": {
    ar: "نفحة عشبية عطرية عنبرية تمنح العطر طابعاً ذكورياً راقياً وقواماً ثابتاً ومتزناً.",
    en: "An herbaceous, amber-tinted aromatic note bringing refined masculinity and structured elegance."
  },
  "Une vanille noire de qualité exceptionnelle, crémeuse, suave, boisée et hautement sensuelle, qui enveloppe la peau d'un confort persistant.": {
    ar: "فانيليا سوداء فاخرة ذات جودة استثنائية، كريمية وخشبية دافئة تغلف البشرة براحة آسرة تدوم طويلاً.",
    en: "An exceptional black vanilla, creamy, smooth, woody, and intensely sensual, enveloping the skin in lasting luxury."
  },
  "Une note boisée gourmande, chaude et fumée, qui apporte une douceur unique et une texture enveloppante.": {
    ar: "نفحة خشبية دافئة ومدخنة بلمسة كستناء ناعمة، تضفي دفئاً حسياً وقواماً غنياً وممتعاً.",
    en: "A warm, smoky, and gourmand woody note bringing unique sweetness and an enveloping texture."
  },
  "Un bois sec, noble et structuré qui apporte une masculinité affirmée, une solidité boisée et de la persistance.": {
    ar: "خشب أرز جاف ونبيل يضفي فخامة متينة وثباتاً راقياً يمنح الحضور تميزاً وهيبة ذكورية واثقة.",
    en: "A dry, noble, and structured cedarwood delivering assertive masculinity, solid depth, and remarkable persistence."
  },
  "Un bois sec, noble et structuré qui apporte une masculinité affirmée, une solidité boisée et un sillage propre et racé.": {
    ar: "خشب نبيل ومهيب يمنح العطر بصمة ذكورية راسخة وأثراً عطرياً نظيفاً وأنيقاً.",
    en: "A noble, structured wood delivering commanding masculinity, solid depth, and a clean, distinguished trail."
  },
  "Un agrume vif, acide et ultra-frais qui apporte de la clarté et un boost d'énergie immédiat.": {
    ar: "حمضيات مشرقة ومنعشة للغاية تضفي وضوحاً مبهجاً وطاقة حيوية فورية تنبض بالانتعاش.",
    en: "A bright, crisp, and ultra-fresh citrus note delivering immediate clarity and an uplifting energy boost."
  },
  "Une note verte, herbacée, fraîche et rafraîchissante qui apporte un effet de propreté et de dynamisme.": {
    ar: "نعناع أخضر منعش يمنح إحساساً فورياً بالنظافة والانتعاش والنشاط الحيوي.",
    en: "A green, crisp, and refreshing herbal note providing a clean, invigorating burst of freshness."
  },
  "Une racine fraîche, épicée, piquante et citronnée qui réveille la fragrance d'une énergie fusante et vibrante.": {
    ar: "زنجبيل طازج بتوابل حمضية لاذعة يوقظ العطر بطاقة متوهجة وحيوية نابضة.",
    en: "A fresh, zesty, and spicy ginger root awakening the fragrance with vibrant, effervescent energy."
  },
  "Une épice chaude, boisée et sèche qui apporte du relief et un caractère masculin épicé à la composition.": {
    ar: "جوزة الطيب الدافئة بتوابل خشبية جافة تمنح التوليفة عمقاً كاريزمياً وأناقة ذكورية لافتة.",
    en: "A warm, dry, and woody spice adding texture and a distinguished spicy character to the composition."
  },
  "Une racine boisée, terreuse et fumée qui apporte une élégance sèche, une masculinité racée et une profondeur solide.": {
    ar: "نجيل الهند الترابي المدخن الذي يضفي أناقة خشبية راقية وعمقاً ذكورياً ثابتاً وفخماً.",
    en: "A woody, earthy, and smoky vetiver root imparting dry elegance, refined masculinity, and solid depth."
  },
  "Un bois crémeux, velouté et chaleureux qui apporte une douceur lactée, noble et une élégance tranquille.": {
    ar: "خشب الصندل الكريمي الدافئ المخملي، يضفي لمسة حليبية ناعمة وأناقة ملكية هادئة.",
    en: "A creamy, velvety, and warm sandalwood bringing soothing milky sweetness, nobility, and serene elegance."
  },
  "Une note boisée, terreuse et profonde qui donne de la texture, de la sensualité et une signature mystique au sillage.": {
    ar: "باتشولي خشبي وترابي عميق يمنح الأثر العطري قواماً غنياً وبصمة حسية غامضة تدوم طويلاً.",
    en: "A deep, earthy, and woody patchouli imparting rich texture, sensuality, and a mystical signature to the trail."
  },
  "Une fleur jaune exotique, solaire, crémeuse et capiteuse qui apporte une sensualité tropicale et un caractère opulent.": {
    ar: "يلانج يلانج استوائي مشمس وكريمي يفيض بالجاذبية الدافئة والأنوثة المترفة.",
    en: "A sunny, creamy, and heady exotic yellow flower bringing tropical sensuality and opulent richness."
  },
  "Une note d'agrume fraîche, pétillante et lumineuse qui apporte une ouverture vive, ensoleillée et stimulante.": {
    ar: "برغموت منعش ومشرق ومضيء يمنح افتتاحية مبهجة، مشمسة ومفعمة بالحيوية والانطلاق.",
    en: "A fresh, sparkling, and luminous citrus note providing a vibrant, sun-drenched, and uplifting opening."
  },
  "Une note florale royale, opulente et veloutée qui apporte une élégance romantique, une sensualité intemporelle et du raffinement.": {
    ar: "ورد ملكي مخملي فاخر يمنح العطر أناقة رومانسية وجاذبية كلاسيكية خالدة.",
    en: "A regal, opulent, and velvety floral note infusing romantic elegance, timeless sensuality, and refined beauty."
  },
  "Une note florale royale, opulente et veloutée qui apporte une élégance romantique, une sensualité intemporelle et une noblesse classique.": {
    ar: "ورد ملكي نخبوي مخملي وفاخر يمنح العطر أناقة رومانسية خالدة ونبلاً كلاسيكياً لا يُضاهى.",
    en: "A regal, opulent, and velvety floral note infusing romantic elegance, timeless sensuality, and classic nobility."
  },
  "Une petite fleur blanche, fraîche, verte et rosée, qui symbolise la fraîcheur du printemps et apporte une clarté pure.": {
    ar: "زنبق الوادي الأبيض المنعش الذي يرمز لنسيم الربيع ويمنح صفاءً ونقاءً عطرياً ساحراً.",
    en: "A delicate white flower, fresh, green, and dewy, symbolizing springtime freshness and crystal-clear purity."
  },
  "Un agrume doux, fruité, pétillant et joyeux qui apporte une fraîcheur lumineuse et sucrée.": {
    ar: "يوسفي حلو ومبهج ينبض بالحيوية ويضفي انتعاشاً حمضياً سكرياً مشرقاً.",
    en: "A sweet, cheerful, and sparkling citrus note bringing luminous and sweet fruit freshness."
  },
  "Une fleur blanche narcotique, charnelle, crémeuse et opulente qui irradie de sa sensualité mystérieuse et persistante.": {
    ar: "مسك الروم (توبيروز) الكريمي المغري، يشع بجاذبية حسية غامضة وثبات مذهل يأسر القلوب.",
    en: "A hypnotic, creamy, and opulent white flower radiating mysterious, enduring sensuality."
  },
  "Une fleur blanche crémeuse, opulente, verte et veloutée, qui apporte une élégance charnelle et une richesse florale.": {
    ar: "غاردينيا بيضاء كريمية ومخملية تضفي أناقة أنثوية مترفة وجمالاً زهرياً نادراً.",
    en: "A creamy, opulent, and velvety white gardenia bringing luxurious elegance and floral richness."
  },
  "Une fleur d'oranger sauvage, miellée et fraîche, apportant un caractère floral solaire et propre.": {
    ar: "زهر برتقال بري وعسلي منعش، يمنح العطر طابعاً مشمساً نقياً وساحراً.",
    en: "A wild, honeyed, and fresh orange blossom bringing radiant, sunlit floral purity."
  },
  "Une note florale blanche, douce, sucrée et solaire qui évoque la pureté, la lumière et apporte une gourmandise tendre.": {
    ar: "زهر البرتقال الأبيض الناعم والمشرق، يعكس النقاء والضياء ويضفي لمسة حلوة مبهجة.",
    en: "A soft, sweet, and sunlit white floral note evoking purity, light, and tender gourmand elegance."
  },
  "Une note fruitée juteuse, sucrée et croquante qui donne de la vivacité et une rondeur moderne à l'ouverture.": {
    ar: "تفاح مقرمش وعصاري حلو يمنح الافتتاحية حيوية عصرية وتوازناً منعشاً.",
    en: "A crisp, juicy, and sweet fruit note providing modern freshness and vibrant balance to the opening."
  },
  "Une note florale verte, rosée et aromatique qui apporte un équilibre frais et masculin au cœur de la composition.": {
    ar: "إبرة الراعي الخضراء العطرية تمنح قلب العطر توازناً منعشاً وأناقة كلاسيكية متقنة.",
    en: "An aromatic, green, and rosy floral note bringing fresh balance and masculine refinement to the heart."
  },
  "Une note épicée piquante, sèche et masculine qui donne du relief, de la force et une tension dynamique à l'ouverture.": {
    ar: "فلفل أسود دافئ وحار يمنح الافتتاحية قوة وهيبة وعمقاً ديناميكياً لافتاً.",
    en: "A pungent, dry, and masculine spice note giving depth, strength, and dynamic energy to the opening."
  },
  "Une épice chaude, sucrée et boisée qui procure une sensation de confort gourmand et une énergie enveloppante.": {
    ar: "قرفة دافئة وحلوة بلمسات خشبية تمنح إحساساً بالراحة الفاخرة والطاقة الغامرة.",
    en: "A warm, sweet, and woody cinnamon spice providing comforting richness and enveloping warmth."
  },
  "Un citron de Sicile gorgé de soleil, vif, pétillant et juteux, qui irradie l'ouverture d'une fraîcheur méditerranéenne.": {
    ar: "ليمون صقلي مشمس ومفعم بالحيوية، يفيض بانتعاش البحر الأبيض المتوسط الفاتن.",
    en: "A sun-drenched, sparkling Sicilian lemon radiating vibrant Mediterranean freshness."
  },
  "Un bois noble, sombre et précieux aux facettes cuirées, résineuses et terreuses, apportant une intensité et une richesse orientale incomparable.": {
    ar: "خشب عود ملكي ونادر بنفحات راتنجية وجلدية دافئة، يمنح العطر فخامة شرقية أصيلة لا تُضاهى.",
    en: "A noble, dark, and precious agarwood (oud) with leathery and resinous facets, imparting unmatched oriental richness."
  },
  "Une note pure, cotonneuse et limpide qui apporte un confort cocooning, un sillage propre et une longévité tout en douceur.": {
    ar: "مسك أبيض نقي وناعم كالحرير يمنح راحة استثنائية وأثراً عطرياً نظيفاً وثابتاً بمنتهى الرقة.",
    en: "A pure, cotton-soft, and limpid white musk providing cozy comfort, a pristine trail, and gentle longevity."
  },
  "Une note pure, cotonneuse et limpide qui apporte un confort cocooning, un sillage propre et une douceur apaisante.": {
    ar: "مسك قطني نقي وصافٍ يمنح إحساساً بالراحة الفائقة وأثراً عطرياً نظيفاً ومهدئاً.",
    en: "A pure, cotton-soft, and limpid note providing cozy comfort, a clean trail, and soothing softness."
  },
  "Un cèdre précieux aux notes sèches, boisées et légèrement résineuses, conférant une élégance brute et une tenue exceptionnelle.": {
    ar: "خشب أرز فرجينيا الفاخر بنفحات جافة وراتنجية أنيقة، يضمن ثباتاً مذهلاً وأناقة خشبية أصيلة.",
    en: "A precious Virginian cedar with dry, woody, and resinous notes, conferring raw elegance and exceptional longevity."
  },
  "Un agrume juteux, sucré et ensoleillé qui apporte de la gaieté, de la lumière et une fraîcheur fruitée éclatante.": {
    ar: "برتقال حلو ومشمس وغني بالعصارة، يضفي إشراقة مبهجة وانتعاشاً فاكهياً متألقاً.",
    en: "A sweet, juicy, and sunlit orange bringing joyful brightness and radiant fruity freshness."
  },
  "Un accord aquatique, salin et iodé qui évoque la brise de l'océan, apportant une fraîcheur pure et un vent de liberté.": {
    ar: "نفحات بحرية مائية منعشة تحاكي نسيم المحيط وتمنح شعوراً بالحرية والانطلاق الصافي.",
    en: "A crisp aquatic and marine accord evoking ocean breezes, bringing pure freshness and an aura of freedom."
  },
  "Une graine gourmande aux nuances d'amande, de foin et de vanille, apportant une douceur veloutée et chaleureuse.": {
    ar: "فول التونكا الفاخر بنفحات اللوز الدافئ والفانيليا، يضفي لمسة مخملية حلوة ومترفة.",
    en: "A gourmet tonka bean with nuances of sweet almond, hay, and vanilla, bringing velvety, warm comfort."
  },
  "Une note fruitée douce, veloutée et juteuse, qui donne de la rondeur, de la sensualité et une texture de peau douce.": {
    ar: "خوخ ناعم ومخملي وغني بالعصارة، يمنح العطر قواماً حريرياً وجاذبية أنثوية رقيقة.",
    en: "A sweet, velvety, and juicy peach note bringing smooth contours, sensuality, and a tender skin-like texture."
  },
  "Une note herbacée glaciale, piquante et ultra-fraîche qui procure une sensation de propreté et un souffle énergisant.": {
    ar: "نعناع فلفلي مثلج وفائق الانتعاش يمنح إحساساً فورياً بالنظافة المطلقة وطاقة متجددة.",
    en: "An icy, sharp, and ultra-fresh peppermint note providing an immediate sensation of cleanliness and energizing vigor."
  },
  "Une note fruitée exotique, juteuse, sucrée et acidulée, qui apporte un éclat tropical, joyeux et ensoleillé.": {
    ar: "أناناس استوائي عصاري يجمع بين الحلاوة والانتعاش المبهج، ليضفي إشراقة مشمسة ومتألقة.",
    en: "A juicy, sweet, and zesty exotic pineapple note bringing a joyful, sunlit tropical glow."
  },
  "Une note marine, saline, boisée et musquée qui apporte une profondeur organique, un sillage aérien et fixe admirablement le parfum.": {
    ar: "عنبر الحوت (أمبرغريس) النادر بنفحاته البحرية والخشبية، يمنح العطر هالة ملكية وثباتاً أسطورياً.",
    en: "A precious marine, salty, woody, and musky ambergris note providing airy sillage and extraordinary fixative power."
  },
  "Un gardénia crémeux et pur, apportant une sensualité florale blanche, lumineuse et voluptueuse.": {
    ar: "غاردينيا بيضاء نقية وكريمية تفيض بالأنوثة المضيئة والسحر الزهري الخالد.",
    en: "A pure and creamy white gardenia bringing radiant, voluptuous white floral sensuality."
  },
  "Une rose centifolia d'une finesse absolue, florale, douce et légèrement poivrée, symbole du luxe et de la haute parfumerie.": {
    ar: "وردة غراس النادرة ذات المائة بتلة، رمز الفخامة المطلقة والنعومة الرومانسية الراقية.",
    en: "A Grasse Centifolia rose of consummate finesse, soft and gently spiced, the ultimate emblem of haute perfumery."
  },
  "Une fleur blanche royale, opulente, épicée et majestueuse, offrant une présence florale pure, propre et noble.": {
    ar: "زنبق الدار البيضاء الملكي الأبيض، فاخر ومهيب يمنح حضوراً زهرياً نبيلاً ونقياً.",
    en: "A regal, opulent, and majestic Casablanca lily offering a noble, pristine, and stately floral presence."
  },
  "Une vanille rare, florale, douce, crémeuse et légèrement fruitée, apportant un charme solaire et exotique.": {
    ar: "فانيليا تاهيتي النادرة بنفحاتها الزهرية الكريمية، تضفي سحراً استوائياً دافئاً ومشرقاً.",
    en: "A rare Tahitian vanilla, floral, creamy, and subtly fruity, bringing sunlit exotic charm."
  },
  "Une variété de jasmin charnelle, verte, intense et fruitée, qui apporte une profondeur exotique et hypnotique.": {
    ar: "ياسمين سامباك الآسر بنفحاته الخضراء والفاكهية الغنية، يضفي عمقاً استوائياً ساحراً.",
    en: "A luscious, green, and hypnotic Sambac jasmine bringing exotic intensity and irresistible depth."
  },
  "Une note sucrée riche, chaude et onctueuse qui fond sur la peau en apportant une addiction gourmande irrésistible.": {
    ar: "كراميل غني ودافئ وكريمي يذوب على البشرة ليمنحك جاذبية سكرية لا تُقاوم.",
    en: "A rich, warm, and creamy caramel note melting on the skin with irresistible gourmand addiction."
  },
  "Une note sucrée régressive, moelleuse et aérienne, apportant un confort poudré et une douceur addictive.": {
    ar: "مارشميلو هوائي وناعم يمنح راحة بودرية لطيفة وحلاوة ساحرة تأسر الحواس.",
    en: "A soft, airy, and fluffy marshmallow note offering powdery comfort and addictive sweetness."
  },
  "Une note florale fantastique, douce, mystérieuse et poudrée, apportant de l'exotisme et un charme onirique.": {
    ar: "أوركيد ساحر بنفحاته البودرية الغامضة والناعمة، يضفي لمسة استوائية وأناقة حالمة.",
    en: "A mystical, soft, and powdery exotic orchid note bringing dreamlike charm and refinement."
  },
  "Une vanille noble, riche, sombre, liquoreuse et extrêmement sensuelle, qui offre un sillage mystique et envoûtant.": {
    ar: "فانيليا بوربون الملكية الداكنة والغنية، تمنح أثراً عطرياً حسياً آسراً يفيض بالفخامة.",
    en: "A noble Bourbon vanilla, dark, rich, and deeply sensual, creating a mystical and enchanting trail."
  },
  "Une résine chaude, balsamique, vanillée et lactée, qui apporte une douceur réconfortante et fixe le parfum avec sensualité.": {
    ar: "بنزوين بلسمي دافئ بنفحات الفانيليا والحليب، يضفي دفئاً مهدئاً ويثبت العطر بجاذبية.",
    en: "A warm, balsamic, vanillic, and milky benzoin resin providing soothing comfort and sensual longevity."
  },
  "Un bois de santal précieux aux facettes laiteuses, crémeuses et chaleureuses, offrant une douceur réconfortante.": {
    ar: "صندل أسترالي ثمين بلمسات حليبية وكريمية دافئة، يمنح العطر راحة مخملية راقية.",
    en: "A precious Australian sandalwood with warm, milky facets offering comforting, velvety luxury."
  },
  "Une rose riche, miellée, dense et majestueuse qui incarne l'opulence florale et la féminité noble.": {
    ar: "ورد تركي دمشقي عسلي وكثيف يجسد الفخامة الزهرية الملكية والأنوثة الساحرة.",
    en: "A rich, honeyed, and dense Turkish rose embodying regal floral opulence and noble femininity."
  },
  "Une fleur rose délicate, fraîche, rosée et aérienne, qui apporte une grâce romantique et printanière.": {
    ar: "فاوانيا زهرية ناعمة ومنعشة، تفيض بالرقة الرومانسية وسحر نسائم الربيع.",
    en: "A delicate, dewy, and airy pink peony bringing romantic spring grace and subtle elegance."
  },
  "Une note riche, miellée, fumée et herbacée qui évoque le luxe feutré, la maturité et un charisme mystérieux.": {
    ar: "تبغ فاخر بنفحات عسلية ومدخنة يفيض بالهيبة والوقار والكاريزما الذكورية الآسرة.",
    en: "A rich, honeyed, smoky, and herbal tobacco note evoking understated luxury, maturity, and charisma."
  },
  "Une bergamote d'exception, fraîche, florale et zestée, offrant une clarté et un éclat incomparables dès les premières secondes.": {
    ar: "برغموت كالابريا النخبوي بنفحات زهرية وحمضية تمنح إشراقة ملكية متألقة من اللحظة الأولى.",
    en: "An exceptional Calabrian bergamot offering unmatched citrus brilliance and floral clarity from the very first seconds."
  },
  "Une note liquoreuse de malt vieilli, boisée, fumée et tourbée, qui apporte une sophistication ultime et un charme mystérieux.": {
    ar: "نفحة ويسكي معتقة ومدخنة بخشب البلوط، تضفي أناقة استثنائية وجاذبية غامضة ودافئة.",
    en: "A rich aged malt note, woody and peaty, bringing ultimate sophistication and mysterious charm."
  },
  "Un cuir sombre, riche et texturé qui apporte une dimension noble, tactile et d'un chic absolu.": {
    ar: "جلد أسود فاخر وعميق يمنح العطر بعداً ملكياً وملمساً حسياً منتهى الرقي والأناقة.",
    en: "A dark, rich, and textured black leather bringing noble tactile depth and absolute chic."
  },
  "Une note fruitée croquante, acide et juteuse qui apporte une clarté moderne, joyeuse et fusante.": {
    ar: "تفاح أخضر مقرمش ومنعش بعصارة حيوية تمنح الافتتاحية صفاءً عصرياً بهيجاً.",
    en: "A crisp, tart, and juicy green apple note bringing modern clarity and joyful, sparkling energy."
  },
  "Une note aromatique fraîche, boisée, fruitée et légèrement piquante qui évoque la fraîcheur des forêts nordiques.": {
    ar: "توت العرعر العطري المنعش بنفحاته الخشبية الحيوية التي تحاكي نسيم الغابات الباردة.",
    en: "A fresh, woody, and subtly spicy juniper berry note evoking the crisp air of northern pine forests."
  },
  "Une note gourmande sucrée, caramélisée et noisettée, qui apporte une rondeur chaleureuse, onctueuse et hautement addictive au sillage.": {
    ar: "برالين مكرمل فاخر بنكهة البندق الدافئ، يمنح الأثر العطري قواماً كريمياً حلواً ومغرياً للغاية.",
    en: "A sweet, caramelized hazelnut praline note adding warm, creamy, and deeply addictive roundness to the trail."
  }
};

/**
 * Key poetic summary middle paragraphs
 */
const MIDDLE_PARAGRAPHS: Record<string, { ar: string; en: string }> = {
  "L'acidité lumineuse du citron confit rencontre l'éclat de la fleur d'oranger avant de plonger dans une vanille chaude et exquise. Un délice solaire et enveloppant.": {
    ar: "امتزاج مشرق بين انتعاش الليمون المحلى وسحر زهر البرتقال يغوص في دفء الفانيليا الفاخرة، ليمنحك هالة دافئة ومترفة تأسر الحواس.",
    en: "The luminous zest of candied lemon meets radiant orange blossom before diving into warm, exquisite vanilla. A solar and enveloping delight."
  },
  "Un chef-d'œuvre de résines, de cuir et d'encens fumé, adouci par une touche d'origan et de vanille. Un parfum à la puissance monumentale et hypnotique.": {
    ar: "تحفة عطرية من الراتنجات الفاخرة، والجلود، والبخور المدخن، تلطفها لمسة من الأوريغانو والفانيليا الدافئة. عطر ذو قوة ساحرة وجاذبية مهيبة.",
    en: "A masterpiece of resins, leather, and smoky incense, softened by oregano and warm vanilla. A fragrance of monumental, hypnotic power."
  },
  "Une dualité fascinante entre la douceur du kiwi et de la rose, et l'intensité sombre de l'encens, de la myrrhe et du cuir. Une aura intime et déroutante.": {
    ar: "تناغم مذهل يجمع بين رقة الورد المنعش وقوة البخور والجلد والمر الداكن. هالة حميمية تأسر الألباب وتفيض بالغموض الراقي.",
    en: "A fascinating duality between the tenderness of rose and the dark intensity of incense, myrrh, and leather. An intimate and captivating aura."
  },
  "Une interprétation vibrante de la vanille et du tabac, électrisée par la cardamome et le gingembre. Un sillage chaud, luxueux et résolument solaire.": {
    ar: "رؤية عصرية نابضة بالحياة تجمع بين الفانيليا والتبغ الفاخر، تزداد توهجاً بنفحات الهيل والزنجبيل. أثر عطري دافئ، مترف ومشمس.",
    en: "A vibrant interpretation of vanilla and tobacco, energized by cardamom and ginger. A warm, luxurious, and resolutely solar sillage."
  },
  "Une rose délicate et lumineuse modernisée par la vivacité du citron Primofiore et la profondeur terreuse du patchouli. L'essence du chic italien.": {
    ar: "وردة رقيقة ومضيئة بلمسة عصرية من حيوية الليمون الإيطالي وعمق الباتشولي الترابي. خلاصة الأناقة الإيطالية الراقية.",
    en: "A delicate, luminous rose modernized by crisp Primofiore lemon and earthy patchouli. The essence of Italian chic."
  },
  "La fraîcheur marine iconique se modernise et s'intensifie grâce à l'encens incandescent et au patchouli majestueux. Une réinterprétation puissante et mystérieuse.": {
    ar: "انتعاش بحري أيقوني يزداد قوة وعمقاً بفضل البخور المتوهج والباتشولي المهيب. إعادة ابتكار قوية وغامضة تفيض بالفخامة.",
    en: "Iconic marine freshness modernized and intensified with incandescent incense and majestic patchouli. A powerful, mysterious reinterpretation."
  },
  "Une rose de Taïf dramatique et somptueuse, enveloppée de thé noir corsé et d'un fond chaud d'ambre. Un parfum captivant d'une opulence rare.": {
    ar: "ورد طائفي مهيب وفاخر، يحتضنه الشاي الأسود الدافئ وقاعدة عنبرية غنية. عطر ساحر ذو فخامة شرقية نادرة.",
    en: "A dramatic, sumptuous Taif rose wrapped in dark tea and warm amber. A captivating fragrance of rare opulence."
  },
  "Un parfum boisé et profondément épicé qui évoque la puissance et le mystère de la Route de la Soie, mêlant la richesse du bois de oud et de l'encens à la chaleur des épices orientales.": {
    ar: "عطر خشبي وتوابلي عميق يحاكي سحر طريق الحرير التاريخي، يمزج فخامة خشب العود والبخور بدفء التوابل الشرقية الأصيلة.",
    en: "A deeply spicy, woody perfume evoking the mystery of the Silk Road, blending oud and incense with warm oriental spices."
  },
  "Une fraîcheur foudroyante de bergamote et d'épices qui se fond dans la profondeur mystique de l'encens. Une signature lumineuse pour les esprits affirmés.": {
    ar: "انتعاش باهر من البرغموت والتوابل يمتزج بعمق البخور الروحي. بصمة عطرية مشرقة لأصحاب الشخصيات الواثقة.",
    en: "Striking freshness of bergamot and spices blending into mystical incense depth. A luminous signature for confident spirits."
  },
  "Sensuel, sophistiqué et profondément addictif, Crystal Noir est une signature olfactive d'une ténacité remarquable. C'est l'arme de séduction invisible d'une femme magnétique qui marque les esprits et laisse un souvenir impérissable à chacun de ses passages.": {
    ar: "حسي، راقٍ ومغرٍ إلى أبعد الحدود. عطر ذو ثبات استثنائي وبصمة عطرية ساحرة تترك أثراً لا يُنسى في كل خطوة.",
    en: "Sensual, sophisticated, and deeply addictive. Crystal Noir is an olfactory signature of remarkable tenacity and invisible allure."
  },
  "À la fois d'une fraîcheur éclatante et d'une persistance rare pour une composition hespéridée, Imagination transcende les codes traditionnels. C'est le sillage invisible de l'homme sophistiqué et visionnaire qui recherche un parfum d'exception, lumineux, propre et irrésistiblement mémorable.": {
    ar: "انتعاش باهر وثبات استثنائي يتجاوز التقاليد. إنه الأثر العطري للرجل العصري الطموح الذي يبحث عن عطر نخبوي، نقي، ومفعم بالتميز.",
    en: "Combining brilliant freshness with rare longevity, Imagination transcends traditional codes for the visionary man seeking a luminous, memorable scent."
  },
  "À la fois frais, épicé et profondément addictif, Bleu Électrique est devenu une véritable légende urbaine pour les amateurs de compliments. C'est l'arme invisible idéale pour l'homme qui veut marquer les esprits dès le premier regard et laisser une empreinte inoubliable au cœur de la nuit.": {
    ar: "منعش، توابلي، ومغرٍ للغاية. السلاح العطري المثالي للرجل الذي يريد ترك انطباع قوي وأثر ساحر لا يُنسى في سكون الليل.",
    en: "Fresh, spicy, and deeply addictive, Bleu Électrique is an invisible weapon for the man who leaves an unforgettable mark."
  }
};

/**
 * Subtitles translation mapping
 */
const SUBTITLE_TRANSLATIONS: Record<string, { ar: string; en: string }> = {
  "le dessert à l'italienne": { ar: "سحر الحلوى الإيطالية الفاخرة", en: "The Italian Sweet Delight" },
  "l'ordre au cœur du chaos": { ar: "النظام في قلب الفوضى", en: "Order in the Heart of Chaos" },
  "l'élégance animale et sophistiquée": { ar: "الأناقة الكلاسيكية الراقية", en: "Sophisticated Animalic Elegance" },
  "l'effervescence londonienne": { ar: "حيوية لندن الساحرة", en: "London Effervescence" },
  "l'amour à son apogée": { ar: "ذروة العاطفة والجاذبية", en: "Love at Its Peak" },
  "l'éloge de la liberté masculine": { ar: "رمز الحرية والجاذبية الرجالية", en: "Praise of Masculine Freedom" },
  "l'essence même de la féminité": { ar: "جوهر الأنوثة الخالدة", en: "The Very Essence of Femininity" },
  "la fraîcheur des sommets enneigés": { ar: "انتعاش القمم الثلجية النقية", en: "Freshness of Snowy Summits" },
  "la pureté tragique et magnifique": { ar: "النقاء الملكي المهيب", en: "Tragic & Magnificent Purity" },
  "la grâce à fleur de peau": { ar: "رقة وأنوثة تفيض بالنعومة", en: "Grace on the Skin" },
  "l'élégance équestre de la cour de versailles": { ar: "فخامة ورقي البلاط الملكي", en: "Equestrian Elegance of Versailles" },
  "le fruit défendu": { ar: "سحر الجاذبية الممنوعة", en: "The Forbidden Fruit" },
  "la joie de vivre méditerranéenne": { ar: "بهجة الحياة المتوسطية المنعشة", en: "Mediterranean Joy of Living" },
  "le pouvoir divin de la vanille": { ar: "القوة الملكية للفانيليا الفاخرة", en: "The Divine Power of Vanilla" },
  "l'élégance vibrante de la dolce vita": { ar: "سحر وأناقة الحياة الهانئة", en: "Vibrant Elegance of La Dolce Vita" },
  "la douceur d'un poème olfactif": { ar: "عذوبة القصيدة العطرية الناعمة", en: "The Sweetness of an Olfactory Poem" },
  "l'allure en mouvement": { ar: "حيوية الأناقة الرياضية الواثقة", en: "Allure in Motion" }
};

/**
 * Localizes the full markdown description for non-French locales
 */
export function localizeLongDescription(
  rawMarkdown: string | null | undefined,
  product: {
    name: string;
    brandLabel: string;
    gender?: string;
    subcategoryLabel?: string;
    perfectSeason?: string;
    sizes?: Array<{ label: string }>;
  },
  locale: Locale
): string {
  if (!rawMarkdown || locale === 'fr') {
    return rawMarkdown || '';
  }

  const isAr = locale === 'ar';
  const lines = rawMarkdown.split(/\r?\n/);
  const out: string[] = [];

  const genderLabel = product.gender === 'women'
    ? (isAr ? 'نسائي' : "Women's")
    : product.gender === 'men'
    ? (isAr ? 'رجالي' : "Men's")
    : (isAr ? 'للجنسين' : "Unisex");

  const familyLabel = translateOlfactoryFamily(product.subcategoryLabel || 'Fragrance de Prestige', locale);

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const l = rawLine.trim();

    // Empty line
    if (!l) {
      out.push('');
      continue;
    }

    // 1. Heading 1 (Title)
    if (l.startsWith('# ')) {
      // Extract subtitle if exists after dash
      let subtitle = '';
      const dashMatch = l.match(/[–—\-]\s*(.+)$/);
      if (dashMatch) {
        const rawSub = dashMatch[1].replace(/\.$/, '').trim().toLowerCase();
        const found = SUBTITLE_TRANSLATIONS[rawSub];
        if (found) {
          subtitle = isAr ? found.ar : found.en;
        }
      }

      if (isAr) {
        out.push(`# ${product.name} من ${product.brandLabel} : عطر ${genderLabel} ${familyLabel}${subtitle ? ` – ${subtitle}` : ''}`);
      } else {
        out.push(`# ${product.name} by ${product.brandLabel}: ${genderLabel} ${familyLabel} Perfume${subtitle ? ` – ${subtitle}` : ''}`);
      }
      continue;
    }

    // 2. Lead Paragraph
    if (l.startsWith('Découvrez **') || l.startsWith('Découvrez ') || l.includes('célèbre l\'harmonie')) {
      if (isAr) {
        out.push(`اكتشفوا **${product.name} من ${product.brandLabel}**، إبداع عطري فاخر ${genderLabel} يحتفي بالتناغم والأصالة والتميز ضمن عائلة **${familyLabel}**. صُمم هذا العطر الاستثنائي لعشاق الفخامة العصرية، ليأخذكم في رحلة حسية ساحرة لا تُنسى.`);
      } else {
        out.push(`Discover **${product.name} by ${product.brandLabel}**, an exquisite ${genderLabel.toLowerCase()} creation celebrating harmony, individuality, and the depth of the **${familyLabel}** family. Crafted for lovers of refined, modern scents, this unique creation invites you on an unforgettable sensory journey.`);
      }
      continue;
    }

    // 3. Section Headings
    if (l.startsWith('### Notes de Tête')) {
      out.push(isAr ? '### النفحات العليا (القمة) : افتتاحية منعشة ومشرقة' : '### Top Notes: Fresh & Luminous Opening');
      continue;
    }
    if (l.startsWith('### Notes de Cœur')) {
      out.push(isAr ? '### النفحات الوسطى (القلب) : قلب عطري غني وساحر' : '### Heart Notes: Rich & Captivating Core');
      continue;
    }
    if (l.startsWith('### Notes de Fond')) {
      out.push(isAr ? '### النفحات الأساسية (القاعدة) : أثر عطري دافئ وثابت يدوم طويلاً' : '### Base Notes: Warm & Long-Lasting Trail');
      continue;
    }
    if (l.startsWith('## Caractéristiques Clés')) {
      out.push(isAr ? `## الخصائص والمواصفات الأساسية لعطر ${product.name}` : `## Key Characteristics of ${product.name}`);
      continue;
    }
    if (l.startsWith('## Pourquoi choisir')) {
      out.push(isAr ? `## لماذا تختار عطر ${product.name} ؟` : `## Why Choose ${product.name}?`);
      continue;
    }
    if (l.startsWith('## Quand le porter')) {
      out.push(isAr ? '## متى تتألق بهذا العطر ؟' : '## When to Wear It?');
      continue;
    }

    // 4. Bullet Points
    if (l.startsWith('- **') || l.startsWith('* **')) {
      const match = l.match(/^[-*]\s*\*\*(.+?)\*\*\s*:\s*(.+)$/);
      if (match) {
        const key = match[1].trim();
        const desc = match[2].trim();

        // Key Specs
        if (key === 'Concentration') {
          out.push(isAr
            ? `- **التركيز** : ${translateConcentration(product.subcategoryLabel || 'Eau de Parfum', 'ar')} – لثبات ممتاز وأثر عطري فواح يدوم طويلاً.`
            : `- **Concentration**: ${translateConcentration(product.subcategoryLabel || 'Eau de Parfum', 'en')} – ensuring remarkable scent intensity and long-lasting performance.`);
          continue;
        }
        if (key === 'Contenance') {
          const sizeStr = product.sizes?.map(s => s.label).join(' · ') || '100 ml';
          out.push(isAr
            ? `- **الحجم** : ${sizeStr} – سعة سخية وأنيقة تناسب استخدامك ومجموعتك الخاصة.`
            : `- **Volume**: ${sizeStr} – an elegant and generous format, perfect for your collection.`);
          continue;
        }
        if (key === 'Genre') {
          out.push(isAr
            ? `- **الفئة** : عطر ${genderLabel} – توليفة راقية وعصرية تناسب كافة الإطلالات.`
            : `- **Gender**: ${genderLabel} – a modern, universal fragrance crafted for every refined style.`);
          continue;
        }
        if (key === "Saison d'utilisation") {
          out.push(isAr
            ? `- **الموسم المثالي** : ${translateSeason(product.perfectSeason || 'Toutes Saisons', 'ar')} – تم اختياره بعناية ليتألق في هذه الأجواء.`
            : `- **Ideal Season**: ${translateSeason(product.perfectSeason || 'All Seasons', 'en')} – curated to flourish across these climates.`);
          continue;
        }

        // Value Proposition
        if (key === 'Une Fragrance Captivante et Évolutive') {
          out.push(isAr
            ? `- **تركيبة عطرية ساحرة ومتدرجة** : يبدأ عطر ${product.name} بنفحات افتتاحية منعشة ومشرقة، ثم يتطور إلى قلب غني وآسر، ليستقر على قاعدة دافئة وفاخرة تمنحك حضوراً جذاباً لا يُنسى.`
            : `- **A Captivating & Evolving Fragrance**: ${product.name} opens with vibrant, luminous top notes, develops into a rich heart, and settles on a warm, luxurious base that leaves a memorable impression.`);
          continue;
        }
        if (key === 'Qualité de Haute Parfumerie') {
          out.push(isAr
            ? '- **جودة العطور الفاخرة المعتمدة** : صُنع بأجود المكونات والزيوت العطرية النقية لضمان فوحان استثنائي وثبات يدوم طوال اليوم.'
            : '- **High Perfumery Quality**: Crafted with premium ingredients, ensuring remarkable projection and impeccable longevity all day and night.');
          continue;
        }
        if (key === 'Flacon de Prestige') {
          out.push(isAr
            ? `- **زجاجة فاخرة وأنيقة** : تصميم ملكي يعكس الفخامة والأناقة الراقية لدار ${product.brandLabel}، جامعاً بين الأصالة والجمال العصري.`
            : `- **Prestige Bottle**: The bottle mirrors the timeless luxury and craftsmanship of ${product.brandLabel}, pairing modern aesthetics with noble heritage.`);
          continue;
        }
        if (key === 'Un Parfum Signature') {
          out.push(isAr
            ? `- **بصمة عطرية فريدة تميز حضورك** : أكثر من مجرد عطر، إنه توقيع شمي راقٍ يعبر عن شخصيتك وأناقتك بثقة واقتدار.`
            : `- **A Signature Scent**: Far more than a fragrance, ${product.name} is an authentic olfactory signature celebrating your individuality with distinction.`);
          continue;
        }

        // Perfume Notes item: Translate note name and note description
        const noteNameAr = translatePerfumeNote(key, 'ar');
        const noteNameEn = translatePerfumeNote(key, 'en');

        const foundDesc = NOTE_DESC_TRANSLATIONS[desc];
        const descText = foundDesc
          ? (isAr ? foundDesc.ar : foundDesc.en)
          : (isAr
            ? 'مكون نخبوي فاخر تم اختياره بعناية ليعزز فخامة العطر وثباته الاستثنائي.'
            : "A distinguished luxury note carefully selected to enhance the fragrance's complexity and exceptional longevity.");

        if (isAr) {
          out.push(`- **${noteNameAr} (${key})** : ${descText}`);
        } else {
          out.push(`- **${noteNameEn} (${key})**: ${descText}`);
        }
        continue;
      }
    }

    // Bold bullet under "Quand le porter"
    if (l.startsWith('- **') || l.startsWith('* **')) {
      if (l.includes('Polyvalent et captivant') || l.includes('Parfait pour les beaux jours')) {
        out.push(isAr
          ? '- **عطر متعدد الاستخدامات وجذاب للغاية، يتناغم بسلاسة مع تغيرات الفصول، ويمنحك حضوراً واثقاً ومميزاً.**'
          : '- **Versatile and captivating, adapting seamlessly to seasonal shifts for a refined presence across all occasions.**');
        continue;
      }
    }

    // 5. Middle poetic description paragraphs
    const trimmedP = l.replace(/^["']|["']$/g, '').trim();
    const foundParagraph = MIDDLE_PARAGRAPHS[trimmedP] || MIDDLE_PARAGRAPHS[l];
    if (foundParagraph) {
      out.push(isAr ? foundParagraph.ar : foundParagraph.en);
      continue;
    }

    // Generic fallback for any other French descriptive paragraph
    if (l.startsWith('Ce produit est un parfum de démonstration')) {
      out.push(isAr
        ? `تستر أصلي 100% معتمد من دار **${product.brandLabel}**. يتميز بنفس تركيبة وثبات العطر الأصلي مع توفير استثنائي وضمان الأصالة.`
        : `100% authentic original tester from **${product.brandLabel}**. Features the exact same fragrance and longevity as the retail bottle with exceptional savings.`);
      continue;
    }

    out.push(rawLine);
  }

  return out.join('\n');
}

/**
 * Localizes short product description (tagline or description)
 */
export function localizeShortDescription(
  text: string | null | undefined,
  locale: Locale
): string {
  if (!text || locale === 'fr') return text || '';

  const clean = text.trim();
  const found = MIDDLE_PARAGRAPHS[clean];
  if (found) {
    return locale === 'ar' ? found.ar : found.en;
  }

  // Handle note bullet format in tagline: "- **Notes de tête** : Bergamote, Citron"
  if (clean.includes('Notes de tête')) {
    const notesPart = clean.split(':')[1]?.trim() || '';
    const translatedNotes = notesPart.split(',').map(n => translatePerfumeNote(n.trim(), locale)).join(' · ');
    return locale === 'ar'
      ? `النفحات العليا: ${translatedNotes}`
      : `Top notes: ${translatedNotes}`;
  }

  return clean;
}
