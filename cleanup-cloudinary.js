// cleanup-cloudinary.js

const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");
const cloudinary = require("cloudinary").v2;

// --- Firebase এবং Cloudinary কনফিগারেশন ---
// এই তথ্যগুলো GitHub Secrets থেকে আসবে, যা আমরা পরের ধাপে সেট করব
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// --- মূল ফাংশন ---

async function cleanupOrphanedImages() {
  console.log("Starting cleanup process...");

  // ১. Firebase থেকে বর্তমানে ব্যবহৃত সব ছবির URL সংগ্রহ করা
  const firebaseApp = initializeApp(firebaseConfig);
  const db = getFirestore(firebaseApp);
  const productsRef = collection(db, "products");
  const firebaseImageUrls = new Set();

  try {
    const snapshot = await getDocs(productsRef);
    snapshot.forEach((doc) => {
      const product = doc.data();
      if (product.imageUrls && Array.isArray(product.imageUrls)) {
        product.imageUrls.forEach(url => firebaseImageUrls.add(url));
      }
    });
    console.log(`Found ${firebaseImageUrls.size} unique image URLs in Firebase.`);
  } catch (error) {
    console.error("Error fetching data from Firebase:", error);
    return; // Firebase থেকে ডেটা না পেলে কাজ বন্ধ
  }

  // ২. Cloudinary থেকে সব ছবির তালিকা আনা
  const cloudinaryImagePublicIds = new Map();
  try {
    let next_cursor = null;
    do {
      const result = await cloudinary.search
        .expression('resource_type:image') // শুধু ছবি খুঁজবে
        .max_results(500) // একবারে ৫০০টি করে আনবে
        .next_cursor(next_cursor)
        .execute();
      
      result.resources.forEach(resource => {
        cloudinaryImagePublicIds.set(resource.secure_url, resource.public_id);
      });

      next_cursor = result.next_cursor;
    } while (next_cursor);
    console.log(`Found ${cloudinaryImagePublicIds.size} total images in Cloudinary.`);
  } catch (error) {
    console.error("Error fetching data from Cloudinary:", error);
    return; // Cloudinary থেকে ডেটা না পেলে কাজ বন্ধ
  }

  // ৩. অপ্রয়োজনীয় বা "Orphan" ছবি খুঁজে বের করা
  const idsToDelete = [];
  for (const [url, public_id] of cloudinaryImagePublicIds.entries()) {
    if (!firebaseImageUrls.has(url)) {
      idsToDelete.push(public_id);
    }
  }

  console.log(`Found ${idsToDelete.length} orphan images to delete.`);

  // ৪. অপ্রয়োজনীয় ছবিগুলো ডিলিট করা
  if (idsToDelete.length > 0) {
    console.log("Deleting the following public IDs:", idsToDelete);
    try {
      // একবারে সর্বোচ্চ ১০০টি ডিলিট করা যায়, তাই আমরা ব্যাচ করে পাঠাচ্ছি
      for (let i = 0; i < idsToDelete.length; i += 100) {
          const batch = idsToDelete.slice(i, i + 100);
          await cloudinary.api.delete_resources(batch);
          console.log(`Deleted a batch of ${batch.length} images.`);
      }
      console.log("Cleanup complete. All orphan images have been deleted.");
    } catch (error) {
      console.error("Error deleting resources from Cloudinary:", error);
    }
  } else {
    console.log("No images to delete. Cloudinary is clean.");
  }
}

// ফাংশনটি চালানো
cleanupOrphanedImages();
