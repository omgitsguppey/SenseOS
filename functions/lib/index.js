"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMediaFunction = exports.analyzeMedia = exports.processTelemetryEvent = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
const storage_1 = require("firebase-admin/storage");
const genai_1 = require("@google/genai");
const uuid_1 = require("uuid");
const firebaseConfig = {
    projectId: "gen-lang-client-0938925035",
    storageBucket: "gen-lang-client-0938925035.firebasestorage.app",
    firestoreDatabaseId: "ai-studio-08029c71-bbbd-4208-a360-a49f0535cc44"
};
admin.initializeApp({
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket
});
// Bind specifically to the custom AI Studio database ID
const db = (0, firestore_1.getFirestore)(admin.app(), firebaseConfig.firestoreDatabaseId);
const ai = new genai_1.GoogleGenAI({});
/**
 * Cloud Function to process raw telemetry events into daily summaries.
 * Triggered when a new document is written to the `telemetry_events` collection.
 */
exports.processTelemetryEvent = functions.firestore
    .document('telemetry_events/{eventId}')
    .onCreate(async (snap, context) => {
    var _a;
    const rawEvent = snap.data();
    // 1. Write to telemetry_processed (deduplicated/parsed)
    const processedRef = db.collection('telemetry_processed').doc(context.params.eventId);
    await processedRef.set(Object.assign(Object.assign({}, rawEvent), { processed_at: admin.firestore.FieldValue.serverTimestamp() }));
    // 2. Update daily analytics_summaries
    const dateStr = new Date(rawEvent.utc_timestamp).toISOString().split('T')[0];
    const summaryRef = db.collection('analytics_summaries').doc(dateStr);
    await db.runTransaction(async (transaction) => {
        const summaryDoc = await transaction.get(summaryRef);
        if (!summaryDoc.exists) {
            transaction.set(summaryRef, {
                date: dateStr,
                total_events: 1,
                active_users: [rawEvent.user_id],
                events_by_type: { [rawEvent.event_name]: 1 },
                last_updated: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        else {
            const data = summaryDoc.data();
            const activeUsers = new Set(data.active_users || []);
            activeUsers.add(rawEvent.user_id);
            const eventsByType = data.events_by_type || {};
            eventsByType[rawEvent.event_name] = (eventsByType[rawEvent.event_name] || 0) + 1;
            transaction.update(summaryRef, {
                total_events: admin.firestore.FieldValue.increment(1),
                active_users: Array.from(activeUsers),
                events_by_type: eventsByType,
                last_updated: admin.firestore.FieldValue.serverTimestamp()
            });
        }
    });
    // 3. If it's an ML event, update SenseTraining or SenseMemory
    if (rawEvent.event_name === 'ml_inference_success' && ((_a = rawEvent.metadata) === null || _a === void 0 ? void 0 : _a.prompt)) {
        // Check user consent before storing memory
        const consentDoc = await db.collection('users').doc(rawEvent.user_id).collection('settings').doc('privacy_consent').get();
        const consent = consentDoc.data();
        if (consent === null || consent === void 0 ? void 0 : consent.mlTrainingEnabled) {
            await db.collection('sense_memory').add({
                uid: rawEvent.user_id,
                content: rawEvent.metadata.prompt,
                context: rawEvent.metadata.context || 'general',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                source: rawEvent.app_module,
                importance: 1
            });
        }
    }
});
exports.analyzeMedia = functions.firestore
    .document('media/{mediaId}')
    .onCreate(async (snap, context) => {
    const data = snap.data();
    if (data.status !== 'uploaded')
        return;
    await snap.ref.update({ status: 'analyzing' });
    try {
        // Use Gemini 3.1 Flash-Lite for analysis
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-preview',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: 'Analyze this image and provide a caption, tags, and NSFW likelihood (low/medium/high). Image URL: ' + data.originalUrl }
                    ],
                },
            ],
        });
        await snap.ref.update({
            status: 'complete',
            analysis: {
                result: response.text,
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
        });
    }
    catch (error) {
        console.error('Analysis failed:', error);
        await snap.ref.update({ status: 'failed' });
    }
});
exports.uploadMediaFunction = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to upload media.');
    }
    const { fileName, fileType, fileData } = data;
    if (!fileName || !fileData) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing fileName or fileData payload.');
    }
    const userId = context.auth.uid;
    const mediaId = (0, uuid_1.v4)();
    const path = `users/${userId}/photos/originals/${mediaId}-${fileName}`;
    const bucket = (0, storage_1.getStorage)().bucket(firebaseConfig.storageBucket);
    const fileRef = bucket.file(path);
    // Parse Base64 buffer payload
    const base64Data = fileData.replace(/^data:\w+\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    await fileRef.save(buffer, {
        metadata: {
            contentType: fileType || 'application/octet-stream'
        }
    });
    // Construct valid Firebase Storage download URL mapped to your exact bucket
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${encodeURIComponent(path)}?alt=media`;
    // Write directly to Firestore, bypassing client v2 strict schema evaluation blockers
    const docRef = await db.collection('media').add({
        userId,
        originalUrl: downloadUrl,
        status: 'uploaded',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { id: docRef.id, url: downloadUrl };
});
//# sourceMappingURL=index.js.map