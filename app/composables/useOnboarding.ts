import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export const useOnboarding = () => {
  const { db } = useFirebase();
  const { user } = useAuth();

  /**
   * Check if user has completed onboarding
   * Requirements:
   * 1. Company name in settings
   * 2. At least one client created
   */
  const checkOnboardingStatus = async (): Promise<{
    isComplete: boolean;
    hasCompanyName: boolean;
    hasClient: boolean;
  }> => {
    if (!user.value) {
      return {
        isComplete: false,
        hasCompanyName: false,
        hasClient: false,
      };
    }

    try {
      // Check if user has company name in settings
      const settingsDoc = await getDoc(doc(db, "settings", user.value.uid));
      const hasCompanyName =
        settingsDoc.exists() && !!settingsDoc.data()?.companyName;

      // Check if user has at least one client
      const clientsQuery = query(
        collection(db, "clients"),
        where("ownedBy", "==", user.value.uid)
      );
      const clientsSnapshot = await getDocs(clientsQuery);
      const hasClient = clientsSnapshot.size > 0;

      return {
        isComplete: hasCompanyName && hasClient,
        hasCompanyName,
        hasClient,
      };
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      return {
        isComplete: false,
        hasCompanyName: false,
        hasClient: false,
      };
    }
  };

  return {
    checkOnboardingStatus,
  };
};
