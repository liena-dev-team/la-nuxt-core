<template>
	<!-- Mode edit: input field with eye toggle -->
	<v-text-field
		v-if="mode === 'edit'"
		:model-value="display_value"
		@update:model-value="onInput"
		density="compact"
		autocomplete="off"
		:variant="variant"
		:hide-details="hide_details"
		:disabled="disabled"
		:readonly="!state.show"
		@blur="emit('blur')"
		:error="!!error"
		:error-messages="error_messages"
		:type="state.show ? 'text' : 'password'"
		:append-icon="state.show ? 'mdi-eye' : 'mdi-eye-off'"
		@click:append="toggleShow"
	/>
	<!-- Mode edit_plain: auto-decrypt and display plain text directly, no eye -->
	<v-text-field
		v-else-if="mode === 'edit_plain'"
		:model-value="edit_plain_display"
		@update:model-value="onEditPlainInput"
		density="compact"
		autocomplete="off"
		:variant="variant"
		:hide-details="hide_details"
		:disabled="disabled"
		@blur="emit('blur')"
		:error="!!error"
		:error-messages="error_messages"
		:loading="edit_plain_loading"
		tile
	/>
	<!-- Mode view: display *****, click to open dialog and view full value -->
	<template v-else>
		<div :class="[field?.input_type, 'encrypt-masked']" @click.stop="openDialog">
			{{ encrypt_masked_display }}
		</div>
		<v-dialog v-model="dialog_open" max-width="480" persistent
			@click:outside="closeDialog" @update:model-value="onDialogModelChange">
			<v-card>
				<v-card-title class="text-subtitle-1">{{ dialog_caption }}</v-card-title>
				<v-card-text>
					<v-progress-linear v-if="dialog_loading" indeterminate color="primary" class="mb-2"></v-progress-linear>
					<div v-else class="encrypt-full-value">{{ dialog_decrypted_value ?? '—' }}</div>
				</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn color="primary" variant="tonal" @click="closeDialog">Đóng</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</template>
</template>

<script setup>
const { $admin_page } = useNuxtApp();

const { field, model_value, mode, caption, variant, hide_details, disabled, error, error_messages } = defineProps({
	field: { type: Object, required: true },
	model_value: { type: String, default: '' },
	mode: { type: String, default: 'edit' },
	caption: { type: String, default: '' },
	variant: { type: String, default: 'outlined' },
	hide_details: { type: [Boolean, String], default: 'auto' },
	disabled: { type: Boolean, default: false },
	error: { type: Boolean, default: false },
	error_messages: { type: [String, Array], default: () => [] }
});

const emit = defineEmits(['update:model_value', 'blur']);

const state = reactive({
	show: false,
	decrypted_value: null,
	loading: false
});

const dialog_open = ref(false);
const dialog_loading = ref(false);
const dialog_decrypted_value = ref(null);

const edit_plain_display_value = ref('');
const edit_plain_loading = ref(false);

/** Biến độc lập cho hiển thị trong mode edit_plain (giá trị đã giải mã), tách khỏi model_value (có thể đang mã hóa). */
const edit_plain_display = computed(() => edit_plain_display_value.value);

const raw_value_for_view = computed(() => model_value ?? field?.value ?? '');

const display_value = computed(() => {
	if (state.show && state.decrypted_value != null) {
		return state.decrypted_value;
	}
	return model_value ?? '';
});

const encrypt_masked_display = computed(() => {
	const v = raw_value_for_view.value;
	if (v === undefined || v === null || v === '') return '—';
	return '*****';
});

const dialog_caption = computed(() => caption || field?.caption || '');

async function fetchDecrypted(raw_value) {
	if (raw_value === undefined || raw_value === null || raw_value === '') return '—';
	try {
		const res = await $admin_page.decrypt(raw_value);
		const decoded = res?.value ?? res?.data ?? res;
		if (decoded == null) return '—';
		if (typeof decoded === 'string') return decoded;
		// API returns object (error or other format) → display message or generic error
		return decoded?.message ?? decoded?.error ?? 'Lỗi giải mã';
	} catch (e) {
		return 'Lỗi giải mã';
	}
}

function onInput(value) {
	if (state.show) {
		emit('update:model_value', value);
	}
}

function onEditPlainInput(val) {
	edit_plain_display_value.value = val;
	emit('update:model_value', val);
}

async function toggleShow() {
	if (state.loading) return;
	if (state.show) {
		state.show = false;
		state.decrypted_value = null;
		return;
	}
	state.loading = true;
	state.decrypted_value = await fetchDecrypted(model_value);
	state.show = true;
	state.loading = false;
}

async function openDialog() {
	const raw_value = raw_value_for_view.value;
	dialog_decrypted_value.value = null;
	dialog_loading.value = true;
	dialog_open.value = true;
	dialog_decrypted_value.value = await fetchDecrypted(raw_value);
	dialog_loading.value = false;
}

function closeDialog() {
	dialog_open.value = false;
	dialog_decrypted_value.value = null;
}

function onDialogModelChange(is_open) {
	if (!is_open) closeDialog();
}


// Reset state when receiving new value from server (after save + requestRead).
watch(() => model_value, (new_val) => {
	if (state.show && state.decrypted_value != null && new_val !== state.decrypted_value) {
		state.show = false;
		state.decrypted_value = null;
	}
});

// Plain phone pattern: đã giải mã hoặc user nhập (chỉ số, khoảng trắng, +-).
// Tránh gọi decrypt lần nữa khi click qua lại record mà field.value đang là plain.
const PLAIN_PHONE_PATTERN = /^[\d\s+\-()]{8,20}$/;

// Mode edit_plain: fetch decrypted value when model_value changes.
async function fetchEditPlainDecrypted() {
	const raw = String(model_value ?? field?.value ?? '').trim();
	if (raw === '') {
		edit_plain_display_value.value = '';
		return;
	}
	// Đã là plain (từ record khác hoặc user nhập) → không gọi decrypt.
	if (PLAIN_PHONE_PATTERN.test(raw)) {
		edit_plain_display_value.value = raw;
		return;
	}
	edit_plain_loading.value = true;
	try {
		const res = await $admin_page.decrypt(raw);
		const decoded = res?.value ?? res?.data ?? res;
		if (decoded != null && typeof decoded === 'string') {
			edit_plain_display_value.value = decoded;
		} else {
			edit_plain_display_value.value = decoded?.message ?? decoded?.error ?? raw;
		}
	} catch (e) {
		edit_plain_display_value.value = raw;
	} finally {
		edit_plain_loading.value = false;
	}
}

watch(() => model_value, () => {
	if (mode === 'edit_plain') {
		// Skip if value came from user typing (already in sync)
		if (model_value === edit_plain_display_value.value) return;
		fetchEditPlainDecrypted();
	}
}, { immediate: true });
</script>

<style scoped>
.encrypt-masked {
	cursor: pointer;
	user-select: none;
	color: var(--v-theme-primary);
}
.encrypt-masked:hover {
	text-decoration: underline;
}
.encrypt-full-value {
	word-break: break-all;
	padding: 8px 0;
	font-family: monospace;
}
</style>
