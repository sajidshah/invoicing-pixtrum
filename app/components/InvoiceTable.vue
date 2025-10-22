<template>
  <div>
    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-500">Loading invoices...</p>
    </div>

    <div v-else-if="invoices.length === 0" class="text-center py-8">
      <p class="text-gray-500 mb-4">
        No invoices yet. Create your first invoice!
      </p>
      <NuxtLink to="/invoices/new" class="btn-primary">
        + Create Invoice
      </NuxtLink>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Number</th>
            <th>Client</th>
            <th>Issue Date</th>
            <th>Due Date</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="invoice in invoices"
            :key="invoice.id"
            :class="{
              'opacity-60': generatingPdfId === invoice.id,
              'bg-blue-50 ring-2 ring-blue-200':
                openDropdownInvoiceId === invoice.id,
            }"
            class="transition-colors duration-150"
          >
            <td class="font-medium">{{ invoice.number }}</td>
            <td>
              <span v-if="getClientName(invoice.clientId)">
                {{ getClientName(invoice.clientId) }}
              </span>
              <span v-else class="text-gray-400">Unknown</span>
            </td>
            <td>{{ formatDate(invoice.issueDate) }}</td>
            <td>{{ formatDate(invoice.dueDate) }}</td>
            <td class="font-medium">
              {{ formatCurrency(invoice.total, invoice.currency) }}
            </td>
            <td>
              <span
                class="px-2 py-1 text-xs font-medium rounded-full"
                :class="{
                  'bg-gray-100 text-gray-800': invoice.status === 'draft',
                  'bg-blue-100 text-blue-800': invoice.status === 'sent',
                  'bg-green-100 text-green-800': invoice.status === 'paid',
                }"
              >
                {{ invoice.status }}
              </span>
            </td>
            <td>
              <div
                class="relative inline-block text-left"
                v-if="generatingPdfId === invoice.id"
              >
                <div class="flex items-center space-x-2 text-sm text-gray-600">
                  <svg
                    class="animate-spin h-4 w-4"
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
                  <span>Generating...</span>
                </div>
              </div>
              <InvoiceActionsDropdown
                v-else
                :invoice="invoice"
                @generate-pdf="$emit('generate-pdf', invoice.id)"
                @delete-pdf="$emit('delete-pdf', invoice.id)"
                @update-status="
                  (newStatus) => $emit('update-status', invoice.id, newStatus)
                "
                @delete-invoice="$emit('delete-invoice', invoice.id)"
                @dropdown-open="
                  (isOpen) => handleDropdownOpen(invoice.id || '', isOpen)
                "
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { collection, query, where, getDocs } from "firebase/firestore";
import type { Invoice, Client } from "~/lib/types";
import { formatCurrency, formatDate } from "~/lib/utils";

interface Props {
  invoices: Invoice[];
  loading: boolean;
  generatingPdfId?: string | null;
}

defineProps<Props>();
defineEmits<{
  "generate-pdf": [invoiceId: string | undefined];
  "delete-pdf": [invoiceId: string | undefined];
  "update-status": [invoiceId: string | undefined, newStatus: string];
  "delete-invoice": [invoiceId: string | undefined];
}>();

const { db } = useFirebase();
const { user } = useAuth();

const clients = ref<Map<string, string>>(new Map());
const openDropdownInvoiceId = ref<string | null>(null);

const handleDropdownOpen = (invoiceId: string, isOpen: boolean) => {
  openDropdownInvoiceId.value = isOpen ? invoiceId : null;
};

// Load client names for display
onMounted(async () => {
  if (!user.value) return;

  const q = query(
    collection(db, "clients"),
    where("ownedBy", "==", user.value.uid)
  );

  const snapshot = await getDocs(q);
  snapshot.docs.forEach((doc) => {
    const client = doc.data() as Client;
    clients.value.set(doc.id, client.name);
  });
});

const getClientName = (clientId: string): string => {
  return clients.value.get(clientId) || "";
};
</script>
