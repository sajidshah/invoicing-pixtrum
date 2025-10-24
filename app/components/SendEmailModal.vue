<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click.self="handleClose"
    >
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
      ></div>

      <!-- Modal -->
      <div class="flex min-h-screen items-center justify-center p-4">
        <div
          class="relative w-full max-w-2xl bg-white rounded-lg shadow-xl"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-center justify-between border-b px-6 py-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">
                Send Invoice via Email
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                Invoice #{{ invoice.number }}
              </p>
            </div>
            <button
              @click="handleClose"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSendEmail" class="p-6 space-y-4">
            <!-- Gmail Status Check -->
            <div
              v-if="!isGmailConnected"
              class="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
            >
              <div class="flex items-start">
                <svg
                  class="w-5 h-5 text-yellow-600 mt-0.5 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
                <div>
                  <p class="text-sm font-medium text-yellow-800">
                    Gmail Not Connected
                  </p>
                  <p class="text-sm text-yellow-700 mt-1">
                    You need to connect your Gmail account first.
                    <NuxtLink
                      to="/settings"
                      class="font-medium underline hover:text-yellow-900"
                    >
                      Go to Settings
                    </NuxtLink>
                  </p>
                </div>
              </div>
            </div>

            <!-- Recipient Email -->
            <div>
              <label for="recipientEmail" class="label">
                Recipient Email *
              </label>
              <input
                id="recipientEmail"
                v-model="formData.recipientEmail"
                type="email"
                required
                :disabled="!isGmailConnected || sending"
                class="input"
                placeholder="client@example.com"
              />
              <p class="text-xs text-gray-500 mt-1">
                The email address where the invoice will be sent
              </p>
            </div>

            <!-- Subject -->
            <div>
              <label for="subject" class="label"> Subject * </label>
              <input
                id="subject"
                v-model="formData.subject"
                type="text"
                required
                :disabled="!isGmailConnected || sending"
                class="input"
                placeholder="Invoice #123 from Your Company"
              />
            </div>

            <!-- Message -->
            <div>
              <label for="message" class="label"> Message </label>
              <textarea
                id="message"
                v-model="formData.message"
                rows="6"
                :disabled="!isGmailConnected || sending"
                class="input"
                placeholder="Dear Client,&#10;&#10;Please find attached invoice #123.&#10;&#10;Thank you for your business!"
              ></textarea>
              <p class="text-xs text-gray-500 mt-1">
                Optional message to include in the email body
              </p>
            </div>

            <!-- From Email (Display Only) -->
            <div
              v-if="gmailEmail"
              class="bg-gray-50 border border-gray-200 rounded-lg p-3"
            >
              <p class="text-xs text-gray-600">Sending from:</p>
              <p class="text-sm font-medium text-gray-900 mt-1">
                {{ gmailEmail }}
              </p>
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                @click="handleClose"
                :disabled="sending"
                class="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="!isGmailConnected || sending"
                class="btn-primary"
              >
                <span v-if="sending" class="flex items-center">
                  <svg
                    class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sending...
                </span>
                <span v-else class="flex items-center">
                  <svg
                    class="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Send Email
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { doc, getDoc } from "firebase/firestore";
import type { Invoice, Client, UserSettings } from "~/lib/types";

interface Props {
  isOpen: boolean;
  invoice: Invoice;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  sent: [];
}>();

const { db } = useFirebase();
const { user } = useAuth();
const { sendInvoiceEmail } = useGmail();

const sending = ref(false);
const isGmailConnected = ref(false);
const gmailEmail = ref<string>("");
const clientEmail = ref<string>("");

const formData = reactive({
  recipientEmail: "",
  subject: "",
  message: "",
});

// Load Gmail and client info
watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen && user.value) {
      try {
        // Check Gmail connection status
        const settingsDoc = await getDoc(doc(db, "settings", user.value.uid));

        if (!settingsDoc.exists()) {
          console.warn("Settings document not found");
          isGmailConnected.value = false;
          return;
        }

        const settings = settingsDoc.data() as UserSettings | undefined;
        console.log("Gmail settings:", {
          gmailConnected: settings?.gmailConnected,
          gmailEmail: settings?.gmailEmail,
        });

        isGmailConnected.value = settings?.gmailConnected === true;
        gmailEmail.value = settings?.gmailEmail || "";

        // Get client email
        if (props.invoice.clientId) {
          const clientDoc = await getDoc(
            doc(db, "clients", props.invoice.clientId)
          );
          const client = clientDoc.data() as Client | undefined;
          clientEmail.value = client?.email || "";
        }

        // Pre-fill form data
        formData.recipientEmail = clientEmail.value;
        formData.subject = `Invoice #${props.invoice.number}${
          settings?.companyName ? ` from ${settings.companyName}` : ""
        }`;
        formData.message = `Dear Client,\n\nPlease find attached invoice #${props.invoice.number}.\n\nThank you for your business!`;
      } catch (error) {
        console.error("Error loading Gmail settings:", error);
        isGmailConnected.value = false;
      }
    }
  },
  { immediate: true }
);

const handleClose = () => {
  if (!sending.value) {
    emit("close");
  }
};

const handleSendEmail = async () => {
  if (!isGmailConnected.value || sending.value || !props.invoice.id) return;

  sending.value = true;
  const result = await sendInvoiceEmail(
    props.invoice.id,
    formData.recipientEmail,
    formData.subject,
    formData.message
  );
  sending.value = false;

  if (result.success) {
    emit("sent");
    emit("close");
  }
};
</script>
