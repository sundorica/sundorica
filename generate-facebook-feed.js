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
    productsSnapshot.forEach((doc) => {
      const productData = doc.data();

      // ব্যবহারকারীর অনুরোধ অনুযায়ী, quantity শূন্য বা কম হলে ফিডে যোগ করা হবে না
      if (!productData.quantity || productData.quantity <= 0) {
        return; // Skip this product
      }
      
      const productId = doc.id;
      const category = productData.collections && productData.collections[0] ? productData.collections[0] : 'general';
      const categorySlug = slugify(category);
      const productLink = `${BASE_URL}/product-details/${categorySlug}/${productId}`;

      const item = rss.ele("item");
      item.ele("g:id").txt(productId).up();
      item.ele("g:title").txt(productData.name).up();
      item.ele("g:description").txt(productData.description || "No description available").up();
      item.ele("g:link").txt(productLink).up();
      item.ele("g:image_link").txt(productData.imageUrls[0]).up();
      item.ele("g:availability").txt("in stock").up(); // যেহেতু আমরা আগেই ফিল্টার করেছি
      item.ele("g:price").txt(`${productData.price} BDT`).up();
      item.ele("g:brand").txt("Sundorica").up(); // ডিফল্ট ব্র্যান্ডের নাম
      item.ele("g:condition").txt("new").up();
    });
    console.log("Successfully fetched products for Facebook feed.");
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  const xml = rss.end({ prettyPrint: true });
  fs.writeFileSync("facebook_feed.xml", xml);
  console.log("facebook_feed.xml successfully generated!");
}

generateFacebookFeed();
