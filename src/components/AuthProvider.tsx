import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface UserData {
  estimateCount: number;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  incrementEstimateCount: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const ADMIN_EMAILS = ['kitchenbysns@gmail.com', 'stha123surya@gmail.com', 'neki123nki@gmail.com'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserData(userSnap.data() as UserData);
          } else {
            const newData = { estimateCount: 0 };
            await setDoc(userRef, newData);
            setUserData(newData);
          }
        } catch (error) {
          console.error("Firestore connection error:", error);
          // Default to 0 if we can't reach the database
          setUserData({ estimateCount: 0 });
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const incrementEstimateCount = async () => {
    if (!user || !userData) return false;
    
    if (isAdmin) {
      return true;
    }

    // Check if limit is reached
    if (userData.estimateCount >= 3) {
      return false;
    }
    
    // Update count in backend & locally
    try {
      const newCount = userData.estimateCount + 1;
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { estimateCount: newCount }, { merge: true });
      setUserData({ ...userData, estimateCount: newCount });
      return true;
    } catch (error) {
      console.error("Firestore connection error:", error);
      // Still increment locally if offline
      const newCount = userData.estimateCount + 1;
      setUserData({ ...userData, estimateCount: newCount });
      return true;
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, isAdmin, signInWithGoogle, signOut, incrementEstimateCount }}>
      {children}
    </AuthContext.Provider>
  );
};
