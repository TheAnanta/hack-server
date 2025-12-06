import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// Ensure you have GOOGLE_APPLICATION_CREDENTIALS set in your environment
// or provide a service account key object.
// For now, we assume default credentials or a mock for local dev if needed.

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
}

export default admin;
