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

function getFileNameFromUrl(url) {
  try {
    const parts = url.split("/");
    return parts.pop().split('.')[0];
  } catch (e) {
    console.error(`Could not parse file name from URL: ${url}`);
    return null;
  }
}

async function cleanupOrphanedImages() {
  console.log("Starting cleanup process...");

  const firebaseApp = initializeApp(firebaseConfig);
  const db = getFirestore(firebaseApp);
  const productsRef = collection(db, "products");
  const firebaseFileNames = new Set();

  try {
    const snapshot = await getDocs(productsRef);
    snapshot.forEach((doc) => {
      const product = doc.data();
      if (product.imageUrls && Array.isArray(product.imageUrls)) {
        product.imageUrls.forEach(url => {
          const fileName = getFileNameFromUrl(url);
          if (fileName) {
            firebaseFileNames.add(fileName);
          }
        });
      }
    });
    console.log(`Found ${firebaseFileNames.size} unique image file names in Firebase.`);
  } catch (error) {
    console.error("Error fetching data from Firebase:", error);
    return;
  }

  const cloudinaryPublicIdsToDelete = [];
  try {
    let next_cursor = null;
    do {
      const result = await cloudinary.search
        .expression('resource_type:image AND folder=sundorica')
        .max_results(500)
        .next_cursor(next_cursor)
        .execute();

      result.resources.forEach(resource => {
        const publicIdWithoutFolder = resource.public_id.split('/').pop();
        if (!firebaseFileNames.has(publicIdWithoutFolder)) {
          cloudinaryPublicIdsToDelete.push(resource.public_id);
        }
      });

      next_cursor = result.next_cursor;
    } while (next_cursor);
    console.log(`Found ${cloudinaryPublicIdsToDelete.length} orphan images to delete in Cloudinary folder 'sundorica'.`);
  } catch (error) {
    console.error("Error fetching data from Cloudinary:", error);
    return;
  }

  if (cloudinaryPublicIdsToDelete.length > 0) {
    console.log("Deleting the following public IDs:", cloudinaryPublicIdsToDelete);
    try {
      for (let i = 0; i < cloudinaryPublicIdsToDelete.length; i += 100) {
        const batch = cloudinaryPublicIdsToDelete.slice(i, i + 100);
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
