<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Settings</h1>
          <p class="text-gray-600 mt-1">Manage your account preferences</p>
        </div>
        <NuxtLink to="/" class="btn-secondary"> ← Back to Dashboard </NuxtLink>
      </div>

      <div class="card">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div
            v-if="successMessage"
            class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"
          >
            {{ successMessage }}
          </div>

          <div
            v-if="error"
            class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
          >
            {{ error }}
          </div>

          <div>
            <label for="invoiceStartNumber" class="label">
              Next Invoice Number *
            </label>
            <input
              id="invoiceStartNumber"
              v-model.number="formData.invoiceStartNumber"
              type="number"
              required
              min="1"
              class="input"
              placeholder="173"
            />
            <p class="text-xs text-gray-500 mt-1">
              The next invoice number that will be used. This number will
              increment automatically with each new invoice.
            </p>
          </div>

          <div>
            <label for="defaultTaxRate" class="label">
              Default Tax Rate (%) *
            </label>
            <input
              id="defaultTaxRate"
              v-model.number="formData.defaultTaxRate"
              type="number"
              required
              min="0"
              max="100"
              step="0.01"
              class="input"
              placeholder="0"
            />
            <p class="text-xs text-gray-500 mt-1">
              Default tax rate applied to new invoices
            </p>
          </div>

          <div>
            <label for="defaultCurrency" class="label">
              Default Currency *
            </label>
            <select
              id="defaultCurrency"
              v-model="formData.defaultCurrency"
              required
              class="input"
            >
              <option value="USD">USD - US Dollar ($)</option>
              <option value="EUR">EUR - Euro (€)</option>
              <option value="GBP">GBP - British Pound (£)</option>
              <option value="CAD">CAD - Canadian Dollar ($)</option>
              <option value="AUD">AUD - Australian Dollar ($)</option>
              <option value="SAR">SAR - Saudi Riyal (﷼)</option>
              <option value="AED">AED - UAE Dirham (د.إ)</option>
              <option value="INR">INR - Indian Rupee (₹)</option>
            </select>
          </div>

          <!-- Company Details Section -->
          <div class="border-t pt-6">
            <h3 class="text-lg font-semibold mb-4">Company Details</h3>
            <p class="text-sm text-gray-600 mb-4">
              These details will appear on your invoices
            </p>

            <div class="space-y-4">
              <div>
                <label for="companyName" class="label">Company Name</label>
                <input
                  id="companyName"
                  v-model="formData.companyName"
                  type="text"
                  class="input"
                  placeholder="Your Company Name"
                />
              </div>

              <div>
                <label for="companyAddress" class="label"
                  >Company Address</label
                >
                <textarea
                  id="companyAddress"
                  v-model="formData.companyAddress"
                  class="input"
                  rows="3"
                  placeholder="123 Main St&#10;City, State 12345&#10;Country"
                ></textarea>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="companyEmail" class="label">Company Email</label>
                  <input
                    id="companyEmail"
                    v-model="formData.companyEmail"
                    type="email"
                    class="input"
                    placeholder="info@company.com"
                  />
                </div>

                <div>
                  <label for="companyPhone" class="label">Company Phone</label>
                  <input
                    id="companyPhone"
                    v-model="formData.companyPhone"
                    type="tel"
                    class="input"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Bank Details Section -->
          <div class="border-t pt-6">
            <h3 class="text-lg font-semibold mb-4">Bank Details</h3>
            <p class="text-sm text-gray-600 mb-4">
              Payment instructions that will appear on your invoices
            </p>

            <div>
              <label for="bankDetails" class="label">Bank Details</label>
              <textarea
                id="bankDetails"
                v-model="formData.bankDetails"
                class="input"
                rows="5"
                placeholder="Bank Name: Your Bank&#10;Account Name: Your Company Name&#10;Account Number: 123456789&#10;Routing Number: 987654321&#10;SWIFT/BIC: ABCD1234"
              ></textarea>
              <p class="text-xs text-gray-500 mt-1">
                Enter your bank account details for payment
              </p>
            </div>
          </div>

          <!-- Gmail Integration Section -->
          <div class="border-t pt-6">
            <h3 class="text-lg font-semibold mb-4">Gmail Integration</h3>
            <p class="text-sm text-gray-600 mb-4">
              Connect your Gmail account to send invoices directly via email
            </p>

            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div v-if="!settings?.gmailConnected" class="space-y-3">
                <div class="flex items-start">
                  <svg
                    class="w-5 h-5 text-gray-400 mt-0.5 mr-3"
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
                  <div>
                    <p class="text-sm text-gray-700 mb-2">
                      Gmail is not connected. Connect your Gmail account to send
                      invoices directly to your clients.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  @click="handleConnectGmail"
                  :disabled="connectingGmail"
                  class="btn-primary"
                >
                  <svg
                    v-if="!connectingGmail"
                    class="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"
                    />
                  </svg>
                  {{ connectingGmail ? "Connecting..." : "Connect Gmail" }}
                </button>
              </div>

              <div v-else class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <svg
                      class="w-5 h-5 text-green-500 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <div>
                      <p class="text-sm font-medium text-gray-900">
                        Gmail Connected
                      </p>
                      <p class="text-xs text-gray-500">
                        {{ settings?.gmailEmail }}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    @click="handleDisconnectGmail"
                    :disabled="disconnectingGmail"
                    class="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    {{ disconnectingGmail ? "Disconnecting..." : "Disconnect" }}
                  </button>
                </div>
                <p class="text-xs text-gray-500">
                  You can now send invoices directly via email using the "Send
                  Email" button on each invoice.
                </p>
              </div>
            </div>
          </div>

          <!-- Invoice Customization Section -->
          <div class="border-t pt-6">
            <h3 class="text-lg font-semibold mb-4">Invoice Customization</h3>
            <p class="text-sm text-gray-600 mb-4">
              Customize labels and messages on your invoices
            </p>

            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="quantityLabel" class="label"
                    >Quantity Column Label</label
                  >
                  <input
                    id="quantityLabel"
                    v-model="formData.quantityLabel"
                    type="text"
                    class="input"
                    placeholder="Quantity"
                  />
                  <p class="text-xs text-gray-500 mt-1">Default: "Quantity"</p>
                </div>

                <div>
                  <label for="unitPriceLabel" class="label"
                    >Unit Price Column Label</label
                  >
                  <input
                    id="unitPriceLabel"
                    v-model="formData.unitPriceLabel"
                    type="text"
                    class="input"
                    placeholder="Unit Price"
                  />
                  <p class="text-xs text-gray-500 mt-1">
                    Default: "Unit Price"
                  </p>
                </div>
              </div>

              <div>
                <label for="footerNote" class="label">Footer Note</label>
                <textarea
                  id="footerNote"
                  v-model="formData.footerNote"
                  class="input"
                  rows="2"
                  placeholder="Thank you for your business!"
                ></textarea>
                <p class="text-xs text-gray-500 mt-1">
                  Message displayed at the bottom of your invoices
                </p>
              </div>
            </div>
          </div>

          <div class="flex justify-end space-x-4 pt-4 border-t">
            <button type="submit" :disabled="saving" class="btn-primary">
              {{ saving ? "Saving..." : "Save Settings" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import type { UserSettings } from "~/lib/types";

const { db } = useFirebase();
const { user } = useAuth();
const notification = useNotification();
const { connectGmail, disconnectGmail } = useGmail();

const formData = reactive({
  invoiceStartNumber: 1,
  defaultTaxRate: 0,
  defaultCurrency: "USD",
  companyName: "",
  companyAddress: "",
  companyEmail: "",
  companyPhone: "",
  bankDetails: "",
  quantityLabel: "",
  unitPriceLabel: "",
  footerNote: "",
});

const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const settings = ref<UserSettings | null>(null);
const connectingGmail = ref(false);
const disconnectingGmail = ref(false);

// Load settings
onMounted(async () => {
  if (!user.value) return;

  // Check for Gmail OAuth callback status
  const route = useRoute();
  const isGmailCallback =
    route.query.gmail === "connected" || route.query.gmail === "error";

  if (route.query.gmail === "connected") {
    notification.success("Gmail connected successfully!");
  } else if (route.query.gmail === "error") {
    notification.error("Failed to connect Gmail. Please try again.");
  }

  try {
    const settingsDoc = await getDoc(doc(db, "settings", user.value.uid));

    if (settingsDoc.exists()) {
      settings.value = settingsDoc.data() as UserSettings;
      formData.invoiceStartNumber = settings.value.invoiceStartNumber;
      formData.defaultTaxRate = settings.value.defaultTaxRate;
      formData.defaultCurrency = settings.value.defaultCurrency;
      formData.companyName = settings.value.companyName || "";
      formData.companyAddress = settings.value.companyAddress || "";
      formData.companyEmail = settings.value.companyEmail || "";
      formData.companyPhone = settings.value.companyPhone || "";
      formData.bankDetails = settings.value.bankDetails || "";
      formData.quantityLabel = settings.value.quantityLabel || "";
      formData.unitPriceLabel = settings.value.unitPriceLabel || "";
      formData.footerNote = settings.value.footerNote || "";
    }
  } catch (err) {
    console.error("Error loading settings:", err);
    error.value = "Failed to load settings";
  } finally {
    loading.value = false;
  }

  // Remove query param from URL after loading settings
  if (isGmailCallback) {
    navigateTo("/settings", { replace: true });
  }
});

const handleConnectGmail = async () => {
  connectingGmail.value = true;
  const result = await connectGmail();
  connectingGmail.value = false;

  if (result.success && user.value) {
    // Reload settings to update UI
    const settingsDoc = await getDoc(doc(db, "settings", user.value.uid));
    if (settingsDoc.exists()) {
      settings.value = settingsDoc.data() as UserSettings;
    }
  }
};

const handleDisconnectGmail = async () => {
  disconnectingGmail.value = true;
  const result = await disconnectGmail();
  disconnectingGmail.value = false;

  if (result.success) {
    // Update local settings
    if (settings.value) {
      settings.value.gmailConnected = false;
      settings.value.gmailEmail = undefined;
    }
  }
};

const handleSubmit = async () => {
  if (!user.value) return;

  error.value = null;
  successMessage.value = null;
  saving.value = true;

  try {
    await setDoc(doc(db, "settings", user.value.uid), {
      userId: user.value.uid,
      invoiceStartNumber: formData.invoiceStartNumber,
      defaultTaxRate: formData.defaultTaxRate,
      defaultCurrency: formData.defaultCurrency,
      companyName: formData.companyName,
      companyAddress: formData.companyAddress,
      companyEmail: formData.companyEmail,
      companyPhone: formData.companyPhone,
      bankDetails: formData.bankDetails,
      quantityLabel: formData.quantityLabel,
      unitPriceLabel: formData.unitPriceLabel,
      footerNote: formData.footerNote,
      updatedAt: serverTimestamp(),
    });

    notification.success("Settings saved successfully!");
  } catch (err) {
    console.error("Error saving settings:", err);
    notification.error("Failed to save settings");
  } finally {
    saving.value = false;
  }
};
</script>
