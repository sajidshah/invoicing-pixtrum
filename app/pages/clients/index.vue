<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Clients</h1>
          <p class="text-gray-600 mt-1">Manage your client database</p>
        </div>
        <NuxtLink to="/" class="btn-secondary"> ← Back to Dashboard </NuxtLink>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Client Form -->
        <div class="lg:col-span-1">
          <ClientForm
            :client="selectedClient"
            @submit="handleClientSubmit"
            @cancel="selectedClient = null"
          />
        </div>

        <!-- Clients List -->
        <div class="lg:col-span-2">
          <div class="card">
            <h2 class="text-xl font-semibold mb-4">Your Clients</h2>

            <div v-if="loading" class="text-center py-8">
              <p class="text-gray-500">Loading clients...</p>
            </div>

            <div v-else-if="clients.length === 0" class="text-center py-8">
              <p class="text-gray-500">
                No clients yet. Create your first client!
              </p>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="client in clients"
                :key="client.id"
                class="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
              >
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <h3 class="font-semibold text-lg">{{ client.name }}</h3>
                    <div class="text-sm text-gray-600 mt-1 space-y-1">
                      <p v-if="client.email">📧 {{ client.email }}</p>
                      <p v-if="client.phone">📱 {{ client.phone }}</p>
                      <p v-if="client.taxId">🆔 {{ client.taxId }}</p>
                    </div>
                  </div>
                  <div class="flex space-x-2">
                    <button
                      @click="editClient(client)"
                      class="btn-secondary text-sm"
                    >
                      Edit
                    </button>
                    <button
                      @click="deleteClient(client.id)"
                      class="btn-danger text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import type { Client } from "~/lib/types";
import type { ClientFormData } from "~/lib/validators";

const { db } = useFirebase();
const { user } = useAuth();

const clients = ref<Client[]>([]);
const loading = ref(true);
const selectedClient = ref<Client | null>(null);

// Real-time listener for clients
let unsubscribe: Unsubscribe | null = null;
onMounted(async () => {
  if (!user.value) {
    loading.value = false;
    return;
  }

  const q = query(
    collection(db, "clients"),
    where("ownedBy", "==", user.value.uid),
    orderBy("createdAt", "desc")
  );

  unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      clients.value = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Client[];
      loading.value = false;
    },
    (err) => {
      console.error("Error loading clients:", err);
      loading.value = false;
    }
  );
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});

const handleClientSubmit = async (data: ClientFormData) => {
  if (!user.value) return;

  try {
    if (selectedClient.value?.id) {
      // Update existing client
      await updateDoc(doc(db, "clients", selectedClient.value.id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Create new client
      await addDoc(collection(db, "clients"), {
        ...data,
        ownedBy: user.value.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    selectedClient.value = null;
  } catch (error) {
    console.error("Error saving client:", error);
    alert("Failed to save client");
  }
};

const editClient = (client: Client) => {
  selectedClient.value = client;
};

const deleteClient = async (clientId?: string) => {
  if (!clientId) return;
  if (!confirm("Are you sure you want to delete this client?")) return;

  try {
    await deleteDoc(doc(db, "clients", clientId));
  } catch (error) {
    console.error("Error deleting client:", error);
    alert("Failed to delete client");
  }
};
</script>
