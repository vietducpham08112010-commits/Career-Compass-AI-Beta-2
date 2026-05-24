import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import { UserProfile, ChatSession, ChatMessage, Milestone } from '../types';

let firebaseConfig: any = {};
const configs = import.meta.glob('../firebase-applet-config.json', { eager: true });
const configFiles = Object.keys(configs);
if (configFiles.length > 0) {
  firebaseConfig = (configs[configFiles[0]] as any).default || {};
}

const fallbackConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || 'default'
};

const activeFirebaseConfig = (firebaseConfig && firebaseConfig.apiKey) ? firebaseConfig : fallbackConfig;

// Safe double-initialization check
const app = getApps().length > 0 ? getApp() : initializeApp(activeFirebaseConfig);

export const db = activeFirebaseConfig.firestoreDatabaseId && activeFirebaseConfig.firestoreDatabaseId !== 'default'
  ? getFirestore(app, activeFirebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getApps().length > 0 ? getApp() : app;

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

// Global error handler as mandated by skill
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentUser = getApps().length > 0 ? null : null; // Safe fallback
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: null, 
      email: null,
      emailVerified: null,
      isAnonymous: null
    }
  };
  console.error('[Firestore Error]: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const syncUserProfileToCloud = async (userId: string, profile: UserProfile): Promise<void> => {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    // Cast profile cleanly
    const payload: any = {
      name: profile.name || 'User',
      email: profile.email || '',
      avatar: profile.avatar || 'counselor_female_1',
      streak: profile.streak || 0,
      lastCheckIn: profile.lastCheckIn || '',
      points: (profile as any).points || 0,
      level: (profile as any).level || 1,
      badges: (profile as any).badges || [],
      updatedAt: new Date().toISOString()
    };
    if (profile.careerGoal) payload.careerGoal = profile.careerGoal;
    if (profile.careerProfile) payload.careerProfile = profile.careerProfile;

    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const fetchUserProfileFromCloud = async (userId: string): Promise<UserProfile | null> => {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};

export const syncRoadmapToCloud = async (userId: string, milestones: Milestone[]): Promise<void> => {
  const path = `users/${userId}/roadmaps/default`;
  try {
    const docRef = doc(db, 'users', userId, 'roadmaps', 'default');
    const cleanedMilestones = milestones.map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      status: m.status,
      comments: m.comments || []
    }));
    await setDoc(docRef, {
      userId,
      milestones: cleanedMilestones,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const fetchRoadmapFromCloud = async (userId: string): Promise<Milestone[] | null> => {
  const path = `users/${userId}/roadmaps/default`;
  try {
    const docRef = doc(db, 'users', userId, 'roadmaps', 'default');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return (data.milestones || []) as Milestone[];
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};

export const syncChatSessionToCloud = async (userId: string, session: ChatSession): Promise<void> => {
  const path = `users/${userId}/chats/${session.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'chats', session.id);
    const msgs = session.messages.map(m => ({
      id: m.id,
      role: m.role,
      text: m.text,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp),
      pastedTexts: m.pastedTexts || []
    }));
    await setDoc(docRef, {
      userId,
      id: session.id,
      title: session.title,
      date: session.date instanceof Date ? session.date.toISOString() : String(session.date),
      messages: msgs,
      isStarred: !!session.isStarred,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const fetchChatSessionsFromCloud = async (userId: string): Promise<ChatSession[]> => {
  const path = `users/${userId}/chats`;
  try {
    const colRef = collection(db, 'users', userId, 'chats');
    const snap = await getDocs(colRef);
    const sessions: ChatSession[] = [];
    snap.forEach(docSnap => {
      const d = docSnap.data();
      // Parse chats back
      const msgs = (d.messages || []).map((m: any) => ({
        id: m.id,
        role: m.role,
        text: m.text,
        timestamp: new Date(m.timestamp),
        pastedTexts: m.pastedTexts || []
      }));
      sessions.push({
        id: d.id || docSnap.id,
        title: d.title || 'Untitled Session',
        date: new Date(d.date),
        messages: msgs,
        isStarred: !!d.isStarred
      });
    });
    // Sort by date newest first
    sessions.sort((a, b) => b.date.getTime() - a.date.getTime());
    return sessions;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const deleteChatSessionFromCloud = async (userId: string, chatId: string): Promise<void> => {
  const path = `users/${userId}/chats/${chatId}`;
  try {
    const docRef = doc(db, 'users', userId, 'chats', chatId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const saveFeedbackToCloud = async (userId: string, rating: number, comment: string): Promise<void> => {
  const feedbackId = `feedback_${userId}_${Date.now()}`;
  const path = `feedback/${feedbackId}`;
  try {
    const docRef = doc(db, 'feedback', feedbackId);
    await setDoc(docRef, {
      userId,
      rating,
      comment,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};
