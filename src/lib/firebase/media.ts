import { auth, db, storage } from './config';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../../../firebase-applet-config.json';

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
  try {
    const mediaId = crypto.randomUUID();
    const path = `users/${userId}/photos/originals/${mediaId}-${file.name}`;
    
    onProgress(0); // Indicate start
    
    if (!auth.currentUser) {
      throw new Error("User is not authenticated");
    }
    
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(Math.round(progress));
        }, 
        (error) => {
          console.error('Upload task error:', error);
          reject(error);
        }, 
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Save metadata to Firestore
            const docRef = await addDoc(collection(db, 'media'), {
              userId,
              originalUrl: downloadURL,
              status: 'uploaded',
              createdAt: serverTimestamp()
            });
            
            onProgress(100);
            resolve(docRef.id);
          } catch (err) {
            console.error('Error saving metadata:', err);
            reject(err);
          }
        }
      );
    });
  } catch (error) {
    console.error('Upload task error:', error);
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
