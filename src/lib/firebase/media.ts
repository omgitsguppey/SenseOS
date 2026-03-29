import { auth, db, functions } from './config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import firebaseConfig from '../../../firebase-applet-config.json';
import { v4 as uuidv4 } from 'uuid';

export interface MediaMetadata {
  id?: string;
  userId: string;
  originalUrl: string;
  thumbnailUrl?: string;
  blurredUrl?: string;
  status: 'uploaded' | 'queued' | 'analyzing' | 'complete' | 'failed' | 'moderated' | 'archived';
  analysis?: Record<string, any>;
  moderation?: Record<string, any>;
  centsSpent?: number;
  createdAt: any;
}

export async function uploadMedia(
  userId: string, 
  file: File, 
  onProgress: (progress: number) => void
): Promise<string> {
  onProgress(10); // Initialize conversion
  
  if (!auth.currentUser) {
    throw new Error("User is not authenticated");
  }

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  try {
    const fileData = await toBase64(file);
    onProgress(30);

    const uploadMediaFunction = httpsCallable(functions, 'uploadMediaFunction');
    onProgress(50); // Inform UI that request is en route
    
    const result = await uploadMediaFunction({
      fileName: file.name,
      fileType: file.type,
      fileData
    });

    onProgress(100);
    return (result.data as any).id;
  } catch (error) {
    console.error('Cloud function upload failed:', error);
    throw error;
  }
}

export function subscribeToMedia(userId: string, callback: (media: MediaMetadata[]) => void) {
  if (!auth.currentUser) {
    console.warn("Cannot subscribe to media: User not authenticated");
    return () => {};
  }

  const q = query(
    collection(db, 'media'),
    where('userId', '==', userId)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const mediaList: MediaMetadata[] = [];
    snapshot.forEach((doc) => {
      mediaList.push({ id: doc.id, ...doc.data() } as MediaMetadata);
    });
    
    // Sort on client side to avoid requiring a composite index in Firestore
    mediaList.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : Date.now());
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : Date.now());
      return timeB - timeA;
    });
    
    callback(mediaList);
  }, (error) => {
    console.error('Error subscribing to media:', error);
  });

  return unsubscribe;
}
