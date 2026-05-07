<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click.self="handleClose"
    >
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

      <div class="flex min-h-screen items-center justify-center p-4">
        <div
          class="relative w-full max-w-2xl bg-white rounded-lg shadow-xl"
          @click.stop
        >
          <div class="flex items-center justify-between border-b px-6 py-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">
                Email Template
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                Invoice #{{ invoice.number }}
              </p>
            </div>
            <button
              @click="handleClose"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div class="p-6 space-y-4">
            <div>
              <p class="text-xs font-medium text-gray-500">Subject</p>
              <p class="text-gray-900 font-medium mt-1">
                {{ emailSubject }}
              </p>
            </div>

            <div>
              <p class="text-xs font-medium text-gray-500">Message</p>
              <pre
                class="mt-1 whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800"
              >{{ emailBody }}</pre>
            </div>
          </div>

          <div class="flex justify-end space-x-3 px-6 py-4 border-t">
            <button @click="handleClose" class="btn-secondary">Close</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { doc, getDoc } from "firebase/firestore";
import type { Invoice, UserSettings } from "~/lib/types";

interface Props {
  isOpen: boolean;
  invoice: Invoice;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
}>();

const { db } = useFirebase();
const { user } = useAuth();

const settings = ref<UserSettings | null>(null);
const recipientName = "Brett";

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (!isOpen || !user.value) return;

    const settingsDoc = await getDoc(doc(db, "settings", user.value.uid));
    settings.value = settingsDoc.exists()
      ? (settingsDoc.data() as UserSettings)
      : null;

  },
  { immediate: true }
);

const getIsoWeekNumber = (date: Date): number => {
  const utcDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  return Math.ceil(((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const getWeekPair = (date: Date): { weekStart: number; weekEnd: number; year: number } => {
  const week = getIsoWeekNumber(date);
  const weekStart = week % 2 === 0 ? week - 1 : week;
  const weekEnd = week % 2 === 0 ? week : week + 1;
  return { weekStart, weekEnd, year: date.getFullYear() };
};

const emailSubject = computed(() => {
  const issueDate = new Date(props.invoice.issueDate);
  const { weekStart, weekEnd, year } = getWeekPair(issueDate);
  return `Salary Invoice for Weeks ${weekStart} & ${weekEnd}, ${year}`;
});

const emailBody = computed(() => {
  const issueDate = new Date(props.invoice.issueDate);
  const { weekStart, weekEnd, year } = getWeekPair(issueDate);
  const bankDetailsLine = settings.value?.bankDetails
    ? ", along with my bank details"
    : "";
  const lines = [
    `Dear ${recipientName},`,
    "",
    `Please find attached my salary invoice for Weeks ${weekStart} & ${weekEnd}, ${year}${bankDetailsLine}.`,
    "Feel free to reach out if you have any questions.",
  ];

  return lines.join("\n");
});

const handleClose = () => {
  emit("close");
};
</script>
