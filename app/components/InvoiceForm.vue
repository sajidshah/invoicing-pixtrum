<template>
  <div>
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div
        v-if="error"
        class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
      >
        {{ error }}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="clientId" class="label">Client *</label>
          <select
            id="clientId"
            v-model="formData.clientId"
            required
            class="input"
          >
            <option value="">Select a client</option>
            <option
              v-for="client in clients"
              :key="client.id"
              :value="client.id"
            >
              {{ client.name }}
            </option>
          </select>
        </div>

        <div>
          <label for="number" class="label">Invoice Number *</label>
          <input
            id="number"
            v-model="formData.number"
            type="text"
            required
            class="input"
            placeholder="INV-2024-0001"
          />
        </div>

        <div>
          <label for="issueDate" class="label">Issue Date *</label>
          <input
            id="issueDate"
            v-model="formData.issueDate"
            type="date"
            required
            class="input"
          />
        </div>

        <div>
          <label for="dueDate" class="label">Due Date *</label>
          <input
            id="dueDate"
            v-model="formData.dueDate"
            type="date"
            required
            class="input"
          />
        </div>

        <div>
          <label for="tax" class="label">Tax Rate (%) *</label>
          <input
            id="tax"
            v-model.number="formData.tax"
            type="number"
            step="0.01"
            min="0"
            max="100"
            required
            class="input"
            placeholder="10"
          />
        </div>

        <!-- Hidden fields - auto-populated -->
        <input type="hidden" v-model="formData.currency" />
        <input type="hidden" v-model="formData.status" />
      </div>

      <!-- Line Items -->
      <div class="border-t pt-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Line Items</h3>
          <button type="button" @click="addItem" class="btn-secondary text-sm">
            + Add Item
          </button>
        </div>

        <!-- Column Headers -->
        <div class="grid grid-cols-12 gap-3 mb-2 px-1">
          <div class="col-span-5">
            <label class="text-xs font-semibold text-gray-600 uppercase"
              >Description</label
            >
          </div>
          <div class="col-span-2">
            <label class="text-xs font-semibold text-gray-600 uppercase">{{
              settings?.quantityLabel || "Qty"
            }}</label>
          </div>
          <div class="col-span-3">
            <label class="text-xs font-semibold text-gray-600 uppercase">{{
              settings?.unitPriceLabel || "Unit Price"
            }}</label>
          </div>
          <div class="col-span-2">
            <label class="text-xs font-semibold text-gray-600 uppercase"
              >Line Total</label
            >
          </div>
        </div>

        <div class="space-y-3">
          <div
            v-for="(item, index) in formData.items"
            :key="index"
            class="grid grid-cols-12 gap-3 items-start"
          >
            <div class="col-span-5">
              <input
                v-model="item.description"
                type="text"
                required
                class="input"
                placeholder="Item description"
              />
            </div>
            <div class="col-span-2">
              <input
                v-model.number="item.quantity"
                type="number"
                step="0.01"
                min="0.01"
                required
                class="input"
                placeholder="1"
              />
            </div>
            <div class="col-span-3">
              <input
                v-model.number="item.unitPrice"
                type="number"
                step="0.01"
                min="0"
                required
                class="input"
                placeholder="0.00"
              />
            </div>
            <div class="col-span-2 flex items-center justify-between">
              <span class="text-sm font-medium">
                {{
                  formatCurrency(
                    item.quantity * item.unitPrice,
                    formData.currency
                  )
                }}
              </span>
              <button
                type="button"
                @click="removeItem(index)"
                class="text-red-600 hover:text-red-800 ml-2"
                :disabled="formData.items.length === 1"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Totals -->
      <div class="border-t pt-6">
        <div class="flex justify-end">
          <div class="w-64 space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Subtotal:</span>
              <span class="font-medium">{{
                formatCurrency(totals.subtotal, formData.currency)
              }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Tax ({{ formData.tax }}%):</span>
              <span class="font-medium">{{
                formatCurrency(totals.tax, formData.currency)
              }}</span>
            </div>
            <div class="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>{{ formatCurrency(totals.total, formData.currency) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex space-x-3 pt-4">
        <button type="submit" class="btn-primary flex-1" :disabled="submitting">
          {{ submitting ? "Creating Invoice..." : "Create Invoice" }}
        </button>
        <button type="button" @click="$emit('cancel')" class="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { invoiceSchema, type InvoiceFormData } from "~/lib/validators";
import type { Client, InvoiceItem, UserSettings } from "~/lib/types";
import { calculateInvoiceTotals, formatCurrency } from "~/lib/utils";

interface Props {
  clients: Client[];
  settings?: UserSettings | null;
  submitting?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  submit: [data: InvoiceFormData];
  cancel: [];
}>();

// Get today's date in YYYY-MM-DD format
const today = new Date().toISOString().split("T")[0];

// Calculate next invoice number from settings
const nextInvoiceNumber = computed(() => {
  if (props.settings) {
    return props.settings.invoiceStartNumber.toString();
  }
  return "1";
});

const formData = reactive<InvoiceFormData>({
  clientId: "",
  number: nextInvoiceNumber.value,
  issueDate: today,
  dueDate: today,
  items: [{ description: "", quantity: 1, unitPrice: 0 }],
  tax: props.settings?.defaultTaxRate ?? 0,
  currency: props.settings?.defaultCurrency ?? "USD",
  status: "draft",
});

// Update invoice number and defaults when settings change
watch(
  () => props.settings,
  (newSettings) => {
    if (newSettings) {
      formData.number = newSettings.invoiceStartNumber.toString();
      formData.tax = newSettings.defaultTaxRate;
      formData.currency = newSettings.defaultCurrency;
    }
  },
  { immediate: true }
);

const error = ref<string | null>(null);

const totals = computed(() =>
  calculateInvoiceTotals(formData.items, formData.tax)
);

const addItem = () => {
  formData.items.push({ description: "", quantity: 1, unitPrice: 0 });
};

const removeItem = (index: number) => {
  if (formData.items.length > 1) {
    formData.items.splice(index, 1);
  }
};

const handleSubmit = () => {
  error.value = null;

  const validation = invoiceSchema.safeParse(formData);
  if (!validation.success) {
    error.value = validation.error.errors[0].message;
    return;
  }

  emit("submit", validation.data);
};
</script>
