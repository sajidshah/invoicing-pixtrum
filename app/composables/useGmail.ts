import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

export const useGmail = () => {
  const { auth, db } = useFirebase();
  const { user } = useAuth();
  const notification = useNotification();
  const config = useRuntimeConfig();

  const connectGmail = async () => {
    if (!user.value) {
      notification.error("Please log in first");
      return { success: false, error: "Not authenticated" };
    }

    try {
      // Get Firebase ID token
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error("Failed to get authentication token");
      }

      // Get OAuth URL from backend
      const response = await fetch(
        `${config.public.pdfServiceUrl}/gmail/auth-url`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get OAuth URL");
      }

      const { authUrl } = await response.json();

      // Redirect to Google OAuth page
      window.location.href = authUrl;

      return { success: true };
    } catch (error: any) {
      console.error("Error connecting Gmail:", error);
      notification.error("Failed to connect Gmail");
      return { success: false, error: error.message };
    }
  };

  const disconnectGmail = async () => {
    if (!user.value) return { success: false, error: "Not authenticated" };

    try {
      await updateDoc(doc(db, "settings", user.value.uid), {
        gmailConnected: false,
        gmailEmail: null,
        gmailRefreshToken: null,
        updatedAt: serverTimestamp(),
      });

      notification.success("Gmail disconnected successfully");
      return { success: true };
    } catch (error: any) {
      console.error("Error disconnecting Gmail:", error);
      notification.error("Failed to disconnect Gmail");
      return { success: false, error: error.message };
    }
  };

  const sendInvoiceEmail = async (
    invoiceId: string,
    recipientEmail: string,
    subject: string,
    message?: string
  ) => {
    if (!user.value) {
      notification.error("Please log in first");
      return { success: false, error: "Not authenticated" };
    }

    try {
      // Get Firebase ID token
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error("Failed to get authentication token");
      }

      // Send email via backend
      const response = await fetch(
        `${config.public.pdfServiceUrl}/send-invoice-email`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            invoiceId,
            recipientEmail,
            subject,
            message,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send email");
      }

      notification.success("Email sent successfully!");
      return { success: true };
    } catch (error: any) {
      console.error("Error sending email:", error);
      notification.error(error.message || "Failed to send email");
      return { success: false, error: error.message };
    }
  };

  return {
    connectGmail,
    disconnectGmail,
    sendInvoiceEmail,
  };
};
