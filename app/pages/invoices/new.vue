<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Create New Invoice</h1>
          <p class="text-gray-600 mt-1">Fill in the invoice details below</p>
        </div>
        <NuxtLink to="/invoices" class="btn-secondary">
          ← Back to Invoices
        </NuxtLink>
      </div>

      <div class="card">
        <InvoiceForm
          :clients="clients"
          :settings="settings"
          @submit="handleSubmit"
          @cancel="router.push('/invoices')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  getDoc,
  setDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import type { Client, UserSettings } from "~/lib/types";
import type { InvoiceFormData } from "~/lib/validators";
import { calculateInvoiceTotals } from "~/lib/utils";

const { db } = useFirebase();
const { user } = useAuth();
const router = useRouter();

const clients = ref<Client[]>([]);
const settings = ref<UserSettings | null>(null);

// Load clients and settings
onMounted(async () => {
  if (!user.value) return;

  // Load clients
  const q = query(
    collection(db, "clients"),
    where("ownedBy", "==", user.value.uid)
  );

  const snapshot = await getDocs(q);
  clients.value = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Client[];

  // Load user settings
  const settingsDoc = await getDoc(doc(db, "settings", user.value.uid));
  if (settingsDoc.exists()) {
    settings.value = settingsDoc.data() as UserSettings;
  } else {
    // Create default settings if none exist
    const defaultSettings = {
      userId: user.value.uid,
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
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, "settings", user.value.uid), defaultSettings);
    settings.value = defaultSettings as UserSettings;
  }
});

const handleSubmit = async (data: InvoiceFormData) => {
  if (!user.value || !settings.value) return;

  try {
    const { subtotal, tax, total } = calculateInvoiceTotals(
      data.items,
      data.tax
    );

    // Create invoice
    await addDoc(collection(db, "invoices"), {
      ...data,
      ownedBy: user.value.uid,
      subtotal,
      tax,
      total,
      createdAt: serverTimestamp(),
    });

    // Increment the invoice start number for next invoice
    await updateDoc(doc(db, "settings", user.value.uid), {
      invoiceStartNumber: settings.value.invoiceStartNumber + 1,
      updatedAt: serverTimestamp(),
    });

    router.push("/invoices");
  } catch (error) {
    console.error("Error creating invoice:", error);
    alert("Failed to create invoice");
  }
};
</script>
