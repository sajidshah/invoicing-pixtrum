import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export const useAuth = () => {
  const { auth, db } = useFirebase();
  const user = useState<User | null>("user", () => null);
  const loading = useState("authLoading", () => true);
  const inited = useState("authInited", () => false);

  // Initialize auth state listener
  const initAuth = () => {
    if (inited.value) {
      return;
    }
    inited.value = true;

    onAuthStateChanged(auth, (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.email || "null");
      user.value = firebaseUser;
      loading.value = false;
    });
  };

  const waitForAuthReady = async () => {
    if (!loading.value) return;

    // Wait for auth state to be determined
    return new Promise<void>((resolve) => {
      const unwatch = watch(loading, (isLoading) => {
        if (!isLoading) {
          unwatch();
          resolve();
        }
      });
    });
  };

  // Register new user
  const register = async (
    email: string,
    password: string,
    displayName?: string
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Create user document in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        displayName: displayName || null,
        createdAt: serverTimestamp(),
      });

      // Directly set the user
      user.value = userCredential.user;
      return { user: userCredential.user, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  };

  // Login user
  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Directly set the user
      user.value = userCredential.user;
      return { user: userCredential.user, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await signOut(auth);
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  // Get auth token
  const getAuthToken = async (): Promise<string | null> => {
    if (!user.value) return null;
    return await user.value.getIdToken();
  };

  return {
    user: readonly(user),
    loading: readonly(loading),
    initAuth,
    waitForAuthReady,
    register,
    login,
    logout,
    getAuthToken,
  };
};
