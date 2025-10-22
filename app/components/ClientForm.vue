<template>
  <div class="card">
    <h2 class="text-xl font-semibold mb-4">
      {{ client ? "Edit Client" : "New Client" }}
    </h2>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div
        v-if="error"
        class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
      >
        {{ error }}
      </div>

      <div>
        <label for="name" class="label">Name *</label>
        <input
          id="name"
          v-model="formData.name"
          type="text"
          required
          class="input"
          placeholder="Acme Corp"
        />
      </div>

      <div>
        <label for="email" class="label">Email</label>
        <input
          id="email"
          v-model="formData.email"
          type="email"
          class="input"
          placeholder="contact@acme.com"
        />
      </div>

      <div>
        <label for="phone" class="label">Phone</label>
        <input
          id="phone"
          v-model="formData.phone"
          type="tel"
          class="input"
          placeholder="+1 234 567 8900"
        />
      </div>

      <div>
        <label for="address" class="label">Address</label>
        <textarea
          id="address"
          v-model="formData.address"
          rows="3"
          class="input"
          placeholder="123 Main St, City, State 12345"
        />
      </div>

      <div>
        <label for="taxId" class="label">Tax ID / VAT</label>
        <input
          id="taxId"
          v-model="formData.taxId"
          type="text"
          class="input"
          placeholder="XX-XXXXXXX"
        />
      </div>

      <div>
        <label for="notes" class="label">Notes</label>
        <textarea
          id="notes"
          v-model="formData.notes"
          rows="3"
          class="input"
          placeholder="Any additional notes..."
        />
      </div>

      <div class="flex space-x-3 pt-4">
        <button type="submit" class="btn-primary flex-1">
          {{ client ? "Update Client" : "Create Client" }}
        </button>
        <button
          v-if="client"
          type="button"
          @click="$emit('cancel')"
          class="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { clientSchema, type ClientFormData } from "~/lib/validators";
import type { Client } from "~/lib/types";

interface Props {
  client?: Client | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  submit: [data: ClientFormData];
  cancel: [];
}>();

const formData = reactive<ClientFormData>({
  name: "",
  email: "",
  phone: "",
  address: "",
  taxId: "",
  notes: "",
});

const error = ref<string | null>(null);

// Populate form when editing
watch(
  () => props.client,
  (client) => {
    if (client) {
      formData.name = client.name;
      formData.email = client.email || "";
      formData.phone = client.phone || "";
      formData.address = client.address || "";
      formData.taxId = client.taxId || "";
      formData.notes = client.notes || "";
    } else {
      // Reset form
      formData.name = "";
      formData.email = "";
      formData.phone = "";
      formData.address = "";
      formData.taxId = "";
      formData.notes = "";
    }
    error.value = null;
  },
  { immediate: true }
);

const handleSubmit = () => {
  error.value = null;

  const validation = clientSchema.safeParse(formData);
  if (!validation.success) {
    error.value = validation.error.errors[0].message;
    return;
  }

  emit("submit", validation.data);
};
</script>
