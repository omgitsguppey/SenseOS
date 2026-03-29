import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFunctions } from 'firebase/functions';
import firebaseConfig from '../../../firebase-applet-config.json';

// Initialize Firebase only if it hasn't been initialized yet
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Core Services
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const storage = getStorage(app, 'gs://' + firebaseConfig.storageBucket);
export const rtdb = getDatabase(app);
export const functions = getFunctions(app);

// Validate Connection to Firestore
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
    // Skip logging for other errors, as this is simply a connection test.
  }
}
testConnection();

// Analytics (Layer A: Tracking Engine Foundation)
// Only initialize if supported in the current environment (e.g., browser)
export let analytics: any = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});
