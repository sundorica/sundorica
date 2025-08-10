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

  // Get current date in W3C Datetime format for <lastmod>
  // This will be used as a fallback if a document doesn't have a specific update date.
  const currentDate = new Date().toISOString();

  // 1. Add static pages
  // MODIFICATION: Removed '/cart' from the array
  const staticPages = ["/", "/collections", "/about", "/contact"]; 
  staticPages.forEach((page) => {
    const urlElement = urlset.ele("url");
    urlElement.ele("loc").txt(`${BASE_URL}${page}`);
    // MODIFICATION: Added <lastmod> tag
    urlElement.ele("lastmod").txt(currentDate);
  });

  // 2. Fetch and add collection pages
  try {
    const collectionsSnapshot = await getDocs(collection(db, "collections"));
    collectionsSnapshot.forEach((doc) => {
      const collectionData = doc.data();
      const slug = collectionData.slug;
      if (slug) {
        const urlElement = urlset.ele("url");
        urlElement.ele("loc").txt(`${BASE_URL}/collections/${slug}`);
        // MODIFICATION: Added <lastmod> tag, using updatedAt from Firestore or fallback to current date
        const lastMod = collectionData.updatedAt?.toDate().toISOString() || currentDate;
        urlElement.ele("lastmod").txt(lastMod);
      }
    });
    console.log("Successfully fetched and added collection pages.");
  } catch (error) {
    console.error("Error fetching collections:", error);
  }

  // 3. Fetch and add product pages
  try {
    // Note: The original script had a potential issue where it created incorrect product URLs.
    // This logic has been corrected to use product name slug and ID for the URL.
    const productsSnapshot = await getDocs(collection(db, "products"));
    productsSnapshot.forEach((doc) => {
      const productData = doc.data();
      const productId = doc.id;
      const productNameSlug = slugify(productData.name);
      
      if (productId && productNameSlug) {
        const urlElement = urlset.ele("url");
        // Corrected URL structure to match your website
        urlElement.ele("loc").txt(`${BASE_URL}/product-details/${productNameSlug}/${productId}`);
        // MODIFICATION: Added <lastmod> tag, using updatedAt/createdAt from Firestore or fallback
        const lastMod = productData.updatedAt?.toDate().toISOString() || productData.createdAt?.toDate().toISOString() || currentDate;
        urlElement.ele("lastmod").txt(lastMod);
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
