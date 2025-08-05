// ফাইলের নাম: generate-sitemap.js

const admin = require('firebase-admin');
const builder = require('xmlbuilder');
const fs = require('fs');

// GitHub Secret থেকে Firebase Key পড়া
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT secret is not set in GitHub Actions.");
}
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Firebase App চালু করা (আপনার দেওয়া সঠিক URL সহ)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://nasir-9102c-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.firestore();
const DOMAIN = "https://www.sundorica.com"; // আপনার ডোমেইন

// প্রোডাক্টের নাম থেকে slug তৈরির ফাংশন
function createSlug(name) {
    if (!name) return '';
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

async function generateSitemap() {
  console.log('Starting sitemap generation...');
  const root = builder.create('urlset', { version: '1.0', encoding: 'UTF-8' }).att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');

  // স্ট্যাটিক পেইজের লিংক
  root.ele('url').ele('loc', `${DOMAIN}/`);
  root.ele('url').ele('loc', `${DOMAIN}/all-products/`);
  root.ele('url').ele('loc', `${DOMAIN}/cart/`);

  // কালেকশন পেইজের লিংক
  const collectionsSnap = await db.collection('collections').get();
  collectionsSnap.forEach(doc => {
    const collection = doc.data();
    if (collection.slug) {
        root.ele('url').ele('loc', `${DOMAIN}/collections/${collection.slug}`);
    }
  });

  // সকল অ্যাক্টিভ প্রোডাক্টের লিংক
  const productsSnap = await db.collection('products').where('status', '==', 'active').get();
  productsSnap.forEach(doc => {
    const product = doc.data();
    const productSlug = createSlug(product.name);
    const productId = doc.id;
    root.ele('url').ele('loc', `${DOMAIN}/product-details/${productSlug}/${productId}`);
  });

  // sitemap.xml ফাইলটি তৈরি করা
  fs.writeFileSync('sitemap.xml', xml);
  console.log('Sitemap generated successfully!');
}

generateSitemap().catch(error => {
    console.error('Sitemap generation failed:', error);
    process.exit(1);
});
