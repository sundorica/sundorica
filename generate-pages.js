// generate-pages.js

const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");
const fs = require('fs');
const path = require('path');

// আপনার index.html ফাইল থেকে নেওয়া Firebase কনফিগারেশন
const firebaseConfig = {
    apiKey: "AIzaSyBKK4FmXtcMniVv6_5-mFPBJICwEM5Dkzc",
    authDomain: "nasir-9102c.firebaseapp.com",
    projectId: "nasir-9102c",
    storageBucket: "nasir-9102c.appspot.com",
    messagingSenderId: "182224792140",
    appId: "1:182224792140:web:42348e8b24f94cdf07e2e9",
    measurementId: "G-8R5J241MJM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// HTML ট্যাগ সরানোর জন্য একটি সহজ ফাংশন
function stripHtml(html) {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, '');
}

async function generateProductPages() {
    const distPath = path.join(__dirname, 'dist');
    // পুরোনো dist ফোল্ডার ডিলিট করুন
    if (fs.existsSync(distPath)) {
        fs.rmSync(distPath, { recursive: true, force: true });
        console.log('Old dist folder deleted.');
    }

    console.log('Fetching products from Firebase...');
    const productsSnapshot = await getDocs(collection(db, "products"));
    const products = [];
    productsSnapshot.forEach(doc => {
        products.push({ id: doc.id, ...doc.data() });
    });
    console.log(`Found ${products.length} products.`);

    // আপনার টেমপ্লেট ফাইলটি লোড করুন
    const templatePath = path.join(__dirname, 'product-details', 'index.html');
    if (!fs.existsSync(templatePath)) {
        console.error("ERROR: Template file not found at", templatePath);
        return;
    }
    const template = fs.readFileSync(templatePath, 'utf-8');

    let generatedCount = 0;
    for (const product of products) {
        if (product.status !== 'active') continue;

        // মেটা ডেসক্রিপশন তৈরি
        const plainTextDescription = stripHtml(product.description);
        const metaDescription = (plainTextDescription.substring(0, 160) || `Buy ${product.name} from Sundorica. High quality and great prices.`).replace(/"/g, '&quot;');

        // প্রোডাক্ট ডিটেইলস এর জন্য HTML তৈরি
        const productDetailsHtml = `
            <div class="product-details-layout">
                <div class="product-gallery">
                    <div class="main-image">
                        <img src="${product.imageUrls ? product.imageUrls[0] : ''}" alt="${product.name}" style="width:100%; border-radius: 8px;">
                    </div>
                </div>
                <div class="product-info-details">
                    <h1 class="product-name">${product.name}</h1>
                    <div class="product-price">Tk ${product.price}</div>
                    <div class="product-description">
                        <h3>Description</h3>
                        <div>${product.description || 'No description available.'}</div>
                    </div>
                </div>
            </div>`;

        // টেমপ্লেটের মধ্যে ডাইনামিক কন্টেন্ট বসান
        let productPageHtml = template
            .replace(/<title>.*<\/title>/, `<title>${product.name} - Sundorica</title>`)
            .replace(/<meta name="description" content=".*">/, `<meta name="description" content="${metaDescription}">`)
            .replace(/<div id="product-details-container">[\s\S]*?<\/div>/, `<div id="product-details-container">${productDetailsHtml}</div>`);
            
        // প্রোডাক্টের জন্য ফোল্ডার তৈরি করুন
        const productSlug = (product.name || 'product').toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
        const outputDir = path.join(distPath, 'product-details', productSlug, product.id);
        fs.mkdirSync(outputDir, { recursive: true });

        // নতুন HTML ফাইল সেইভ করুন
        fs.writeFileSync(path.join(outputDir, 'index.html'), productPageHtml);
        console.log(`Generated page for: ${product.name}`);
        generatedCount++;
    }

    console.log(`\nSuccessfully generated ${generatedCount} product pages in the "dist" folder!`);
}

generateProductPages().catch(console.error);