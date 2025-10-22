<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Invoices</h1>
          <p class="text-gray-600 mt-1">Manage your invoices</p>
        </div>
        <div class="flex space-x-4">
          <NuxtLink to="/invoices/new" class="btn-primary">
            + New Invoice
          </NuxtLink>
          <NuxtLink to="/" class="btn-secondary">
            ← Back to Dashboard
          </NuxtLink>
        </div>
      </div>

      <div class="card">
        <InvoiceTable
          :invoices="invoices"
          :loading="loading"
          :generating-pdf-id="generatingPdfId"
          @generate-pdf="handleGeneratePdf"
          @delete-pdf="handleDeletePdf"
          @update-status="handleUpdateStatus"
          @delete-invoice="handleDeleteInvoice"
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
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  type Unsubscribe,
} from "firebase/firestore";
import type { Invoice } from "~/lib/types";

const { db } = useFirebase();
const { user, getAuthToken } = useAuth();
const config = useRuntimeConfig();

const invoices = ref<Invoice[]>([]);
const loading = ref(true);
const generatingPdfId = ref<string | null>(null);

// Real-time listener for invoices
let unsubscribe: Unsubscribe | null = null;
onMounted(async () => {
  if (!user.value) {
    loading.value = false;
    return;
  }

  const q = query(
    collection(db, "invoices"),
    where("ownedBy", "==", user.value.uid),
    orderBy("createdAt", "desc")
  );

  unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      invoices.value = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Invoice[];
      loading.value = false;
    },
    (err) => {
      console.error("Error loading invoices:", err);
      loading.value = false;
    }
  );
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});

const handleGeneratePdf = async (invoiceId: string | undefined) => {
  if (!invoiceId) return;

  generatingPdfId.value = invoiceId;

  try {
    const token = await getAuthToken();
    if (!token) {
      alert("Authentication required");
      generatingPdfId.value = null;
      return;
    }

    const response = await fetch(
      `${config.public.pdfServiceUrl}/generate-pdf`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ invoiceId }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to generate PDF");
    }

    // Success - no alert needed, the PDF link will appear automatically
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Make sure the PDF service is running.");
  } finally {
    generatingPdfId.value = null;
  }
};

const handleDeletePdf = async (invoiceId: string | undefined) => {
  if (!invoiceId) return;

  try {
    // Update invoice to remove PDF URL
    await updateDoc(doc(db, "invoices", invoiceId), {
      pdfUrl: null,
      pdfGeneratedAt: null,
    });
  } catch (error) {
    console.error("Error deleting PDF:", error);
    alert("Failed to delete PDF");
  }
};

const handleUpdateStatus = async (
  invoiceId: string | undefined,
  newStatus: string
) => {
  if (!invoiceId) return;

  try {
    await updateDoc(doc(db, "invoices", invoiceId), {
      status: newStatus,
    });
  } catch (error) {
    console.error("Error updating status:", error);
    alert("Failed to update status");
  }
};

const handleDeleteInvoice = async (invoiceId: string | undefined) => {
  if (!invoiceId) return;

  try {
    // Delete the invoice document (PDF will be orphaned in storage but that's okay)
    await deleteDoc(doc(db, "invoices", invoiceId));
  } catch (error) {
    console.error("Error deleting invoice:", error);
    alert("Failed to delete invoice");
  }
};
</script>
