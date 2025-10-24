<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Progress Bar -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-2">
          <h1 class="text-3xl font-bold text-gray-900">
            Welcome! Let's get you set up
          </h1>
          <span class="text-sm text-gray-600">Step {{ currentStep }} of 3</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div
            class="bg-primary-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${(currentStep / 3) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Step 1: Company Details -->
      <div v-if="currentStep === 1" class="card">
        <h2 class="text-2xl font-semibold mb-2">Company Details</h2>
        <p class="text-gray-600 mb-6">
          These details will appear on your invoices
        </p>

        <form @submit.prevent="handleStep1Submit" class="space-y-4">
          <div
            v-if="error"
            class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
          >
            {{ error }}
          </div>

          <div>
            <label for="companyName" class="label">Company Name *</label>
            <input
              id="companyName"
              v-model="formData.companyName"
              type="text"
              required
              class="input"
              placeholder="Your Company Name"
              autofocus
            />
          </div>

          <div>
            <label for="companyAddress" class="label">Company Address</label>
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

          <div class="flex justify-end pt-4">
            <button type="submit" :disabled="saving" class="btn-primary">
              {{ saving ? "Saving..." : "Continue →" }}
            </button>
          </div>
        </form>
      </div>

      <!-- Step 2: Bank Details (Optional) -->
      <div v-if="currentStep === 2" class="card">
        <h2 class="text-2xl font-semibold mb-2">Bank Details</h2>
        <p class="text-gray-600 mb-6">
          Add your payment information (optional - you can skip this step)
        </p>

        <form @submit.prevent="handleStep2Submit" class="space-y-4">
          <div
            v-if="error"
            class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
          >
            {{ error }}
          </div>

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
              This information will appear on your invoices
            </p>
          </div>

          <div class="flex justify-between pt-4">
            <button
              type="button"
              @click="currentStep = 1"
              class="btn-secondary"
            >
              ← Back
            </button>
            <div class="flex space-x-3">
              <button
                type="button"
                @click="handleStep2Skip"
                class="btn-secondary"
              >
                Skip
              </button>
              <button type="submit" :disabled="saving" class="btn-primary">
                {{ saving ? "Saving..." : "Continue →" }}
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- Step 3: Create First Client -->
      <div v-if="currentStep === 3" class="card">
        <h2 class="text-2xl font-semibold mb-2">Create Your First Client</h2>
        <p class="text-gray-600 mb-6">
          Add at least one client to start creating invoices
        </p>

        <form @submit.prevent="handleStep3Submit" class="space-y-4">
          <div
            v-if="error"
            class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
          >
            {{ error }}
          </div>

          <div>
            <label for="clientName" class="label">Client Name *</label>
            <input
              id="clientName"
              v-model="clientData.name"
              type="text"
              required
              class="input"
              placeholder="Acme Corp"
            />
          </div>

          <div>
            <label for="clientEmail" class="label">Email</label>
            <input
              id="clientEmail"
              v-model="clientData.email"
              type="email"
              class="input"
              placeholder="contact@acme.com"
            />
          </div>

          <div>
            <label for="clientPhone" class="label">Phone</label>
            <input
              id="clientPhone"
              v-model="clientData.phone"
              type="tel"
              class="input"
              placeholder="+1 234 567 8900"
            />
          </div>

          <div>
            <label for="clientAddress" class="label">Address</label>
            <textarea
              id="clientAddress"
              v-model="clientData.address"
              rows="3"
              class="input"
              placeholder="123 Main St, City, State 12345"
            />
          </div>

          <div>
            <label for="clientTaxId" class="label">Tax ID / VAT</label>
            <input
              id="clientTaxId"
              v-model="clientData.taxId"
              type="text"
              class="input"
              placeholder="XX-XXXXXXX"
            />
          </div>

          <div class="flex justify-between pt-4">
            <button
              type="button"
              @click="currentStep = 2"
              class="btn-secondary"
            >
              ← Back
            </button>
            <button type="submit" :disabled="saving" class="btn-primary">
              {{ saving ? "Creating..." : "Complete Setup →" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  doc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

const { db } = useFirebase();
const { user } = useAuth();
const router = useRouter();

const currentStep = ref(1);
const saving = ref(false);
const error = ref<string | null>(null);

// Company details (Step 1 & 2)
const formData = reactive({
  companyName: "",
  companyAddress: "",
  companyEmail: "",
  companyPhone: "",
  bankDetails: "",
});

// Client details (Step 3)
const clientData = reactive({
  name: "",
  email: "",
  phone: "",
  address: "",
  taxId: "",
});

const handleStep1Submit = async () => {
  if (!user.value) return;

  error.value = null;
  saving.value = true;

  try {
    // Save company details to settings
    await setDoc(
      doc(db, "settings", user.value.uid),
      {
        userId: user.value.uid,
        companyName: formData.companyName,
        companyAddress: formData.companyAddress,
        companyEmail: formData.companyEmail,
        companyPhone: formData.companyPhone,
        // Set defaults
        invoiceStartNumber: 1,
        defaultTaxRate: 0,
        defaultCurrency: "USD",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    currentStep.value = 2;
  } catch (err) {
    console.error("Error saving company details:", err);
    error.value = "Failed to save company details";
  } finally {
    saving.value = false;
  }
};

const handleStep2Submit = async () => {
  if (!user.value) return;

  error.value = null;
  saving.value = true;

  try {
    // Save bank details to settings
    await setDoc(
      doc(db, "settings", user.value.uid),
      {
        bankDetails: formData.bankDetails,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    currentStep.value = 3;
  } catch (err) {
    console.error("Error saving bank details:", err);
    error.value = "Failed to save bank details";
  } finally {
    saving.value = false;
  }
};

const handleStep2Skip = () => {
  currentStep.value = 3;
};

const handleStep3Submit = async () => {
  if (!user.value) return;

  error.value = null;
  saving.value = true;

  try {
    // Create first client
    await addDoc(collection(db, "clients"), {
      name: clientData.name,
      email: clientData.email || null,
      phone: clientData.phone || null,
      address: clientData.address || null,
      taxId: clientData.taxId || null,
      ownedBy: user.value.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Redirect to create invoice page
    router.push("/invoices/new");
  } catch (err) {
    console.error("Error creating client:", err);
    error.value = "Failed to create client";
  } finally {
    saving.value = false;
  }
};
</script>
