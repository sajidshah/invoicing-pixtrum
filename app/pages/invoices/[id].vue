<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Edit Invoice</h1>
          <p class="text-gray-600 mt-1">Update invoice details</p>
        </div>
        <NuxtLink to="/invoices" class="btn-secondary">
          ← Back to Invoices
        </NuxtLink>
      </div>

      <div v-if="loading" class="card text-center py-10">
        <p class="text-gray-500">Loading invoice...</p>
      </div>

      <div v-else-if="accessDenied" class="card text-center py-10">
        <p class="text-gray-600">You do not have access to this invoice.</p>
      </div>

      <div v-else-if="!invoiceExists" class="card text-center py-10">
        <p class="text-gray-600">Invoice not found.</p>
      </div>

      <div v-else class="card">
        <InvoiceForm
          :clients="clients"
          :settings="settings"
          :submitting="submitting"
          :initial-data="invoiceData"
          mode="edit"
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
  getDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import type { Client, Invoice, UserSettings } from "~/lib/types";
import type { InvoiceFormData } from "~/lib/validators";
import { calculateInvoiceTotals } from "~/lib/utils";

const { db } = useFirebase();
const { user } = useAuth();
const router = useRouter();
const route = useRoute();
const notification = useNotification();

const clients = ref<Client[]>([]);
const settings = ref<UserSettings | null>(null);
const invoiceData = ref<InvoiceFormData | null>(null);
const submitting = ref(false);
const loading = ref(true);
const invoiceExists = ref(true);
const accessDenied = ref(false);

const invoiceId = computed(() => {
  const id = route.params.id;
  return typeof id === "string" ? id : "";
});

onMounted(async () => {
  if (!user.value) {
    loading.value = false;
    return;
  }

  if (!invoiceId.value) {
    invoiceExists.value = false;
    loading.value = false;
    return;
  }

  try {
    const clientsQuery = query(
      collection(db, "clients"),
      where("ownedBy", "==", user.value.uid)
    );

    const [clientsSnapshot, settingsDoc, invoiceDoc] = await Promise.all([
      getDocs(clientsQuery),
      getDoc(doc(db, "settings", user.value.uid)),
      getDoc(doc(db, "invoices", invoiceId.value)),
    ]);

    clients.value = clientsSnapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    })) as Client[];

    if (settingsDoc.exists()) {
      settings.value = settingsDoc.data() as UserSettings;
    }

    if (!invoiceDoc.exists()) {
      invoiceExists.value = false;
      loading.value = false;
      return;
    }

    const invoice = invoiceDoc.data() as Invoice;
    if (invoice.ownedBy !== user.value.uid) {
      accessDenied.value = true;
      loading.value = false;
      return;
    }

    invoiceData.value = {
      clientId: invoice.clientId,
      number: invoice.number,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      items: invoice.items,
      tax: invoice.tax,
      currency: invoice.currency,
      status: invoice.status,
    };
  } catch (error) {
    console.error("Error loading invoice:", error);
    notification.error("Failed to load invoice");
  } finally {
    loading.value = false;
  }
});

const handleSubmit = async (data: InvoiceFormData) => {
  if (!user.value || !invoiceId.value) return;

  submitting.value = true;

  try {
    const { subtotal, tax, total } = calculateInvoiceTotals(
      data.items,
      data.tax
    );

    await updateDoc(doc(db, "invoices", invoiceId.value), {
      ...data,
      subtotal,
      tax,
      total,
      updatedAt: serverTimestamp(),
    });

    notification.success("Invoice updated successfully");
    router.push("/invoices");
  } catch (error) {
    console.error("Error updating invoice:", error);
    notification.error("Failed to update invoice");
  } finally {
    submitting.value = false;
  }
};
</script>
