// Must come first: `src/lib/db` reads DATABASE_URL at import time.
import "./load-env";

import { sql } from "drizzle-orm";

import { db } from "../src/lib/db";
import {
  blogPostTags,
  blogPostTranslations,
  blogPosts,
  blogTagTranslations,
  blogTags,
  categories,
  categoryTranslations,
  discountCodes,
  productImages,
  productSpecs,
  productTranslations,
  productVariants,
  products,
  shippingRates,
  shippingZones,
  siteSettings,
} from "../src/lib/db/schema";

/**
 * Demo content for the storefront, mirroring the Unamonne design so the layout
 * can be reviewed against the artboards with real rows behind it.
 *
 * Destructive by design: it truncates the catalog, journal, shipping and
 * settings tables first, so re-running gives the same shop rather than a second
 * copy of it. Orders, carts and accounts are never touched.
 *
 *   npm run seed:demo
 */

// The photographs the design itself uses, so a review compares like with like.
const PHOTO = {
  campaign: "1596944924616-7b38e7cfac36",
  duo: "1620656798579-1984d9e87df7",
  portrait: "1611652022419-a9419f74343d",
  rings: "1584302179602-e4c3d3fd629d",
  hoops: "1617038220319-276d3cfab638",
  pearls: "1515562141207-7a88fb7ce338",
  crescent: "1599643478518-a784e5dc4c8f",
  chain: "1602173574767-37ac01994b2a",
} as const;

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=70`;

type Seeded = {
  slug: string;
  ka: { name: string; description: string };
  en: { name: string; description: string };
  category: "rings" | "earrings" | "necklaces";
  photos: string[];
  priceGel: number;
  priceUsd: number;
  stock: number;
  sku: string;
  editionSize: number | null;
  featured: boolean;
  outOfStock?: boolean;
  variants?: { label: string; stock: number; madeToOrder?: boolean }[];
  specs?: { ka: [string, string][]; en: [string, string][] };
};

const CATEGORIES = [
  {
    key: "rings" as const,
    ka: { name: "ბეჭდები", slug: "bechdebi", description: "ჩამოსხმული და ხელით მოჩარჩოებული, თითო სერიაში ორმოცამდე ცალი." },
    en: { name: "Rings", slug: "rings", description: "Cast and finished by hand, in runs of forty or fewer." },
  },
  {
    key: "earrings" as const,
    ka: { name: "საყურეები", slug: "sayureebi", description: "მსუბუქი, ყოველდღიური, ნიკელის გარეშე." },
    en: { name: "Earrings", slug: "earrings", description: "Light enough for every day, and always nickel-free." },
  },
  {
    key: "necklaces" as const,
    ka: { name: "ყელსაბამები", slug: "yelsabamebi", description: "ჯაჭვები იჭრება შეკვეთით — სიგრძე შეკვეთისას მიუთითეთ." },
    en: { name: "Necklaces", slug: "necklaces", description: "Chains are cut to length to order — tell us the centimetres at checkout." },
  },
];

const PRODUCTS: Seeded[] = [
  {
    slug: "selene-signet",
    ka: { name: "სელენეს ბეჭედი", description: "განიერი ნახევარმთვარე, ხელით ამოკვეთილი გადამუშავებულ 14k ოქროში. მარტო ნატარები წყნარია; ჯაჭვის რგოლთან ერთად — უკვე განცხადება." },
    en: { name: "Selene signet", description: "A wide crescent face, cut and engraved by hand in recycled 14k gold. Worn alone it reads quiet; stacked with the chain band it does the talking." },
    category: "rings",
    photos: [PHOTO.rings, PHOTO.duo, PHOTO.chain, PHOTO.hoops],
    priceGel: 109000,
    priceUsd: 39500,
    stock: 0,
    sku: "UNM-SIG-16",
    editionSize: 40,
    featured: true,
    variants: [
      { label: "15", stock: 2 },
      { label: "16", stock: 4 },
      { label: "17", stock: 1 },
      { label: "18", stock: 0 },
      { label: "19", stock: 0, madeToOrder: true },
    ],
    specs: {
      ka: [["ლითონი", "გადამუშავებული 14k ოქრო"], ["წონა", "6.4 გ"], ["ზედაპირი", "9 მმ, ხელით გრავირებული"], ["დამზადება", "თბილისი, საქართველო"], ["სერია", "40 ცალი"]],
      en: [["Metal", "Recycled 14k gold"], ["Weight", "6.4 g"], ["Face", "9 mm, hand-engraved"], ["Made in", "Tbilisi, Georgia"], ["Run", "40 pieces"]],
    },
  },
  {
    slug: "crescent-drops",
    ka: { name: "ნახევარმთვარის საყურეები", description: "მკვეთრი ჩრდილი, მსუბუქი წონა — ისეთი საყურეები, რომლებსაც საღამოს მოხსნა გავიწყდება." },
    en: { name: "Crescent drops", description: "A hard shadow and almost no weight — the pair you forget to take off in the evening." },
    category: "earrings",
    photos: [PHOTO.hoops, PHOTO.portrait],
    priceGel: 69000,
    priceUsd: 25000,
    stock: 11,
    sku: "UNM-EAR-02",
    editionSize: null,
    featured: true,
    specs: {
      ka: [["ლითონი", "გადამუშავებული 14k ოქრო"], ["წონა", "2.1 გ წყვილი"], ["საკეტი", "ბერკეტიანი"]],
      en: [["Metal", "Recycled 14k gold"], ["Weight", "2.1 g the pair"], ["Fastening", "Lever back"]],
    },
  },
  {
    slug: "tide-pearl-strand",
    ka: { name: "მოქცევის მარგალიტი", description: "მტკნარი წყლის მარგალიტი, ხელით დახარისხებული. კილოგრამიდან ოთხმოცამდე ცალი თუ მოხვდება ძაფზე." },
    en: { name: "Tide pearl strand", description: "Freshwater pearls, sorted by hand. Out of a kilo, maybe eighty make it onto a strand." },
    category: "necklaces",
    photos: [PHOTO.pearls, PHOTO.duo],
    priceGel: 82000,
    priceUsd: 29800,
    stock: 0,
    sku: "UNM-NCK-07",
    editionSize: null,
    featured: true,
    variants: [
      { label: "40 cm", stock: 3 },
      { label: "42 cm", stock: 1 },
      { label: "45 cm", stock: 0, madeToOrder: true },
    ],
  },
  {
    slug: "moon-pendant",
    ka: { name: "მთვარის გულსაკიდი", description: "ერთადერთი ნაჭერი სერიიდან, რომელსაც ქვა უჭირავს — და ერთადერთი, რომელიც ყოველთვის პირველი გაიყიდება." },
    en: { name: "Moon pendant", description: "The only piece in the run that holds a stone, and the only one that always goes first." },
    category: "necklaces",
    photos: [PHOTO.crescent],
    priceGel: 194000,
    priceUsd: 70500,
    stock: 0,
    sku: "UNM-NCK-01",
    editionSize: null,
    featured: true,
    outOfStock: true,
  },
  {
    slug: "chain-bracelet",
    ka: { name: "ჯაჭვის სამაჯური", description: "ყოველდღიური ჯაჭვი, სამ სისქეში. რგოლები ხელით არის შედუღებული." },
    en: { name: "Chain bracelet", description: "The everyday chain, in three weights. Every link is soldered by hand." },
    category: "necklaces",
    photos: [PHOTO.chain],
    priceGel: 124000,
    priceUsd: 45000,
    stock: 6,
    sku: "UNM-BRC-03",
    editionSize: 40,
    featured: false,
  },
  {
    slug: "vera-hoops",
    ka: { name: "ვერას რგოლები", description: "პატარა რგოლები, რომლებიც ყურს არ წევს. სახელოსნოს ეზოს სახელი ჰქვია." },
    en: { name: "Vera hoops", description: "Small hoops that do not pull. Named after the courtyard the studio sits in." },
    category: "earrings",
    photos: [PHOTO.hoops],
    priceGel: 54000,
    priceUsd: 19600,
    stock: 9,
    sku: "UNM-EAR-05",
    editionSize: null,
    featured: false,
  },
  {
    slug: "collar-chain",
    ka: { name: "საყელოს ჯაჭვი", description: "ყელის ძირზე ჯდება — ის სიგრძე, რომელიც სხვა ჯაჭვებს ხელს არ უშლის." },
    en: { name: "Collar chain", description: "Sits at the base of the throat — the length that leaves room for everything else." },
    category: "necklaces",
    photos: [PHOTO.duo, PHOTO.portrait],
    priceGel: 98000,
    priceUsd: 35600,
    stock: 4,
    sku: "UNM-NCK-11",
    editionSize: null,
    featured: false,
  },
  {
    slug: "thread-necklace",
    ka: { name: "ძაფისებრი ყელსაბამი", description: "იმდენად წვრილი, რომ ტარება გავიწყდება. ჩვენი ყველაზე გაყიდვადი პირველი ნაჭერი." },
    en: { name: "Thread necklace", description: "Fine enough that you forget you are wearing it. Most people's first piece from us." },
    category: "necklaces",
    photos: [PHOTO.portrait],
    priceGel: 61000,
    priceUsd: 22200,
    stock: 12,
    sku: "UNM-NCK-04",
    editionSize: null,
    featured: false,
  },
];

const TAGS = [
  { ka: { name: "სახელოსნო", slug: "sakhelosno" }, en: { name: "Workshop", slug: "workshop" } },
  { ka: { name: "გზამკვლევი", slug: "gzamkvlevi" }, en: { name: "Guide", slug: "guide" } },
  { ka: { name: "მასალა", slug: "masala" }, en: { name: "Material", slug: "material" } },
  { ka: { name: "მოვლა", slug: "movla" }, en: { name: "Care", slug: "care" } },
];

const POSTS = [
  {
    tag: 0,
    cover: PHOTO.chain,
    product: "selene-signet",
    featured: true,
    days: 11,
    ka: {
      title: "როგორ იძენს ნახევარმთვარე სახეს",
      slug: "rogor-idzens-nakhevarmtvare-sakhes",
      excerpt: "ოთხი გასმა საჭრისით, ერთი მრგვალებით — და რატომ ვამბობთ ჯერ კიდევ უარს ლაზერზე.",
    },
    en: {
      title: "How a crescent gets its face",
      slug: "how-a-crescent-gets-its-face",
      excerpt: "Four passes with a graver, one with a burnisher — and why we still refuse the laser.",
    },
  },
  {
    tag: 1,
    cover: PHOTO.portrait,
    product: null,
    featured: false,
    days: 27,
    ka: {
      title: "როგორ გაზომოთ ბეჭდის ზომა სახლში",
      slug: "rogor-gazomot-bechdis-zoma-sakhlshi",
      excerpt: "ქაღალდის ზოლი, სახაზავი და ორი წუთი. გააკეთეთ საღამოს, არასოდეს დილით.",
    },
    en: {
      title: "Measuring your ring size at home",
      slug: "measuring-your-ring-size-at-home",
      excerpt: "A paper strip, a ruler and two minutes. Do it in the evening, never in the morning.",
    },
  },
  {
    tag: 2,
    cover: PHOTO.rings,
    product: null,
    featured: false,
    days: 38,
    ka: {
      title: "რატომ ვასხამთ გადამუშავებულ ოქროში",
      slug: "ratom-vaskhamt-gadamushavebul-okroshi",
      excerpt: "ახალი მოპოვება არ გვჭირდება — ლითონი უსასრულოდ ბრუნდება ისე, რომ თვისებას არ კარგავს.",
    },
    en: {
      title: "Why we cast in recycled 14k",
      slug: "why-we-cast-in-recycled-14k",
      excerpt: "Nothing new needs to come out of the ground: gold returns forever without losing anything.",
    },
  },
  {
    tag: 3,
    cover: PHOTO.hoops,
    product: null,
    featured: false,
    days: 62,
    ka: {
      title: "სამკაულის მოვლა ზაფხულში",
      slug: "samkaulis-movla-zapkhulshi",
      excerpt: "ზღვა, კრემი და ოფლი — სამი მიზეზი, რის გამოც ოქრო ბზინვას კარგავს.",
    },
    en: {
      title: "Caring for gold in summer",
      slug: "caring-for-gold-in-summer",
      excerpt: "Salt water, sunscreen and sweat — the three reasons gold goes dull by August.",
    },
  },
  {
    tag: 0,
    cover: PHOTO.duo,
    product: null,
    featured: false,
    days: 74,
    ka: {
      title: "მაგიდა, რომელიც რუსთაველის 12-დან მოვიდა",
      slug: "magida-romelits-rustavelis-12-dan-movida",
      excerpt: "ჩვენს სამუშაო მაგიდას ორი პატრონი ჰყავდა ჩვენამდე. მასზე დარჩენილი კვალი სამუშაო არქივია.",
    },
    en: {
      title: "The bench that came from Rustaveli 12",
      slug: "the-bench-that-came-from-rustaveli-12",
      excerpt: "Our workbench had two owners before us. The dents in it are a working archive.",
    },
  },
];

/** Long enough to exercise the table of contents, the pull quote and the list. */
function body(locale: "ka" | "en", title: string): string {
  if (locale === "ka") {
    return [
      `ყოველი ნაჭერი იწყება ბრტყელი ოქროს ფირფიტით, ცხრა მილიმეტრის დიამეტრით. მასში ჯერ არაფერი მიანიშნებს სახეზე. ის, რაც შემდეგი ორმოცი წუთის განმავლობაში ხდება, ერთადერთი ეტაპია, რომლის დაჩქარებაც ვერასდროს შევძელით.`,
      `## ფირფიტა`,
      `ვასხამთ გადამუშავებულ 14k ოქროში — ძველი ჯაჭვები, საიუველირო ნარჩენები, თბილისის სხვა სახელოსნოების ნაჭრები. ლითონი გამწმენდიდან მარცვლის სახით ბრუნდება, ხვდება ტიგელში და გამოდის ყალიბიდან. გაცივებისას ზედაპირზე რჩება კანი, რომელიც ხელით უნდა მოიჭრას.`,
      `ჭრა დაახლოებით ათი წუთი გრძელდება და ყველაფერს განსაზღვრავს მის შემდეგ. ფირფიტა, რომელიც ნამდვილად ბრტყელი არაა, გრავირებაში რხევას გამოაჩენს, რომელსაც პრიალი ვერ დამალავს.`,
      `## ოთხი გასმა`,
      `ნახევარმთვარე შედის საჭრისით ოთხ გასმაში: კონტური, შიდა რკალი, წერტილი თვალისთვის და ორი მოკლე შტრიხი, რომლებიც მას მთვარიდან სახედ აქცევს. ყოველი გასმა თმაზე თხელ ოქროს ხვეულს იღებს.`,
      `> ხელით ამოკვეთილ ხაზს აქვს ნათელი კიდე, სადაც ლითონი გაწეულია და არა დამწვარი. სწორედ ესაა მთელი განსხვავება.`,
      `## რატომ არა ლაზერი`,
      `ლაზერი ამას ოთხმოცდაათ წამში გააკეთებდა და ყოველი ბეჭედი იდენტური იქნებოდა. ის ზედაპირს აორთქლებს და არა წევს, ამიტომ ხაზი ბრტყლად და ნაცრისფრად იკითხება.`,
      `- ამოკვეთილი ხაზი ორი კუთხიდან იჭერს შუქს, მანქანით გაკეთებული — არცერთიდან.`,
      `- ამოკვეთილი ხაზი ტარებისას ღრმავდება; დამწვარი ქრება.`,
      `- ორმოცი ცალი სეზონში ის მაქსიმუმია, რასაც ოთხი ადამიანი სწორად ამოკვეთს.`,
      `## რა ბერდება ლამაზად`,
      `დააბრუნეთ ბეჭედი ორი წლის შემდეგ და მაღალი წერტილები რბილი და თბილი გახდება, ხოლო ამოკვეთილი ხაზები მუქი დარჩება. სწორედ ეს კონტრასტია აზრი.`,
    ].join("\n\n");
  }

  return [
    `Every ${title.toLowerCase().includes("crescent") ? "Selene signet" : "piece"} starts as a flat gold blank, 9 mm across and slightly domed. Nothing about it suggests a face yet. What happens over the next forty minutes is the only part of the process we have never been able to speed up.`,
    `## The blank`,
    `We cast in recycled 14k — old chains, dental gold, offcuts from other studios in Tbilisi. The metal comes back from the refiner as grain, goes into the crucible, and out into a cuttlebone mould. It cools with a skin on it that has to be filed off by hand before anything else can happen.`,
    `Filing takes maybe ten minutes and decides everything after it. A blank that is not truly flat will show a wobble in the engraving that no amount of polishing hides.`,
    `## Four passes`,
    `The crescent goes in with a graver in four passes: outline, inner curve, the dot for the eye, then the two short strokes that make it a face rather than a moon. Each pass removes a curl of gold thinner than a hair, which we sweep off the bench and send back to the refiner at the end of the season.`,
    `> A hand-cut line has a bright edge where the metal is pushed, not burned. That is the whole difference, and you can see it from across a room.`,
    `## Why not a laser`,
    `A laser would do this in ninety seconds and every ring would be identical. It also vaporises the surface instead of displacing it, so the line reads flat and grey. Under a loupe you see a burnt trench; under daylight you see nothing at all.`,
    `- Cut lines catch light from two angles, machine-engraved lines from none.`,
    `- A cut line deepens as the ring wears; a burnt one fades.`,
    `- Forty pieces a season is the most four people can cut properly.`,
    `## What ages well`,
    `Bring a signet back after two years and the high points will have gone soft and warm while the engraved lines stay dark. That contrast is the point. We will re-polish the band for you once a year, and we will never touch the face.`,
  ].join("\n\n");
}

async function main() {
  console.log("seeding demo content…");

  // Wipe only what this script owns. Orders, carts and accounts are untouched;
  // cascades take the translations, images, variants and specs with them.
  await db.execute(
    sql`truncate table ${products}, ${categories}, ${blogPosts}, ${blogTags}, ${shippingZones}, ${discountCodes}, ${siteSettings} restart identity cascade`,
  );

  /* ------------------------------- categories ------------------------------ */
  const categoryIds = new Map<string, string>();

  for (const [index, category] of CATEGORIES.entries()) {
    const [row] = await db
      .insert(categories)
      .values({ sortOrder: index })
      .returning({ id: categories.id });
    categoryIds.set(category.key, row.id);

    await db.insert(categoryTranslations).values([
      { categoryId: row.id, locale: "ka", ...category.ka },
      { categoryId: row.id, locale: "en", ...category.en },
    ]);
  }

  /* -------------------------------- products ------------------------------- */
  const productIds = new Map<string, string>();

  for (const [index, item] of PRODUCTS.entries()) {
    const [row] = await db
      .insert(products)
      .values({
        categoryId: categoryIds.get(item.category)!,
        sku: item.sku,
        editionSize: item.editionSize,
        priceGel: item.priceGel,
        priceUsd: item.priceUsd,
        stock: item.stock,
        isFeatured: item.featured,
        isOutOfStock: item.outOfStock ?? false,
        sortOrder: index,
      })
      .returning({ id: products.id });
    productIds.set(item.slug, row.id);

    await db.insert(productTranslations).values([
      {
        productId: row.id,
        locale: "ka",
        name: item.ka.name,
        slug: `${item.slug}-ka`,
        description: item.ka.description,
      },
      {
        productId: row.id,
        locale: "en",
        name: item.en.name,
        slug: item.slug,
        description: item.en.description,
      },
    ]);

    await db.insert(productImages).values(
      item.photos.map((photo, order) => ({
        productId: row.id,
        url: img(photo),
        alt: item.en.name,
        sortOrder: order,
      })),
    );

    if (item.variants?.length) {
      await db.insert(productVariants).values(
        item.variants.map((variant, order) => ({
          productId: row.id,
          label: variant.label,
          sku: `${item.sku}-${variant.label.replace(/\s+/g, "")}`,
          stock: variant.stock,
          isMadeToOrder: variant.madeToOrder ?? false,
          sortOrder: order,
        })),
      );
    }

    if (item.specs) {
      await db.insert(productSpecs).values([
        ...item.specs.ka.map(([label, value], order) => ({
          productId: row.id,
          locale: "ka" as const,
          label,
          value,
          sortOrder: order,
        })),
        ...item.specs.en.map(([label, value], order) => ({
          productId: row.id,
          locale: "en" as const,
          label,
          value,
          sortOrder: order,
        })),
      ]);
    }
  }

  /* --------------------------------- journal ------------------------------- */
  const tagIds: string[] = [];

  for (const [index, tag] of TAGS.entries()) {
    const [row] = await db
      .insert(blogTags)
      .values({ sortOrder: index })
      .returning({ id: blogTags.id });
    tagIds.push(row.id);

    await db.insert(blogTagTranslations).values([
      { tagId: row.id, locale: "ka", ...tag.ka },
      { tagId: row.id, locale: "en", ...tag.en },
    ]);
  }

  const now = Date.now();

  for (const post of POSTS) {
    const [row] = await db
      .insert(blogPosts)
      .values({
        coverUrl: img(post.cover, 1600),
        status: "published",
        publishedAt: new Date(now - post.days * 86_400_000),
        isFeatured: post.featured,
        productId: post.product ? productIds.get(post.product)! : null,
      })
      .returning({ id: blogPosts.id });

    await db.insert(blogPostTranslations).values([
      {
        postId: row.id,
        locale: "ka",
        title: post.ka.title,
        slug: post.ka.slug,
        excerpt: post.ka.excerpt,
        body: body("ka", post.ka.title),
        seoTitle: post.ka.title,
        seoDescription: post.ka.excerpt,
        ogImage: img(post.cover, 1600),
      },
      {
        postId: row.id,
        locale: "en",
        title: post.en.title,
        slug: post.en.slug,
        excerpt: post.en.excerpt,
        body: body("en", post.en.title),
        seoTitle: post.en.title,
        seoDescription: post.en.excerpt,
        ogImage: img(post.cover, 1600),
      },
    ]);

    await db
      .insert(blogPostTags)
      .values({ postId: row.id, tagId: tagIds[post.tag] });
  }

  /* -------------------------------- shipping ------------------------------- */
  const [georgia] = await db
    .insert(shippingZones)
    .values({
      name: "საქართველო",
      countries: ["GE"],
      isGeorgia: true,
      isFallback: false,
      sortOrder: 0,
    })
    .returning({ id: shippingZones.id });

  const [world] = await db
    .insert(shippingZones)
    .values({
      name: "Rest of the world",
      countries: [],
      isGeorgia: false,
      isFallback: true,
      sortOrder: 1,
    })
    .returning({ id: shippingZones.id });

  await db.insert(shippingRates).values([
    { zoneId: georgia.id, currency: "GEL", rate: 1200, freeThreshold: 35000 },
    { zoneId: world.id, currency: "USD", rate: 1800, freeThreshold: 25000 },
  ]);

  /* -------------------------------- offers --------------------------------- */
  await db.insert(discountCodes).values({
    code: "WELCOME10",
    percentOff: 10,
    minSubtotalGel: 20000,
    minSubtotalUsd: 7500,
    isActive: true,
  });

  /* ------------------------------- editorial ------------------------------- */
  await db.insert(siteSettings).values([
    { key: "homeCampaignImage", value: img(PHOTO.campaign, 2000) },
    { key: "homeWorkshopImage", value: img(PHOTO.portrait, 1200) },
    { key: "homeNewsletterImage", value: img(PHOTO.hoops, 1200) },
    { key: "shopCampaignImage", value: img(PHOTO.campaign, 2000) },
  ]);

  console.log(
    `done — ${CATEGORIES.length} categories, ${PRODUCTS.length} products, ${POSTS.length} posts, 2 shipping zones, 1 offer code.`,
  );
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
