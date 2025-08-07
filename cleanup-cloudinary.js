const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");
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
  const productsRef = collection(db, "products");
  const firebasePublicIds = new Set();

  try {
    const snapshot = await getDocs(productsRef);
    snapshot.forEach((doc) => {
      const product = doc.data();
      if (product.imageUrls && Array.isArray(product.imageUrls)) {
        product.imageUrls.forEach(url => {
          const publicId = getPublicIdFromUrl(url);
          if (publicId) {
            firebasePublicIds.add(publicId);
          }
        });
      }
    });
    console.log(`Found ${firebasePublicIds.size} unique image public_ids in Firebase.`);
  } catch (error) {
    console.error("Error fetching data from Firebase:", error);
    return;
  }

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
    console.error("Error fetching data from Cloudinary:", error);
    return;
  }

  const idsToDelete = cloudinaryPublicIds.filter(publicId => !firebasePublicIds.has(publicId));

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
      console.error("Error deleting resources from Cloudinary:", error);
    }
  } else {
    console.log("No images to delete. Cloudinary folder 'sundorica' is clean.");
  }
}

cleanupOrphanedImages();
