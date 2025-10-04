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
      
      let price;
      let quantity;

      // Check if the product has variants and the array is not empty
      if (productData.variants && Array.isArray(productData.variants) && productData.variants.length > 0) {
          const firstVariant = productData.variants[0];
          price = firstVariant.price;
          quantity = firstVariant.quantity;
      } else {
          // If no variants, use top-level price and quantity
          price = productData.price;
          quantity = productData.quantity;
      }

      // Now, check the final quantity and price to decide whether to include the product
      if (!quantity || quantity <= 0 || !price) {
          return; // Skip if no valid quantity or price is found
      }
      
      const productId = doc.id;
      const productName = productData.name;
      const productNameSlug = slugify(productName);
      const productLink = `${BASE_URL}/product-details/${productNameSlug}/${productId}`;

      // === বিবরণ (Description) ঠিক করার জন্য এই অংশটি পরিবর্তন করা হয়েছে ===
      // Raw description থেকে HTML ট্যাগ মুছে ফেলা হচ্ছে
      const rawDescription = productData.description || "No description available";
      const cleanDescription = rawDescription.replace(/<[^>]*>/g, '').trim();

      const item = rss.ele("item");
      item.ele("g:id").txt(productId).up();
      item.ele("g:title").txt(productData.name).up();
      // পরিষ্কার করা বিবরণ (description) ব্যবহার করা হচ্ছে
      item.ele("g:description").txt(cleanDescription).up();
      item.ele("g:link").txt(productLink).up();
      item.ele("g:image_link").txt(productData.imageUrls[0]).up();
      item.ele("g:availability").txt("in stock").up();
      item.ele("g:price").txt(`${price} BDT`).up(); // Use the determined price
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
