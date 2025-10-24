<template>
  <div class="relative inline-block text-left" ref="containerRef">
    <button
      ref="buttonRef"
      @click="toggleDropdown"
      @blur="handleBlur"
      class="inline-flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
      title="Actions"
    >
      <svg
        class="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"
        />
      </svg>
    </button>

    <!-- Teleport dropdown to body to avoid overflow issues -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="menuRef"
        class="fixed w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
        :style="menuStyle"
        @mousedown.prevent
      >
        <div class="py-1" role="menu">
          <!-- Status Options - Compact Row -->
          <div class="px-3 py-2">
            <div class="text-xs font-semibold text-gray-500 uppercase mb-2">
              Status
            </div>
            <div class="flex gap-1">
              <button
                @mousedown.prevent="handleUpdateStatus('draft')"
                class="flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1"
                :class="
                  invoice.status === 'draft'
                    ? 'bg-gray-100 text-gray-900 ring-1 ring-gray-300'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                "
                role="menuitem"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                <span>Draft</span>
              </button>
              <button
                @mousedown.prevent="handleUpdateStatus('sent')"
                class="flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1"
                :class="
                  invoice.status === 'sent'
                    ? 'bg-blue-100 text-blue-900 ring-1 ring-blue-300'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                "
                role="menuitem"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>Sent</span>
              </button>
              <button
                @mousedown.prevent="handleUpdateStatus('paid')"
                class="flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1"
                :class="
                  invoice.status === 'paid'
                    ? 'bg-green-100 text-green-900 ring-1 ring-green-300'
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                "
                role="menuitem"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                <span>Paid</span>
              </button>
            </div>
          </div>

          <div class="border-t border-gray-100"></div>

          <!-- PDF Options -->
          <button
            v-if="!invoice.pdfUrl"
            @mousedown.prevent="handleGeneratePdf"
            class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            role="menuitem"
          >
            <span>📄</span>
            <span>Generate PDF</span>
          </button>
          <button
            v-else
            @mousedown.prevent="handleViewPdf"
            class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            role="menuitem"
          >
            <span>📥</span>
            <span>View PDF</span>
          </button>

          <!-- Send Email Option -->
          <button
            v-if="invoice.pdfUrl"
            @mousedown.prevent="handleSendEmail"
            class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            role="menuitem"
          >
            <span>✉️</span>
            <span>Send Email</span>
          </button>

          <!-- Delete PDF with confirmation -->
          <div v-if="invoice.pdfUrl && !showDeletePdfConfirm">
            <button
              @mousedown.prevent="showDeletePdfConfirm = true"
              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              role="menuitem"
            >
              <span>🗑️</span>
              <span>Delete PDF</span>
            </button>
          </div>
          <div
            v-else-if="invoice.pdfUrl && showDeletePdfConfirm"
            class="px-4 py-2"
          >
            <div class="text-xs text-gray-600 mb-2">Delete PDF file?</div>
            <div class="flex gap-2">
              <button
                @mousedown.prevent="handleDeletePdf"
                class="flex-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm font-medium flex items-center justify-center"
              >
                ✓ Yes
              </button>
              <button
                @mousedown.prevent="showDeletePdfConfirm = false"
                class="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm font-medium flex items-center justify-center"
              >
                ✕ No
              </button>
            </div>
          </div>

          <div class="border-t border-gray-100 my-1"></div>

          <!-- Delete Invoice -->
          <div v-if="!showDeleteConfirm">
            <button
              @mousedown.prevent="showDeleteConfirm = true"
              class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
              role="menuitem"
            >
              <span>🗑️</span>
              <span>Delete Invoice</span>
            </button>
          </div>
          <div v-else class="px-4 py-2">
            <div class="text-xs text-gray-600 mb-2">Delete invoice?</div>
            <div class="flex gap-2">
              <button
                @mousedown.prevent="handleDeleteInvoice"
                class="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium flex items-center justify-center"
              >
                ✓ Yes
              </button>
              <button
                @mousedown.prevent="showDeleteConfirm = false"
                class="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm font-medium flex items-center justify-center"
              >
                ✕ No
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { Invoice } from "~/lib/types";

interface Props {
  invoice: Invoice;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "generate-pdf": [];
  "delete-pdf": [];
  "update-status": [newStatus: string];
  "delete-invoice": [];
  "send-email": [];
  "dropdown-open": [isOpen: boolean];
}>();

const isOpen = ref(false);
const showDeleteConfirm = ref(false);
const showDeletePdfConfirm = ref(false);
const buttonRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const menuStyle = ref({});

const calculatePosition = () => {
  if (!buttonRef.value) return;

  // Get button position relative to viewport
  const rect = buttonRef.value.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const menuWidth = 192; // w-48 = 12rem = 192px

  // Wait for menu to render to get actual height
  nextTick(() => {
    if (!menuRef.value) return;

    const menuHeight = menuRef.value.offsetHeight || 320;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top = 0;
    let left = 0;

    // Vertical positioning
    if (spaceBelow >= menuHeight + 16) {
      // Enough space below - open downward
      top = rect.bottom + 8;
    } else if (spaceAbove >= menuHeight + 16) {
      // Not enough space below but enough above - open upward
      top = rect.top - menuHeight - 8;
    } else {
      // Not enough space either way - position to fit best
      if (spaceBelow > spaceAbove) {
        top = rect.bottom + 8;
      } else {
        top = Math.max(8, rect.top - menuHeight - 8);
      }
    }

    // Horizontal positioning - align right edge of menu with right edge of button
    left = rect.right - menuWidth;

    // Keep within viewport bounds
    if (left < 8) {
      left = 8;
    }
    if (left + menuWidth > viewportWidth - 8) {
      left = viewportWidth - menuWidth - 8;
    }
    if (top < 8) {
      top = 8;
    }
    if (top + menuHeight > viewportHeight - 8) {
      top = Math.max(8, viewportHeight - menuHeight - 8);
    }

    menuStyle.value = {
      top: `${top}px`,
      left: `${left}px`,
    };
  });
};

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
  emit("dropdown-open", isOpen.value);
  if (isOpen.value) {
    showDeleteConfirm.value = false;
    showDeletePdfConfirm.value = false;
    nextTick(() => {
      calculatePosition();
    });
  }
};

const handleBlur = () => {
  // Delay to allow click events to fire
  setTimeout(() => {
    if (isOpen.value) {
      isOpen.value = false;
      emit("dropdown-open", false);
    }
  }, 200);
};

// Click outside handler
const handleClickOutside = (event: MouseEvent) => {
  if (
    isOpen.value &&
    containerRef.value &&
    menuRef.value &&
    !containerRef.value.contains(event.target as Node) &&
    !menuRef.value.contains(event.target as Node)
  ) {
    isOpen.value = false;
    emit("dropdown-open", false);
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  window.addEventListener(
    "scroll",
    () => {
      if (isOpen.value) {
        calculatePosition();
      }
    },
    true
  );
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

const handleGeneratePdf = () => {
  isOpen.value = false;
  showDeleteConfirm.value = false;
  showDeletePdfConfirm.value = false;
  emit("dropdown-open", false);
  emit("generate-pdf");
};

const handleViewPdf = () => {
  if (props.invoice.pdfUrl) {
    window.open(props.invoice.pdfUrl, "_blank");
  }
  isOpen.value = false;
  showDeleteConfirm.value = false;
  showDeletePdfConfirm.value = false;
  emit("dropdown-open", false);
};

const handleSendEmail = () => {
  isOpen.value = false;
  showDeleteConfirm.value = false;
  showDeletePdfConfirm.value = false;
  emit("dropdown-open", false);
  emit("send-email");
};

const handleDeletePdf = () => {
  isOpen.value = false;
  showDeleteConfirm.value = false;
  showDeletePdfConfirm.value = false;
  emit("dropdown-open", false);
  emit("delete-pdf");
};

const handleUpdateStatus = (newStatus: string) => {
  isOpen.value = false;
  showDeleteConfirm.value = false;
  showDeletePdfConfirm.value = false;
  emit("dropdown-open", false);
  emit("update-status", newStatus);
};

const handleDeleteInvoice = () => {
  isOpen.value = false;
  showDeleteConfirm.value = false;
  showDeletePdfConfirm.value = false;
  emit("dropdown-open", false);
  emit("delete-invoice");
};
</script>
