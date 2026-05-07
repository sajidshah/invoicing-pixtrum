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
          @edit-invoice="handleEditInvoice"
          @delete-invoice="handleDeleteInvoice"
          @send-email="handleSendEmail"
          @view-email-template="handleViewEmailTemplate"
          @clone-invoice="handleOpenCloneModal"
        />
      </div>
    </div>

    <!-- Send Email Modal -->
    <SendEmailModal
      v-if="selectedInvoice"
      :is-open="emailModalOpen"
      :invoice="selectedInvoice"
      @close="emailModalOpen = false"
      @sent="handleEmailSent"
    />

    <InvoiceEmailTemplateModal
      v-if="selectedTemplateInvoice"
      :is-open="emailTemplateModalOpen"
      :invoice="selectedTemplateInvoice"
      @close="emailTemplateModalOpen = false"
    />

    <InvoiceCloneModal
      v-if="selectedCloneInvoice"
      :is-open="cloneModalOpen"
      :invoice="selectedCloneInvoice"
      @close="handleCloneModalClose"
      @clone="handleCloneInvoice"
    />
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
  getDoc,
  addDoc,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import type { Invoice, UserSettings } from "~/lib/types";
import { calculateInvoiceTotals } from "~/lib/utils";

const { db } = useFirebase();
const { user, getAuthToken } = useAuth();
const config = useRuntimeConfig();
const notification = useNotification();

const invoices = ref<Invoice[]>([]);
const loading = ref(true);
const generatingPdfId = ref<string | null>(null);
const emailModalOpen = ref(false);
const selectedInvoice = ref<Invoice | null>(null);
const emailTemplateModalOpen = ref(false);
const selectedTemplateInvoice = ref<Invoice | null>(null);
const cloneModalOpen = ref(false);
const selectedCloneInvoice = ref<Invoice | null>(null);
const settings = ref<UserSettings | null>(null);

// Real-time listener for invoices
let unsubscribe: Unsubscribe | null = null;
onMounted(async () => {
  if (!user.value) {
    loading.value = false;
    return;
  }

  const settingsDoc = await getDoc(doc(db, "settings", user.value.uid));
  settings.value = settingsDoc.exists()
    ? (settingsDoc.data() as UserSettings)
    : null;

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

    notification.success("PDF generated successfully");
  } catch (error) {
    console.error("Error generating PDF:", error);
    notification.error(
      "Failed to generate PDF. Make sure the PDF service is running."
    );
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
    notification.success("PDF deleted successfully");
  } catch (error) {
    console.error("Error deleting PDF:", error);
    notification.error("Failed to delete PDF");
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
    notification.success(`Status updated to ${newStatus}`);
  } catch (error) {
    console.error("Error updating status:", error);
    notification.error("Failed to update status");
  }
};

const handleDeleteInvoice = async (invoiceId: string | undefined) => {
  if (!invoiceId) return;

  try {
    // Delete the invoice document (PDF will be orphaned in storage but that's okay)
    await deleteDoc(doc(db, "invoices", invoiceId));
    notification.success("Invoice deleted successfully");
  } catch (error) {
    console.error("Error deleting invoice:", error);
    notification.error("Failed to delete invoice");
  }
};

const handleEditInvoice = (invoiceId: string | undefined) => {
  if (!invoiceId) return;
  navigateTo(`/invoices/${invoiceId}`);
};

const handleSendEmail = (invoiceId: string | undefined) => {
  if (!invoiceId) return;

  const invoice = invoices.value.find((inv) => inv.id === invoiceId);
  if (!invoice) return;

  selectedInvoice.value = invoice;
  emailModalOpen.value = true;
};

const handleViewEmailTemplate = (invoiceId: string | undefined) => {
  if (!invoiceId) return;

  const invoice = invoices.value.find((inv) => inv.id === invoiceId);
  if (!invoice) return;

  selectedTemplateInvoice.value = invoice;
  emailTemplateModalOpen.value = true;
};

const handleCloneModalClose = () => {
  cloneModalOpen.value = false;
  selectedCloneInvoice.value = null;
};

const handleOpenCloneModal = (invoiceId: string | undefined) => {
  if (!invoiceId) return;

  const invoice = invoices.value.find((inv) => inv.id === invoiceId);
  if (!invoice) return;

  selectedCloneInvoice.value = invoice;
  cloneModalOpen.value = true;
};

const handleCloneInvoice = async (payload: {
  dateStart: string;
  dateEnd: string;
  description: string;
}) => {
  if (!user.value || !selectedCloneInvoice.value) return;
  if (!settings.value) {
    notification.error("Settings not found. Please open Settings and try again.");
    return;
  }

  cloneModalOpen.value = false;

  try {
    const source = selectedCloneInvoice.value;
    const items = source.items.map((item, index) => {
      if (index === 0) {
        return { ...item, description: payload.description };
      }
      return { ...item };
    });

    const totals = calculateInvoiceTotals(items, source.tax);

    await addDoc(collection(db, "invoices"), {
      clientId: source.clientId,
      number: settings.value.invoiceStartNumber.toString(),
      issueDate: payload.dateEnd,
      dueDate: payload.dateEnd,
      items,
      tax: source.tax,
      currency: source.currency,
      status: "draft",
      ownedBy: user.value.uid,
      subtotal: totals.subtotal,
      total: totals.total,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "settings", user.value.uid), {
      invoiceStartNumber: settings.value.invoiceStartNumber + 1,
      updatedAt: serverTimestamp(),
    });

    settings.value = {
      ...settings.value,
      invoiceStartNumber: settings.value.invoiceStartNumber + 1,
    };

    notification.success("Invoice cloned successfully");
  } catch (error) {
    console.error("Error cloning invoice:", error);
    notification.error("Failed to clone invoice");
  } finally {
    selectedCloneInvoice.value = null;
  }
};

const handleEmailSent = () => {
  // Email sent notification is handled by useGmail composable
  // Just close the modal - the composable already shows success toast
};
</script>
