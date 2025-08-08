const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, doc, getDoc } = require("firebase/firestore");
const cloudinary = require("cloudinary").v2;

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function getPublicIdFromUrl(url) {
  try {
    const parts = url.split("/");
    const publicIdWithExtension = parts.slice(parts.indexOf("upload") + 2).join("/");
    return publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf("."));
  } catch (e) {
    console.error(`Could not parse public_id from URL: ${url}`);
    return null;
  }
}

async function cleanupOrphanedImages() {
  console.log("Starting cleanup process...");

  const firebaseApp = initializeApp(firebaseConfig);
  const db = getFirestore(firebaseApp);
  const safePublicIds = new Set();

  try {
    const productsSnapshot = await getDocs(collection(db, "products"));
    productsSnapshot.forEach((document) => {
      const product = document.data();
      if (product.imageUrls && Array.isArray(product.imageUrls)) {
        product.imageUrls.forEach(url => {
          const publicId = getPublicIdFromUrl(url);
          if (publicId) safePublicIds.add(publicId);
        });
      }
    });
    console.log(`Found ${safePublicIds.size} image public_ids in 'products'.`);
  } catch (error) {
    console.error("Error fetching from 'products':", error);
  }

  try {
    const storeDetailsRef = doc(db, "settings", "store_details");
    const storeDetailsSnap = await getDoc(storeDetailsRef);
    if (storeDetailsSnap.exists()) {
      const logoUrl = storeDetailsSnap.data().logoUrl;
      if (logoUrl) {
        const publicId = getPublicIdFromUrl(logoUrl);
        if (publicId) {
            safePublicIds.add(publicId);
            console.log("Found logo image.");
        }
      }
    }
  } catch (error) {
      console.error("Error fetching logo:", error);
  }

  try {
    const heroSliderRef = doc(db, "settings", "hero_slider");
    const heroSliderSnap = await getDoc(heroSliderRef);
    if (heroSliderSnap.exists()) {
        const slides = heroSliderSnap.data().slides;
        if (slides && Array.isArray(slides)) {
            slides.forEach(slide => {
                if(slide.imageUrl) {
                    const publicId = getPublicIdFromUrl(slide.imageUrl);
                    if (publicId) {
                        safePublicIds.add(publicId);
                    }
                }
            });
            console.log("Found slider images.");
        }
    }
  } catch (error) {
    console.error("Error fetching slider images:", error);
  }

  console.log(`Total safe public_ids found in Firebase: ${safePublicIds.size}`);

  const cloudinaryPublicIds = [];
  try {
    let next_cursor = null;
    do {
      const result = await cloudinary.search
        .expression('resource_type:image AND folder=sundorica')
        .max_results(500)
        .next_cursor(next_cursor)
        .execute();
      
      result.resources.forEach(resource => {
        cloudinaryPublicIds.push(resource.public_id);
      });

      next_cursor = result.next_cursor;
    } while (next_cursor);
    console.log(`Found ${cloudinaryPublicIds.length} total images in Cloudinary folder 'sundorica'.`);
  } catch (error) {
    console.error("Error fetching from Cloudinary:", error);
    return;
  }

  const idsToDelete = cloudinaryPublicIds.filter(publicId => !safePublicIds.has(publicId));

  console.log(`Found ${idsToDelete.length} orphan images to delete.`);

  if (idsToDelete.length > 0) {
    console.log("Deleting the following public IDs:", idsToDelete);
    try {
      for (let i = 0; i < idsToDelete.length; i += 100) {
          const batch = idsToDelete.slice(i, i + 100);
          await cloudinary.api.delete_resources(batch);
          console.log(`Deleted a batch of ${batch.length} images.`);
      }
      console.log("Cleanup complete. All orphan images have been deleted.");
    } catch (error) {
      console.error("Error deleting from Cloudinary:", error);
    }
  } else {
    console.log("No images to delete. Cloudinary folder 'sundorica' is clean.");
  }
}

cleanupOrphanedImages();
