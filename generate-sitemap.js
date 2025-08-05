// generate-sitemap.js

const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");
const { create } = require("xmlbuilder2");
const fs = require("fs");

// Helper function to convert text to a URL-friendly slug
function slugify(text) {
  if (typeof text !== 'string') return '';
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
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

  // 1. Add static pages - আপনার অন্য কোনো পেজ থাকলে এখানে যোগ করুন
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
      // Get the category from the first item in the 'collections' array field
      const category = productData.collections && productData.collections[0] ? productData.collections[0] : 'general';
      const categorySlug = slugify(category);
      
      if (productId && categorySlug) {
        urlset.ele("url").ele("loc").txt(`${BASE_URL}/product-details/${categorySlug}/${productId}`).up();
      }
    });
    console.log("Successfully fetched and added product pages.");
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  // Convert the XML object to a string
  const xml = urlset.end({ prettyPrint: true });

  // Write the sitemap to a file in the root directory
  fs.writeFileSync("sitemap.xml", xml);
  console.log("sitemap.xml successfully generated!");
}

generateSitemap();
