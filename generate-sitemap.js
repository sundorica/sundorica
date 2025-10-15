// generate-sitemap.js

const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");
const { create } = require("xmlbuilder2");
const fs = require("fs");


// Helper function to convert text to a URL-friendly slug
function slugify(text) {
  if (typeof text !== 'string') return '';
  return text.toString().toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "").replace(/\-\-+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
}

// Your Firebase configuration is read from environment variables (GitHub Secrets)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BASE_URL = "https://www.sundorica.com";

async function generateSitemap() {
  const urlset = create({ version: "1.0", encoding: "UTF-8" }).ele("urlset", {
    xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9",
  });

  // 1. Add static pages
  const staticPages = ["/", "/collections", "/cart", "/about", "/contact"]; 
  staticPages.forEach((page) => {
    urlset.ele("url").ele("loc").txt(`${BASE_URL}${page}`).up();
  });

  // 2. Fetch and add collection pages
  try {
    const collectionsSnapshot = await getDocs(collection(db, "collections"));
    collectionsSnapshot.forEach((doc) => {
      const slug = doc.data().slug;
      if (slug) {
        urlset.ele("url").ele("loc").txt(`${BASE_URL}/collections/${slug}`).up();
      }
    });
    console.log("Successfully fetched and added collection pages.");
  } catch (error) {
    console.error("Error fetching collections:", error);
  }

  // 3. Fetch and add product pages
  try {
    const productsSnapshot = await getDocs(collection(db, "products"));
    productsSnapshot.forEach((doc) => {
      const productData = doc.data();
      const productId = doc.id;
      // === এই অংশটি পরিবর্তন করা হয়েছে ===
      const productName = productData.name;
      const productNameSlug = slugify(productName);
      
      if (productId && productNameSlug) {
        urlset.ele("url").ele("loc").txt(`${BASE_URL}/product-details/${productNameSlug}/${productId}`).up();
      }
    });
    console.log("Successfully fetched and added product pages.");
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  const xml = urlset.end({ prettyPrint: true });
  fs.writeFileSync("sitemap.xml", xml);
  console.log("sitemap.xml successfully generated!");
}

generateSitemap();
