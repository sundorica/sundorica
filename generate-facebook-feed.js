// generate-facebook-feed.js

const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");
const { create } = require("xmlbuilder2");
const fs = require("fs");

// Helper function to convert text to a URL-friendly slug
function slugify(text) {
  if (typeof text !== 'string') return '';
  return text.toString().toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "").replace(/\-\-+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
}

// Your Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BASE_URL = "https://www.sundorica.com";

async function generateFacebookFeed() {
  const rss = create({ version: "1.0", encoding: "UTF-8" })
    .ele("rss", { "xmlns:g": "http://base.google.com/ns/1.0", version: "2.0" })
    .ele("channel")
    .ele("title").txt("Sundorica Product Feed").up()
    .ele("link").txt(BASE_URL).up()
    .ele("description").txt("Product feed for Sundorica's Facebook Catalog.").up();

  try {
    const productsSnapshot = await getDocs(collection(db, "products"));
    console.log(`Found ${productsSnapshot.size} products in the collection.`);

    productsSnapshot.forEach((doc) => {
      const productData = doc.data();

      // === এই অংশটি পরিবর্তন করা হয়েছে ===
      // Check if variants exist and is an array with at least one item
      if (!productData.variants || !Array.isArray(productData.variants) || productData.variants.length === 0) {
        return;
      }

      const firstVariant = productData.variants[0];

      // Check for quantity inside the first variant
      if (!firstVariant.quantity || firstVariant.quantity <= 0) {
        return;
      }
      
      const productId = doc.id;
      const productName = productData.name;
      const productNameSlug = slugify(productName);
      const productLink = `${BASE_URL}/product-details/${productNameSlug}/${productId}`;

      const item = rss.ele("item");
      item.ele("g:id").txt(productId).up();
      item.ele("g:title").txt(productData.name).up();
      item.ele("g:description").txt(productData.description || "No description available").up();
      item.ele("g:link").txt(productLink).up();
      item.ele("g:image_link").txt(productData.imageUrls[0]).up();
      item.ele("g:availability").txt("in stock").up();
      // Price is now taken from the variant
      item.ele("g:price").txt(`${firstVariant.price} BDT`).up();
      item.ele("g:brand").txt("Sundorica").up();
      item.ele("g:condition").txt("new").up();
    });
    console.log("Successfully processed products for Facebook feed.");
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  const xml = rss.end({ prettyPrint: true });
  fs.writeFileSync("facebook_feed.xml", xml);
  console.log("facebook_feed.xml successfully generated!");
}

generateFacebookFeed();
