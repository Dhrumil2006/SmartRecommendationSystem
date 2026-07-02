import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBq-NDLjJWN7unAtkqBX7DEH9Vqb7RAm8g",
  authDomain: "gen-lang-client-0354614929.firebaseapp.com",
  projectId: "gen-lang-client-0354614929",
  storageBucket: "gen-lang-client-0354614929.firebasestorage.app",
  messagingSenderId: "1048248566239",
  appId: "1:1048248566239:web:ca45a93efe61ca5f4d446a"
};

const databaseId = "ai-studio-3778c063-8f2f-47ad-a0d9-bf34782b1af3";

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, databaseId);

// Test connection as instructed by critical directive
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connected successfully");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: Client is offline");
    } else {
      console.warn("Connection test completed (this is normal if 'test' document doesn't exist):", error);
    }
  }
}

// Run test connection
testConnection();
