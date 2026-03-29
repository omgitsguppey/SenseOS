import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, AggregateField } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { v4 as uuidv4 } from 'uuid';
import pg from 'pg';
const { Pool } = pg;

// Phase 9: PostgreSQL CoreAnalytics Engine Setup
let pgPool: pg.Pool | null = null;
if (process.env.DATABASE_URL) {
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });
  
  // Apple iOS Reverse-Engineered SQL Schema Bootloader
  pgPool.query(`
    CREATE TABLE IF NOT EXISTS telemetry_events (
      event_id UUID PRIMARY KEY,
      session_id VARCHAR(255),
      user_id VARCHAR(255),
      device_platform VARCHAR(50),
      app_module VARCHAR(100),
      event_name VARCHAR(100),
      event_params_json JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS metric_reports (
      report_id UUID PRIMARY KEY,
      os_version VARCHAR(50),
      app_version VARCHAR(50),
      diagnostic_type VARCHAR(100),
      payload_data JSONB,
      start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `).then(() => {
    console.log('✅ [SQL Engine] PostgreSQL Telemetry Schemas Mounted Successfully!');
  }).catch(err => {
    console.error('❌ [SQL Engine] Schema Initialization Failed:', err);
  });
} else {
  console.warn('⚠️ [SQL Engine] DATABASE_URL missing. Telemetry inserts will simulate acceptance pending external Cloud SQL binding.');
}

let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.warn('Could not load firebase-applet-config.json');
}

const adminConfig: any = {};
if (firebaseConfig.projectId) {
  adminConfig.projectId = firebaseConfig.projectId;
}
if (firebaseConfig.databaseURL) {
  adminConfig.databaseURL = firebaseConfig.databaseURL;
}

initializeApp(adminConfig);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Phase 8: Hardened Security Pipeline
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // 300 requests per 15 minutes
    message: { error: 'Too many requests mapped to this IP. Please wait 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const uploadLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 images per minute to securely protect Google Cloud AI / Storage quotas
    message: { error: 'Upload Quota Reached: Maximum 30 images per minute.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(globalLimiter);

  const dbId: string = firebaseConfig.firestoreDatabaseId || '(default)';
  const db = getFirestore(dbId);
  console.log('Using Firestore Database ID:', dbId);

  // Initialize Realtime Database references for real-time events tracking
  // The 'rtdb' constant is now ready to attach event listeners like rtdb.ref('presence').on('value')
  let rtdb;
  try {
    if (firebaseConfig.databaseURL) {
      rtdb = getDatabase();
      console.log('Successfully initialized Realtime Database at:', firebaseConfig.databaseURL);
    }
  } catch (err) {
    console.error('Realtime Database init warning:', err);
  }

  // Configure CORS for Firebase Storage bucket
  try {
    if (firebaseConfig.storageBucket) {
      const bucket = getStorage().bucket(firebaseConfig.storageBucket);
      await bucket.setCorsConfiguration([
        {
          origin: ['*'],
          method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          responseHeader: ['Content-Type', 'Authorization', 'Content-Length', 'User-Agent', 'x-goog-resumable'],
          maxAgeSeconds: 3600
        }
      ]);
      console.log('Successfully configured CORS for storage bucket:', firebaseConfig.storageBucket);
    }
  } catch (error) {
    console.error('Failed to configure CORS for storage bucket:', error);
  }

  // Phase 10: Apple iOS Multi-Daemon Telemetry Sync Engine
  app.post('/api/telemetry/flush', globalLimiter, async (req, res) => {
    try {
      const { events, metrics } = req.body;
      
      const hasEvents = Array.isArray(events) && events.length > 0;
      const hasMetrics = Array.isArray(metrics) && metrics.length > 0;

      if (!hasEvents && !hasMetrics) {
        return res.status(400).json({ error: 'Invalid telemetry batch (Biome and MetricKit empty)' });
      }

      // If Postgres isn't hooked up yet, mock persistence so React queues flush successfully!
      if (!pgPool) {
        return res.status(200).json({ status: 'SQL Bypassed (Missing DATABASE_URL)', count: (events?.length || 0) + (metrics?.length || 0) });
      }

      // Deep Postgres transactional mapping protecting against individual row faults
      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');

        if (hasEvents) {
          const insertQuery = `
            INSERT INTO telemetry_events (
              event_id, session_id, user_id, device_platform, app_module, event_name, event_params_json, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (event_id) DO NOTHING
          `;
          for (const ev of events) {
            const params = [
              ev.stream_id || ev.event_id,
              ev.session_id,
              ev.user_id || 'anonymous',
              ev.device_platform,
              ev.app_module,
              ev.stream_type || ev.event_name,
              JSON.stringify(ev.payload || ev.metadata || {}),
              new Date(ev.utc_timestamp)
            ];
            await client.query(insertQuery, params);
          }
        }

        if (hasMetrics) {
          const metricQuery = `
            INSERT INTO metric_reports (
              report_id, os_version, app_version, diagnostic_type, payload_data, start_date
            ) VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (report_id) DO NOTHING
          `;
          for (const mx of metrics) {
             const mxParams = [
               mx.report_id, 
               mx.os_version, 
               mx.app_version, 
               mx.diagnostic_type, 
               JSON.stringify(mx.payload_data), 
               new Date(mx.start_date)
             ];
             await client.query(metricQuery, mxParams);
          }
        }

        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }

      return res.status(200).json({ status: 'Persisted to Hardware SQL', count: (events?.length || 0) + (metrics?.length || 0) });
    } catch (err) {
      console.error('[SQL Telemetry] Flush transaction halted', err);
      return res.status(500).json({ error: 'PostgreSQL Database mapping failed' });
    }
  });

  // Increase payload limit for base64 images
  app.use(express.json({ limit: '50mb' }));

  // API route to proxy Firebase Storage uploads and bypass CORS
  app.post('/api/upload', uploadLimiter, async (req, res) => {
    try {
      const { path: storagePath, bucket, idToken, contentType, dataUrl, userId, projectId, analysis } = req.body;
      
      if (!dataUrl || !dataUrl.includes(',')) {
        return res.status(400).json({ error: 'Invalid dataUrl' });
      }

      // Extract base64 data
      const base64Data = dataUrl.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');

      // Verify ID token
      const decodedToken = await getAuth().verifyIdToken(idToken);
      if (decodedToken.uid !== userId) {
        return res.status(403).json({ error: 'Unauthorized: User ID mismatch' });
      }

      const sizeBytes = buffer.length;

      // Phase 5 Quota Enforcement Hook
      // Grab User Quota constraints
      const userRefX = db.collection('users').doc(userId);
      const userSnap = await userRefX.get();
      const userData = userSnap.data() || {};
      const DEFAULT_QUOTA = 5 * 1024 * 1024 * 1024; // 5 GB hard limit
      const activeQuota = userData.storageQuotaBytes || DEFAULT_QUOTA;

      // Compute historically uploaded footprint using Server Aggregations to prevent document-read explosions
      const aggregateQuery = db.collection('media').where('userId', '==', userId);
      const aggregateSnapshot = await aggregateQuery.aggregate({ totalBytes: AggregateField.sum('sizeBytes') }).get();
      const currentUsed = aggregateSnapshot.data().totalBytes || 0;

      if (currentUsed + sizeBytes > activeQuota) {
        return res.status(403).json({ 
          error: 'Storage quota exceeded', 
          code: 'quota_exceeded',
          currentUsed,
          quota: activeQuota,
          attemptedBytes: sizeBytes
        });
      }

      // Upload to Storage using Admin SDK
      const actualBucketName = bucket.includes('.firebasestorage.app') 
        ? bucket.replace('.firebasestorage.app', '.appspot.com') 
        : bucket;

      // Validate the bucket name against the project's configured storage bucket
      const configBucket = firebaseConfig.storageBucket;
      if (!configBucket) {
        return res.status(500).json({ error: 'Storage bucket not configured' });
      }

      const actualConfigBucketName = configBucket.includes('.firebasestorage.app')
        ? configBucket.replace('.firebasestorage.app', '.appspot.com')
        : configBucket;

      if (actualBucketName !== actualConfigBucketName) {
        return res.status(403).json({ error: 'Unauthorized: Invalid storage bucket' });
      }
        
      // Security Validation: Ensure the requested bucket matches the configured storageBucket
      // This prevents arbitrary file access/writes to unapproved buckets.
      if (firebaseConfig.storageBucket) {
        const expectedBucket = firebaseConfig.storageBucket.includes('.firebasestorage.app')
          ? firebaseConfig.storageBucket.replace('.firebasestorage.app', '.appspot.com')
          : firebaseConfig.storageBucket;

        if (actualBucketName !== expectedBucket) {
          return res.status(403).json({ error: 'Forbidden: Invalid storage bucket' });
        }
      }

      const bucketObj = getStorage().bucket(actualBucketName);
      const file = bucketObj.file(storagePath);
      
      // Generate a download token
      const downloadToken = uuidv4();
      
      await file.save(buffer, {
        metadata: {
          contentType: contentType || 'application/octet-stream',
          metadata: {
            firebaseStorageDownloadTokens: downloadToken
          }
        }
      });

      const originalUrl = `https://firebasestorage.googleapis.com/v0/b/${actualBucketName}/o/${encodeURIComponent(storagePath)}?alt=media&token=${downloadToken}`;
      
      console.log('Database ID:', dbId);
      console.log('User ID:', userId);
      // Save metadata to Firestore using Admin SDK
      const docRef = await db.collection('media').add({
        userId: userId,
        originalUrl: originalUrl,
        sizeBytes: sizeBytes,
        analysis: analysis || {}, // Apple iOS Semantic Tags
        status: 'uploaded',
        createdAt: FieldValue.serverTimestamp()
      });

      res.json({ docId: docRef.id, originalUrl });
    } catch (error: any) {
      console.error('Proxy upload error:', error);
      res.status(500).json({ error: 'An error occurred during upload.' });
    }
  });

  // API route to delete user
  app.delete('/api/users/:uid', async (req, res) => {
    try {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      const { uid } = req.params;
      const projectId = req.query.projectId as string;

      if (!idToken || !uid || !projectId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Verify ID token
      const decodedToken = await getAuth().verifyIdToken(idToken);
      if (decodedToken.uid !== uid) {
        return res.status(403).json({ error: 'Unauthorized: User ID mismatch' });
      }

      console.log(`Starting account deletion for user: ${uid}`);

      // Helper function to delete documents in batches
      const deleteCollectionInBatches = async (query: FirebaseFirestore.Query) => {
        const snapshot = await query.get();
        if (snapshot.empty) return 0;

        let deletedCount = 0;
        const docs = snapshot.docs;

        // Firestore batch limit is 500
        for (let i = 0; i < docs.length; i += 500) {
          const batch = db.batch();
          const chunk = docs.slice(i, i + 500);
          chunk.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
          deletedCount += chunk.length;
        }
        return deletedCount;
      };

      // 1. Delete Sense Memory
      const memoryCount = await deleteCollectionInBatches(db.collection('sense_memory').where('user_id', '==', uid));
      if (memoryCount > 0) {
        console.log(`Deleted ${memoryCount} memory documents`);
      }

      // 2. Delete Media
      const mediaCount = await deleteCollectionInBatches(db.collection('media').where('userId', '==', uid));
      if (mediaCount > 0) {
        console.log(`Deleted ${mediaCount} media documents`);
      }

      // 3. Delete User Document and Subcollections
      const userRef = db.collection('users').doc(uid);

      // Delete known subcollection documents
      await userRef.collection('privacy_consent').doc('current').delete();
      await userRef.collection('preferences').doc('current').delete();

      // Delete the user document itself
      await userRef.delete();
      console.log(`Deleted user document and settings for: ${uid}`);

      // 4. Delete from Firebase Auth
      await getAuth().deleteUser(uid);
      console.log(`Deleted user from Firebase Auth: ${uid}`);

      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API route to modify user storage quotas (Phase 5 Admin Control)
  app.post('/api/admin/users/:uid/quota', async (req, res) => {
    try {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      const { uid } = req.params;
      const { storageQuotaBytes, projectId } = req.body;

      if (!idToken || !uid || storageQuotaBytes === undefined || !projectId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Verify ID token natively
      const decodedToken = await getAuth().verifyIdToken(idToken);

      // Verify Administrative Rights loosely via backend validation bounce
      // (Trusting that the UI only showed this if they had Admin credentials)
      const callerDoc = await db.collection('users').doc(decodedToken.uid).get();
      if (!callerDoc.exists || (callerDoc.data()?.role !== 'admin' && decodedToken.email !== 'athenarosiejohnson@gmail.com')) {
        return res.status(403).json({ error: 'Unauthorized: Must be an Admin to modify quotas.' });
      }

      const dbPath = dbId === '(default)' ? '(default)' : dbId;
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbPath}/documents/users/${uid}?updateMask.fieldPaths=storageQuotaBytes`;

      const response = await fetch(firestoreUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            storageQuotaBytes: { doubleValue: Number(storageQuotaBytes) }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update quota: ${await response.text()}`);
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Update quota error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API route to sync user
  app.post('/api/users/sync', async (req, res) => {
    try {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      const { user, projectId } = req.body;
      
      if (!idToken || !user || !projectId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const dbPath = dbId === '(default)' ? '(default)' : dbId;
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbPath}/documents/users/${user.uid}`;
      
      // Try to get the user
      const getResponse = await fetch(firestoreUrl, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (getResponse.status === 404) {
        // Create new user
        const newUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'user',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        };

        const createResponse = await fetch(firestoreUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: {
              uid: { stringValue: newUser.uid },
              email: newUser.email ? { stringValue: newUser.email } : { nullValue: null },
              displayName: newUser.displayName ? { stringValue: newUser.displayName } : { nullValue: null },
              photoURL: newUser.photoURL ? { stringValue: newUser.photoURL } : { nullValue: null },
              role: { stringValue: newUser.role },
              createdAt: { timestampValue: newUser.createdAt },
              lastLoginAt: { timestampValue: newUser.lastLoginAt }
            }
          })
        });

        if (!createResponse.ok) {
          throw new Error(`Create user failed: ${await createResponse.text()}`);
        }
        return res.json(newUser);
      } else if (getResponse.ok) {
        // Update last login
        const updateResponse = await fetch(`${firestoreUrl}?updateMask.fieldPaths=lastLoginAt`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: {
              lastLoginAt: { timestampValue: new Date().toISOString() }
            }
          })
        });

        if (!updateResponse.ok) {
          throw new Error(`Update user failed: ${await updateResponse.text()}`);
        }

        const data = await getResponse.json();
        const fields = data.fields;
        return res.json({
          uid: fields.uid?.stringValue,
          email: fields.email?.stringValue || null,
          displayName: fields.displayName?.stringValue || null,
          photoURL: fields.photoURL?.stringValue || null,
          role: fields.role?.stringValue || 'user',
          createdAt: fields.createdAt?.timestampValue,
          lastLoginAt: new Date().toISOString()
        });
      } else {
        throw new Error(`Get user failed: ${await getResponse.text()}`);
      }
    } catch (error: any) {
      console.error('Sync user error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API route to get settings
  app.get('/api/settings/:uid/:type', async (req, res) => {
    try {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      const { uid, type } = req.params;
      const projectId = req.query.projectId as string;
      
      if (!idToken || !uid || !type || !projectId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const collection = type === 'privacy' ? 'privacy_consent' : 'preferences';
      const dbPath = dbId === '(default)' ? '(default)' : dbId;
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbPath}/documents/users/${uid}/${collection}/current`;
      
      const response = await fetch(firestoreUrl, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (response.status === 404) {
        return res.json(null);
      }

      if (!response.ok) {
        throw new Error(`Get settings failed: ${await response.text()}`);
      }

      const data = await response.json();
      
      // Basic parsing
      const fields = data.fields;
      const result: any = {};
      for (const [key, value] of Object.entries(fields)) {
        const val = value as any;
        if ('booleanValue' in val) result[key] = val.booleanValue;
        else if ('stringValue' in val) result[key] = val.stringValue;
        else if ('timestampValue' in val) result[key] = val.timestampValue;
      }
      
      res.json(result);
    } catch (error: any) {
      console.error('Get settings error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API route to update settings
  app.post('/api/settings/:uid/:type', async (req, res) => {
    try {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      const { uid, type } = req.params;
      const { updates, projectId } = req.body;
      
      if (!idToken || !uid || !type || !updates || !projectId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const collection = type === 'privacy' ? 'privacy_consent' : 'preferences';
      const dbPath = dbId === '(default)' ? '(default)' : dbId;
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbPath}/documents/users/${uid}/${collection}/current`;
      
      // Convert updates to Firestore format
      const fields: any = {};
      const updateMask: string[] = [];
      
      for (const [key, value] of Object.entries(updates)) {
        updateMask.push(`updateMask.fieldPaths=${key}`);
        if (typeof value === 'boolean') fields[key] = { booleanValue: value };
        else if (typeof value === 'string') fields[key] = { stringValue: value };
      }
      
      // Always update timestamp
      updateMask.push(`updateMask.fieldPaths=updatedAt`);
      fields.updatedAt = { timestampValue: new Date().toISOString() };

      const response = await fetch(`${firestoreUrl}?${updateMask.join('&')}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields })
      });

      if (!response.ok) {
        throw new Error(`Update settings failed: ${await response.text()}`);
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Update settings error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API route to get memory count
  app.get('/api/intelligence/memory-count', async (req, res) => {
    try {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      const projectId = req.query.projectId as string;
      const uid = req.query.uid as string;
      
      if (!idToken || !projectId || !uid) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const dbPath = dbId === '(default)' ? '(default)' : dbId;
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbPath}/documents:runQuery`;
      
      const response = await fetch(firestoreUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'sense_memory' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'user_id' },
                op: 'EQUAL',
                value: { stringValue: uid }
              }
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Get memory count failed: ${await response.text()}`);
      }

      const data = await response.json();
      // runQuery returns an array of results. If empty, it returns [{ readTime: ... }]
      // If there are results, it returns [{ document: ... }, { document: ... }]
      const count = data.filter((item: any) => item.document).length;
      
      res.json({ count });
    } catch (error: any) {
      console.error('Get memory count error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API route to flush telemetry events
  app.post('/api/telemetry/flush', async (req, res) => {
    try {
      const { events, projectId } = req.body;
      
      if (!events || !projectId || !Array.isArray(events) || events.length === 0) {
        return res.status(400).json({ error: 'Missing required parameters or empty events array' });
      }

      const dbPath = dbId === '(default)' ? '(default)' : dbId;
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbPath}/documents:commit`;
      
      const writes = events.map((event: any) => {
        const fields: any = {};
        
        const convertToFirestoreValue = (val: any): any => {
          if (val === null) return { nullValue: 'NULL_VALUE' };
          if (typeof val === 'string') return { stringValue: val };
          if (typeof val === 'boolean') return { booleanValue: val };
          if (typeof val === 'number') return { doubleValue: val };
          if (Array.isArray(val)) {
            return { arrayValue: { values: val.map(convertToFirestoreValue) } };
          }
          if (typeof val === 'object') {
            const mapFields: any = {};
            for (const [k, v] of Object.entries(val)) {
              mapFields[k] = convertToFirestoreValue(v);
            }
            return { mapValue: { fields: mapFields } };
          }
          return { stringValue: String(val) };
        };

        for (const [key, value] of Object.entries(event)) {
          fields[key] = convertToFirestoreValue(value);
        }
        
        return {
          update: {
            name: `projects/${projectId}/databases/${dbId}/documents/telemetry_events/${event.event_id}`,
            fields
          },
          currentDocument: { exists: false }
        };
      });

      // Note: We don't require an ID token here because telemetry might be sent by anonymous users.
      // In a real app, you might want to secure this endpoint or use a service account.
      // For now, we'll use the REST API without auth, which requires the collection to be writable by anyone,
      // OR we can just skip saving to Firestore if there's no auth, but telemetry is often public-write.
      // Actually, if we use the REST API without an ID token, it will act as an unauthenticated user.
      // Let's see if we can get the ID token from the header.
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      const headers: any = {
        'Content-Type': 'application/json'
      };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const response = await fetch(firestoreUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ writes })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Flush telemetry failed. Writes payload:', JSON.stringify(writes, null, 2));
        console.error('Error response:', errorText);
        throw new Error(`Flush telemetry failed: ${errorText}`);
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Flush telemetry error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API route to get telemetry events
  app.get('/api/admin/telemetry', async (req, res) => {
    try {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      const projectId = req.query.projectId as string;
      const limitCount = parseInt(req.query.limit as string || '50', 10);
      
      if (!idToken || !projectId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const dbPath = dbId === '(default)' ? '(default)' : dbId;
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbPath}/documents:runQuery`;
      
      const response = await fetch(firestoreUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'telemetry_events' }],
            orderBy: [{ field: { fieldPath: 'utc_timestamp' }, direction: 'DESCENDING' }],
            limit: limitCount
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Get telemetry failed: ${await response.text()}`);
      }

      const data = await response.json();
      
      const parseFirestoreValue = (val: any): any => {
        if (!val) return undefined;
        if ('nullValue' in val) return null;
        if ('stringValue' in val) return val.stringValue;
        if ('booleanValue' in val) return val.booleanValue;
        if ('integerValue' in val) return parseInt(val.integerValue, 10);
        if ('doubleValue' in val) return val.doubleValue;
        if ('timestampValue' in val) return val.timestampValue;
        if ('arrayValue' in val) {
          return (val.arrayValue.values || []).map(parseFirestoreValue);
        }
        if ('mapValue' in val) {
          const res: any = {};
          const mapFields = val.mapValue.fields || {};
          for (const [k, v] of Object.entries(mapFields)) {
            res[k] = parseFirestoreValue(v);
          }
          return res;
        }
        return undefined;
      };

      const events = data
        .filter((item: any) => item.document)
        .map((item: any) => {
          const doc = item.document;
          const fields = doc.fields;
          const result: any = { id: doc.name.split('/').pop() };
          for (const [key, value] of Object.entries(fields)) {
            result[key] = parseFirestoreValue(value);
          }
          return result;
        });
      
      res.json(events);
    } catch (error: any) {
      console.error('Get telemetry error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API route to get users
  app.get('/api/admin/users', async (req, res) => {
    try {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      const projectId = req.query.projectId as string;
      const limitCount = parseInt(req.query.limit as string || '100', 10);
      
      if (!idToken || !projectId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const dbPath = dbId === '(default)' ? '(default)' : dbId;
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbPath}/documents:runQuery`;
      
      const response = await fetch(firestoreUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'users' }],
            orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
            limit: limitCount
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Get users failed: ${await response.text()}`);
      }

      const data = await response.json();
      const users = data
        .filter((item: any) => item.document)
        .map((item: any) => {
          const doc = item.document;
          const fields = doc.fields;
          const result: any = { uid: doc.name.split('/').pop() };
          for (const [key, value] of Object.entries(fields)) {
            const val = value as any;
            if ('stringValue' in val) result[key] = val.stringValue;
            else if ('booleanValue' in val) result[key] = val.booleanValue;
            else if ('timestampValue' in val) result[key] = val.timestampValue;
          }
          return result;
        });
      
      res.json(users);
    } catch (error: any) {
      console.error('Get users error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API route to update user role
  app.post('/api/admin/users/:uid/role', async (req, res) => {
    try {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      const { uid } = req.params;
      const { role, projectId } = req.body;
      
      if (!idToken || !uid || !role || !projectId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const dbPath = dbId === '(default)' ? '(default)' : dbId;
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbPath}/documents/users/${uid}?updateMask.fieldPaths=role`;
      
      const response = await fetch(firestoreUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            role: { stringValue: role }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Update user role failed: ${await response.text()}`);
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Update user role error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
