<template>
	<div class="la-field-lookup" v-if="field && field_lookup">
		<div class="field-values">
			<div class="result" v-if="show_result">
				<v-table v-if="show_mode == SHOW_MODE.TABLE" class="result-table" density="compact">
					<thead>
						<tr>
							<th class="text-left">
								<strong>Id</strong>
							</th>
							<th class="text-left">
								<strong>Label</strong>
							</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="item in selected_records" :key="item[field_lookup.key_id]">
							<td>{{ item[field_lookup.key_id] }}</td>
							<td>
								<nuxt-link target="blank" :to="getViewPath(item[field_lookup.key_id])">
									<span>{{ item[field_lookup.key_label] }}</span>
								</nuxt-link>
							</td>
						</tr>
					</tbody>
				</v-table>
				<div class="result-text" v-if="show_mode == SHOW_MODE.TEXT">
					{{ result_text_labels }}
				</div>
				<div class="input-ids" v-if="show_mode == SHOW_MODE.INPUT_TEXT">
					<v-text-field v-model="selected_ids_str" variant="underlined" density="compact" hide-details="auto"
						@update:model-value="onUpdateSelectedIdsInput"/>
				</div>
			</div>
			<v-btn v-if="mode == FORM_MODE.EDIT" icon="mdi-pencil" size="x-small" variant="tonal" @click="openDialog">
			</v-btn>
		</div>

		<!-- Dialog -->
		<v-dialog v-model="dialog_lookup" transition="dialog-bottom-transition" width="auto" fullscreen :z-index="1000">
			<v-card>
				<v-toolbar>
					<v-btn icon="mdi-close" @click="dialog_lookup = false"></v-btn>
					<v-toolbar-title> {{ field_lookup.page_caption }}</v-toolbar-title>
					<v-spacer></v-spacer>
					<v-toolbar-items>
						<v-btn color="primary" text="Done" variant="tonal" @click="saveLookUp"></v-btn>
					</v-toolbar-items>
				</v-toolbar>
				<v-card-text>
					<page-list ref="ref_page_list" select_mode :show_toolbar="false" :select_multiple="field_lookup.multiple"
						:page_class="field_lookup.page_class" :editable="false" :insertable="false"
						:page_path="field_lookup.page_path" :initial_filters="initial_filters"
						:selected_record_label="field_lookup.key_label" v-model:selected_records="records_in_list"
						@loaded="loadSelectedRecords" load_selected_records>
					</page-list>
				</v-card-text>
			</v-card>
		</v-dialog>
	</div>
</template>

<script setup>

// Constants
const SHOW_MODE = {
	TABLE: "table",
	TEXT: "text",
	INPUT_TEXT: "input-text"
};

// Emits
const emit = defineEmits(["done","update:selected_ids_str"]);

// Model
const selected_ids_str = defineModel('selected_ids_str', { default: "" });

// Props
const { mode, field, initial_filters, show_result, show_mode, selected_records } = defineProps({
	mode: {
		type: String,
		default: ""
	},
	field: {
		type: Object,
		default: ""
	},
	selected_records: {
		type: Array,
		default: []
	},
	initial_filters: {
		type: Array,
		default: []
	},
	show_result: {
		type: Boolean,
		default: true
	},
	show_mode: {
		type: String,
		default: "table"
	}
});

// Watch
watch(() => selected_records, (new_val, old_val) => {
	convertSelectedRecordsToIdsString();
})

// Template Ref
const ref_page_list = useTemplateRef("ref_page_list");

// Refs
const dialog_lookup = ref(false);
const field_lookup = field?.field_lookup;
const records_in_list = ref([]);

// Computed
const result_text_labels = computed(() => {
	let str_array = [];

	for (let i in selected_records.value) {
		const r = selected_records.value[i];
		const label = r[field_lookup.key_label];
		if (label) {
			str_array.push(label);
		}
	}

	return str_array.join(STRING_VALUES_SEPERATOR);
});

// Functions 
function getViewPath(target_id) {
	return field_lookup.page_path + "?id=" + target_id + "&mode=view";
}

async function openDialog() {
	if (mode != FORM_MODE.EDIT) {
		return;
	}

	dialog_lookup.value = true;
}

async function loadSelectedRecords() {
	if (!selected_ids_str) {
		return;
	}

	const selected_ids = selected_ids_str.value.split(STRING_VALUES_SEPERATOR);
	records_in_list.value = await ref_page_list.value.loadRecordsByIds(selected_ids);
	ref_page_list.value.initRecords();
}

function saveLookUp() {
	dialog_lookup.value = false;

	emit("done", field, records_in_list.value);
}

function convertSelectedRecordsToIdsString() {
	let str_array = [];

	for (let i in selected_records) {
		const record = selected_records[i];
		const id_value = record[field_lookup.key_id];
		if (id_value) {
			str_array.push(id_value);
		}
	}

	selected_ids_str.value = str_array.join(STRING_VALUES_SEPERATOR);
}

function onUpdateSelectedIdsInput() {
}

// onMounted(() => {
// 	convertSelectedRecordsToIdsString();
// })

</script>

<style lang="less">
.la-field-lookup {
	.field-values {
		display: flex;
		gap: 8px;

		.result {
			width: 100%;
			align-self: flex-end;

			.result-table {
				border: 1px solid #ccc;
				padding: 0px 0px;
				border-radius: 4px;
			}

			.input-ids {
				width: 100%;
			}
		}

	}
}
</style>
