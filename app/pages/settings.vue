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
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="INR">INR - Indian Rupee</option>
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

// Load settings
onMounted(async () => {
  if (!user.value) return;

  try {
    const settingsDoc = await getDoc(doc(db, "settings", user.value.uid));

    if (settingsDoc.exists()) {
      const settings = settingsDoc.data() as UserSettings;
      formData.invoiceStartNumber = settings.invoiceStartNumber;
      formData.defaultTaxRate = settings.defaultTaxRate;
      formData.defaultCurrency = settings.defaultCurrency;
      formData.companyName = settings.companyName || "";
      formData.companyAddress = settings.companyAddress || "";
      formData.companyEmail = settings.companyEmail || "";
      formData.companyPhone = settings.companyPhone || "";
      formData.bankDetails = settings.bankDetails || "";
      formData.quantityLabel = settings.quantityLabel || "";
      formData.unitPriceLabel = settings.unitPriceLabel || "";
      formData.footerNote = settings.footerNote || "";
    }
  } catch (err) {
    console.error("Error loading settings:", err);
    error.value = "Failed to load settings";
  } finally {
    loading.value = false;
  }
});

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
