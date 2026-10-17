const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const slug = 'difference-edt-edp-extrait-parfum';

  const title = "Eau de Toilette, Eau de Parfum ou Extrait : quelles différences et comment choisir au Maroc ?";
  const metaTitle = "Différence EDT, EDP, Extrait de Parfum : Guide Maroc | NAY";
  const metaDescription = "Comprendre les concentrations de parfum (EDT, EDP, Extrait), leur tenue sous le climat marocain et comment choisir votre signature olfactive.";
  const excerpt = "Comprendre les véritables concentrations de la parfumerie, décrypter l'équilibre entre sillage et tenue, et choisir la formule idéale sous le climat marocain.";
  const coverImage = "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1200&q=80";
  const category = "Guides & Conseils";
  const author = "NAY Parfums";
  const status = "draft"; // STRICTLY DRAFT as requested
  const tags = JSON.stringify([
    "guide parfum",
    "eau de parfum",
    "eau de toilette",
    "extrait de parfum",
    "tenue parfum maroc",
    "testeur authentique"
  ]);

  const relatedProductSlugs = JSON.stringify([
    "acqua-di-gio-eau-de-toilette-giorgio-armani-tester",
    "chanel-bleu-de-chanel-eau-de-parfum-tester",
    "amouage-interlude-man-tester",
    "Creed-Absolu-Aventus-Tester"
  ]);

  const ctaText = "Explorer notre sélection de parfums et testeurs";
  const ctaLink = "/fr/testeurs";

  const content = `
<p class="lead">Lorsque l'on explore l'univers de la haute parfumerie, les mentions <em>Eau de Toilette</em>, <em>Eau de Parfum</em> ou <em>Extrait de Parfum</em> figurent en lettres d'or sur chaque flacon. Pourtant, beaucoup d'amateurs de fragrances s'interrogent : s'agit-il simplement d'une question de puissance, ou bien d'une architecture olfactive fondamentalement différente ?</p>

<p>Au Maroc, où le thermomètre et l'hygrométrie varient considérablement entre la brise océanique de <strong>Casablanca</strong> ou <strong>Rabat</strong>, le climat sec de <strong>Marrakech</strong> et la fraîcheur continentale de l'intérieur, choisir la concentration adéquate est un art subtil. Dans ce guide de référence, la Maison <strong>NAY Parfum</strong> décrypte pour vous la science des concentrations, démystifie les idées reçues sur la tenue et vous accompagne dans le choix de votre prochaine signature olfactive.</p>

<h2>Qu'est-ce que la concentration en parfumerie ?</h2>
<p>Tout parfum est constitué d'un <strong>concentré odorant</strong> (un assemblage minutieux d'huiles essentielles, d'absolues et de molécules aromatiques) dilué dans un solvant, principalement de l'<strong>alcool éthylique dénaturé</strong> complété d'une fraction d'eau pure.</p>

<p>L'alcool joue un rôle physico-chimique capital : il préserve le concentré olfactif, facilite sa vaporisation fine et assure sa diffusion dans l'air ambiant grâce à sa volatilité. Plus la proportion de concentré huileux est élevée par rapport à l'alcool, plus la dénomination commerciale s'élève :</p>

<ul>
  <li><strong>Eau de Cologne (EDC) :</strong> généralement entre 2% et 5% de concentré. Conçue pour une fraîcheur immédiate et éphémère.</li>
  <li><strong>Eau de Toilette (EDT) :</strong> généralement entre 8% et 14% de concentré. Aérienne, vive et communicative.</li>
  <li><strong>Eau de Parfum (EDP) :</strong> généralement entre 15% et 20% de concentré. L'équilibre par excellence entre présence et tenue.</li>
  <li><strong>Extrait de Parfum (ou Parfum Pur) :</strong> généralement entre 20% et 40% de concentré. La quintessence de l'intensité et de l'intimité.</li>
</ul>

<div style="background-color: #f8fafc; border-left: 4px solid #0ea5e9; padding: 20px; border-radius: 12px; margin: 28px 0;">
  <p style="margin: 0; color: #0369a1; font-weight: 700;">💡 Le Saviez-Vous ?</p>
  <p style="margin: 8px 0 0 0; color: #334155; font-size: 15px; line-height: 1.6;">Le pourcentage exact de concentré n'est pas standardisé de manière universelle par la loi. Deux Eaux de Parfum de marques différentes peuvent afficher des concentrations distinctes. De plus, une concentration plus élevée ne signifie pas automatiquement une projection plus forte, comme nous allons le voir.</p>
</div>

<h2>Tableau comparatif des concentrations de parfum</h2>
<div class="overflow-x-auto my-8">
  <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
    <thead>
      <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
        <th style="padding: 12px 16px; font-weight: 700;">Dénomination</th>
        <th style="padding: 12px 16px; font-weight: 700;">Concentration moyenne</th>
        <th style="padding: 12px 16px; font-weight: 700;">Type de sillage (Projection)</th>
        <th style="padding: 12px 16px; font-weight: 700;">Moments recommandés</th>
        <th style="padding: 12px 16px; font-weight: 700;">Comportement au Maroc</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 16px; font-weight: 600;">Eau de Toilette (EDT)</td>
        <td style="padding: 12px 16px;">8% – 14%</td>
        <td style="padding: 12px 16px;">Diffusif et rayonnant</td>
        <td style="padding: 12px 16px;">Journée, bureau, sport, printemps/été</td>
        <td style="padding: 12px 16px;">Idéal en climat côtier humide (Casablanca, Tanger)</td>
      </tr>
      <tr style="border-bottom: 1px solid #e2e8f0; background-color: #fafaf9;">
        <td style="padding: 12px 16px; font-weight: 600;">Eau de Parfum (EDP)</td>
        <td style="padding: 12px 16px;">15% – 20%</td>
        <td style="padding: 12px 16px;">Équilibré et enveloppant</td>
        <td style="padding: 12px 16px;">Quotidien élégant, soirées, toutes saisons</td>
        <td style="padding: 12px 16px;">La valeur sûre polyvalente partout au Royaume</td>
      </tr>
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 16px; font-weight: 600;">Extrait de Parfum</td>
        <td style="padding: 12px 16px;">20% – 40%</td>
        <td style="padding: 12px 16px;">Dense, intime et persistant</td>
        <td style="padding: 12px 16px;">Cérémonies, mariages, soirées fraîches</td>
        <td style="padding: 12px 16px;">Exceptionnel en soirée et face à la brise nocturne</td>
      </tr>
    </tbody>
  </table>
</div>

<h2>L'Eau de Toilette (EDT) : La vivacité et le sillage expressif</h2>
<p>L'<strong>Eau de Toilette</strong> se distingue par une prédominance de <em>notes de tête</em> volatiles et pétillantes : agrumes de Méditerranée (bergamote, citron, mandarine), accords aquatiques vivifiants, herbes aromatiques et baies fraîches. Grâce à une teneur plus importante en alcool, les molécules odorantes s'échappent rapidement de la peau pour créer un halo immédiat.</p>

<p>Elle est particulièrement prisée pour les activités matinales, le travail en espace clos et les journées chaudes, car elle ne sature jamais l'atmosphère. Pour les amateurs de fraîcheur marine comme <a href="/fr/product/acqua-di-gio-eau-de-toilette-giorgio-armani-tester"><strong>Acqua Di Gio</strong></a>, l'EDT procure cette sensation vivifiante inégalée.</p>

<h2>L'Eau de Parfum (EDP) : La signature universelle</h2>
<p>Véritable standard de l'élégance contemporaine, l'<strong>Eau de Parfum</strong> accorde une importance capitale aux <em>notes de cœur</em> (fleurs précieuses, épices raffinées, touches fruitées ou aromatiques) et aux <em>notes de fond</em> (ambre noble, muscs blancs, fève tonka). Moins volatile que l'EDT, elle offre une texture plus soyeuse et s'accroche durablement aux fibres textiles.</p>

<p>C'est la formule idéale si vous souhaitez appliquer votre parfum le matin et continuer à en percevoir les nuances au fil de vos réunions et de vos sorties en soirée sans devoir renouveler l'application. Des créations iconiques telles que <a href="/fr/product/chanel-bleu-de-chanel-eau-de-parfum-tester"><strong>Bleu de Chanel Eau de Parfum</strong></a> incarnent cette polyvalence absolue.</p>

<h2>L'Extrait de Parfum : L'opulence confidentielle</h2>
<p>L'<strong>Extrait de Parfum</strong> représente l'apogée du luxe olfactif. Avec une forte teneur en matières premières nobles et très peu d'eau, sa texture est presque huileuse au toucher. Contrairement à ce que l'on pourrait penser, l'Extrait ne projette pas forcément à dix mètres : il forme une aura intime, un sillage proche du corps qui ne se dévoile qu'à ceux qui s'approchent de vous.</p>

<p>En revanche, sa rémanence sur la peau et les tissus nobles (laine, soie, cachemire) est stupéfiante, pouvant persister plusieurs jours. Les grandes maisons de niche comme <em>Amouage</em> ou <em>Xerjoff</em> excellent dans ce registre avec des compositions d'une richesse magistrale, à l'image d'un sillage oriental boisé.</p>

<h2>La distinction essentielle : Tenue versus Sillage</h2>
<p>L'une des erreurs les plus fréquentes est de confondre <strong>la tenue</strong> (longevity) et <strong>le sillage</strong> (projection ou sillage) :</p>

<ul>
  <li><strong>Le Sillage :</strong> C'est la trace olfactive que vous laissez derrière vous lorsque vous vous déplacez, et la distance à laquelle votre entourage perçoit votre fragrance. Le sillage dépend principalement de la volatilité des molécules et du taux d'alcool. Une Eau de Toilette fraîche peut avoir un sillage initial très puissant !</li>
  <li><strong>La Tenue :</strong> C'est la durée pendant laquelle les molécules demeurent perceptibles sur votre peau ou vos vêtements. Elle dépend de la lourdeur des molécules de fond (bois de cèdre, résines d'ambre, vanille, patchouli) et du pourcentage de concentré.</li>
</ul>

<blockquote>
  <p>« Un grand parfum ne s'impose pas par effraction : il invite à la rencontre. Il évolue avec la chaleur de votre corps et raconte une histoire en trois actes tout au long de la journée. »</p>
</blockquote>

<h2>Comment adapter votre choix au climat marocain ?</h2>
<p>Le climat du Maroc présente des spécificités géographiques uniques qu'il convient de prendre en compte dans le choix de votre concentration :</p>

<ol>
  <li><strong>Sur le littoral atlantique et méditerranéen (Casablanca, Rabat, Tanger) :</strong> L'hygrométrie élevée et l'air marin ralentissent l'évaporation des alcools tout en amplifiant les notes florales et fraîches. L'Eau de Toilette et l'Eau de Parfum s'y expriment à merveille.</li>
  <li><strong>Dans les régions intérieures et chaudes (Marrakech, Fès, Agadir en été) :</strong> La chaleur sèche accélère l'envol des notes de tête d'une EDT en moins d'une heure. Privilégiez l'<strong>Eau de Parfum</strong> appliquée sur les vêtements plutôt que sur une peau exposée au soleil, ou optez pour un <strong>Extrait</strong> en soirée.</li>
  <li><strong>Pour les cérémonies et mariages marocains :</strong> Face aux grandes salles de réception et aux tenues traditionnelles somptueuses (caftans, djellabas en tissus lourds), l'<strong>Eau de Parfum intense</strong> ou l'<strong>Extrait de Parfum</strong> à base de notes boisées, d'ambre ou d'oud apportent la prestance indispensable.</li>
</ol>

<h2>L'opportunité des Testeurs Authentiques chez NAY Parfum</h2>
<p>Que vous choisissiez une Eau de Toilette ou une Eau de Parfum, saviez-vous que vous pouvez accéder aux plus grandes marques internationales tout en optimisant votre investissement grâce aux <strong>testeurs originaux certifiés</strong> ?</p>

<p>Un testeur de parfum authentique contient <strong>exactement le même concentré olfactif</strong>, sort des mêmes chaînes de production à Grasse ou à Paris, et offre une concentration identique à celle du flacon scellé vendu sous blister. La seule différence réside dans son conditionnement simplifié (boîte neutre blanche ou brune). Pour un usage personnel quotidien, c'est le secret le mieux gardé des passionnés de parfumerie au Maroc.</p>

<h2>Foire Aux Questions (FAQ)</h2>

<h3>La concentration garantit-elle une durée précise sur la peau ?</h3>
<p>Non. La tenue dépend également de la nature de votre peau (une peau sèche retient moins bien les molécules qu'une peau hydratée), de la famille olfactive (les agrumes s'évaporent plus vite que les bois ambrés) et de la température ambiante.</p>

<h3>Peut-on vaporiser un Extrait de Parfum sur ses vêtements ?</h3>
<p>Il est recommandé de vaporiser l'Extrait à environ 20 centimètres, de préférence sur l'ourlet intérieur ou les doublures des vêtements pour éviter les taches sur les tissus très clairs ou délicats, en raison de sa forte concentration huileuse.</p>

<h3>Comment bien conserver son flacon face à la chaleur estivale au Maroc ?</h3>
<p>Conservez impérativement vos flacons à l'abri de la lumière directe du soleil, des chocs thermiques et de l'humidité. Évitez la salle de bain ou le rebord de fenêtre : un tiroir de commode ou une armoire tempérée est le lieu idéal.</p>
  `.trim();

  const post = await prisma.blogPost.upsert({
    where: { slug },
    update: {
      title,
      metaTitle,
      metaDescription,
      excerpt,
      content,
      coverImage,
      category,
      author,
      status, // DRAFT
      tags,
      relatedProductSlugs,
      ctaText,
      ctaLink
    },
    create: {
      slug,
      title,
      metaTitle,
      metaDescription,
      excerpt,
      content,
      coverImage,
      category,
      author,
      status, // DRAFT
      tags,
      relatedProductSlugs,
      ctaText,
      ctaLink
    }
  });

  console.log("Cornerstone article created as DRAFT successfully!");
  console.log("ID:", post.id);
  console.log("Slug:", post.slug);
  console.log("Status:", post.status);
}

main()
  .catch((e) => {
    console.error("Error creating cornerstone article draft:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
