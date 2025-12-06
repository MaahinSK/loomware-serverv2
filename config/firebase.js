const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let firebaseAdmin;

try {
  // Check if Firebase is already initialized
  if (!admin.apps.length) {
    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY ? 
        process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : 
        null,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
    };

    // If no private key is provided (for client-side auth only), don't initialize admin
    if (serviceAccount.private_key) {
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });
      
      console.log('✅ Firebase Admin initialized');
    } else {
      console.log('⚠️ Firebase Admin not initialized - using client-side auth only');
    }
  } else {
    firebaseAdmin = admin.app();
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
  console.log('⚠️ Firebase Admin not available - using JWT auth only');
}

// Verify Firebase ID Token (for Google login)
const verifyFirebaseToken = async (idToken) => {
  try {
    if (!firebaseAdmin) {
      throw new Error('Firebase Admin not initialized');
    }

    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Firebase token verification error:', error.message);
    throw new Error('Invalid Firebase token');
  }
};

// Create custom token for Firebase Auth
const createCustomToken = async (uid, additionalClaims = {}) => {
  try {
    if (!firebaseAdmin) {
      throw new Error('Firebase Admin not initialized');
    }

    const token = await firebaseAdmin.auth().createCustomToken(uid, additionalClaims);
    return token;
  } catch (error) {
    console.error('Create custom token error:', error.message);
    throw new Error('Failed to create Firebase token');
  }
};

// Get user by UID
const getFirebaseUser = async (uid) => {
  try {
    if (!firebaseAdmin) {
      throw new Error('Firebase Admin not initialized');
    }

    const userRecord = await firebaseAdmin.auth().getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Get Firebase user error:', error.message);
    throw new Error('User not found in Firebase');
  }
};

// Update user in Firebase
const updateFirebaseUser = async (uid, updates) => {
  try {
    if (!firebaseAdmin) {
      throw new Error('Firebase Admin not initialized');
    }

    const userRecord = await firebaseAdmin.auth().updateUser(uid, updates);
    return userRecord;
  } catch (error) {
    console.error('Update Firebase user error:', error.message);
    throw new Error('Failed to update Firebase user');
  }
};

// Delete user from Firebase
const deleteFirebaseUser = async (uid) => {
  try {
    if (!firebaseAdmin) {
      throw new Error('Firebase Admin not initialized');
    }

    await firebaseAdmin.auth().deleteUser(uid);
    return true;
  } catch (error) {
    console.error('Delete Firebase user error:', error.message);
    throw new Error('Failed to delete Firebase user');
  }
};

module.exports = {
  firebaseAdmin,
  verifyFirebaseToken,
  createCustomToken,
  getFirebaseUser,
  updateFirebaseUser,
  deleteFirebaseUser
};