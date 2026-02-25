<template>
	<div class="la-page-list">
		<!-- Sticky ToolBar -->
		<v-toolbar v-if="show_toolbar" density="compact" :extension-height="8" extended>
			<v-toolbar-title>
				<div class="page-caption" v-if="!is_initializing">
					<span>{{ page_caption_ref }}</span>
					<span class="save-status">
						<template v-if="is_saved">
							<v-chip v-if="is_saving" variant="flat" color="blue"> Saving... </v-chip>
							<v-chip v-else variant="flat" color="green" prepend-icon="mdi-check-bold"> Saved
							</v-chip>
						</template>
						<template v-else>
							<v-chip variant="flat" color="yellow">Not Saved !</v-chip>
						</template>
					</span>
				</div>
			</v-toolbar-title>
			<template v-slot:append>
				<!-- System Actions -->
				<div class="system-actions">
					<v-btn v-if="page_insertable" prepend-icon="mdi-plus" size="small" variant="elevated"
						@click="goNewRecord">New</v-btn>
					<v-btn v-if="page_editable" :color="form_mode == FORM_MODE.EDIT ? 'orange-darken-4' : ''"
						prepend-icon="mdi-pencil" size="small" variant="elevated" @click="changeMode">Edit</v-btn>
					<v-btn v-if="page_deletable && selected_records.length > 0" @click="dialog_delete_many = true"
						prepend-icon="mdi-trash-can" size="small" color="red" variant="elevated">
						<span>Delete {{ selected_records.length }} Selected</span>
					</v-btn>
					<v-btn v-if="page_exportable" color="primary" size="small" variant="elevated" @click="exportFile">
						<span>Export file</span>
					</v-btn>
				</div>
				<!-- Custom Actions -->
				<div class="custom-actions" v-if="actions.length > 0">
					<template v-for="action in actions">
						<slot :name="'action:' + action.code"></slot>
					</template>
				</div>
			</template>
			<template v-slot:extension>
				<!-- Loading Bar -->
				<v-progress-linear :active="is_loading" color="light-blue" indeterminate rounded></v-progress-linear>
			</template>
		</v-toolbar>
		<!-- Form Messages -->
		<form-message :messages="form_messages" v-model:field_errors="field_errors"></form-message>
		<!-- Table -->
		<div class="table-body">
			<page-list-filter-panel ref="filter_panel" v-show="show_filter" @close-filter="show_filter = false"
				@do-filter="onDoFilter(true)" :added_filters="added_filters" />
			<div class="table-container">
				<template v-if="!is_initializing">
					<div class="vertical-wrapper">
						<table class="real-header">
							<thead>
								<tr>
									<!-- Sticky header fields -->
									<page-list-header-field v-for="(header, index) in headers_sticky" :key="index"
										:header="header" :show_selectbox="show_selectbox"
										:select_multiple="select_multiple"
										@menu-item-selected="onSelectHeaderSubMenuItem"
										:filter="added_filters[header.field.code]" @selected-all="onSelectedAll" />
									<!-- Non-sticky header fields -->
									<page-list-header-field v-for="(header, index) in headers_not_sticky" :key="index"
										:header="header" @menu-item-selected="onSelectHeaderSubMenuItem"
										:filter="added_filters[header.field.code]" />
									<!-- Last Column -->
									<th style="width: 100px; background-color: #ffffff;"></th>
								</tr>
							</thead>
						</table>
						<table class="real-table">
							<page-list-empty-header :show_selectbox="show_selectbox" :headers_sticky="headers_sticky"
								:headers_not_sticky="headers_not_sticky">
							</page-list-empty-header>
							<tbody>
								<!-- List of records -->
								<page-list-record v-for="(record, index) in records" :key="record[primary_field?.code]"
									:record="record" :headers="headers" :show_selectbox="show_selectbox"
									:form_mode="form_mode" :view_path="page_path + VIEW_PATH"
									:insertable="page_insertable" :editable="page_editable" :deletable="page_deletable"
									@menu-item-selected="onSelectRowSubMenuItem" :has_card_page="has_card_page"
									@record-selected="onRecordSelected" @click="onClickRecord(record)"
									@field:change="onChangeField" @field:blur="onBlurField">
									<template v-for="(key, name) in $slots" #[name]="slot_data">
										<div v-if="$slots[name]">
											<slot :name="name" v-bind="slot_data || {}"></slot>
										</div>
									</template>
								</page-list-record>
							</tbody>
						</table>
					</div>
					<page-list-footer v-model:pagination="pagination" v-model:selected_records="selected_records"
						:selected_record_label="selected_record_label" @update:pagination="onDoFilter(false)"
						:show_selected_records="show_selected_records"
						@update:selected_records="onSelectedRecordsChange">
					</page-list-footer>
				</template>
				<template v-else>
					<div>
						<v-skeleton-loader type="table-row, table-row, table-row"></v-skeleton-loader>
					</div>
				</template>
			</div>
		</div>

		<!-- Dialog Delete  -->
		<v-dialog v-model="dialog_delete_one" max-width="500">
			<template v-slot:default="{ isActive }">
				<v-card title="Delete">
					<v-card-text>
						Do you want to delete record ID: {{ selected_delete_record.id }} ?
					</v-card-text>
					<v-card-actions>
						<v-btn variant="tonal" text="Yes" @click="
							isActive.value = false;
						requestDeleteOne();
						"></v-btn>
						<v-spacer></v-spacer>
						<v-btn color="primary" variant="tonal" text="No" @click="isActive.value = false"></v-btn>
					</v-card-actions>
				</v-card>
			</template>
		</v-dialog>

		<!-- Dialog Delete Many  -->
		<v-dialog v-model="dialog_delete_many" max-width="500">
			<template v-slot:default="{ isActive }">
				<v-card title="Delete">
					<v-card-text> Do you want to <strong>DELETE {{ selected_records.length }} </strong> selected records
						? </v-card-text>
					<v-card-actions>
						<v-btn variant="tonal" text="Yes" @click="isActive.value = false; requestDeleteMany();"></v-btn>
						<v-spacer></v-spacer>
						<v-btn color="primary" variant="tonal" text="No" @click="isActive.value = false"></v-btn>
					</v-card-actions>
				</v-card>
			</template>
		</v-dialog>
	</div>
</template>

<script setup>
// Plugins
const { $admin_page } = useNuxtApp();

// Route
const router = useRouter();

// Constants
const CHECKBOX_WIDTH = 50;
const DROPDOWN_MENU_WIDTH = 32;
const FILTER_URL = "/filter";
const UPDATE_URL = "/update";
const DELETE_URL = "/delete";
const DELETE_SELECTED_URL = "/delete-selected";
const VIEW_PATH = "/view";
const EXPORT_URL = "/export";
const SESSION_STORAGE_KEY = "admin:filter";

// Model
const selected_records = defineModel('selected_records', { default: [] });
const form_messages = defineModel('form_messages', { default: [] });
const form_mode = defineModel('form_mode', { default: FORM_MODE.VIEW });
const page_path = defineModel('page_path', { default: "" });
const is_loading = defineModel('is_loading', { default: false });

// Props
const { page_caption, page_class, readable, editable, insertable, deletable, exportable,
	select_mode, select_multiple, selected_record_label, load_selected_records, initial_filters
} = defineProps({
	page_caption: {
		type: String,
		default: '',
	},
	page_class: {
		type: String,
		default: '',
	},
	readable: {
		type: Boolean,
		default: true
	},
	insertable: {
		type: Boolean,
		default: true
	},
	editable: {
		type: Boolean,
		default: true
	},
	deletable: {
		type: Boolean,
		default: true
	},
	exportable: {
		type: Boolean,
		default: true
	},
	select_mode: {
		type: Boolean,
		default: false,
	},
	select_multiple: {
		type: Boolean,
		default: false
	},
	selected_record_label: {
		type: String,
		default: "label"
	},
	show_toolbar: {
		type: Boolean,
		default: true
	},
	show_selected_records: {
		type: Boolean,
		default: true
	},
	load_selected_records: {
		type: Boolean,
		default: false
	},
	has_card_page: {
		type: Boolean,
		default: true
	},
	initial_filters: {
		type: Array,
		default: []
	}
});

// Refs
const layout = ref({});
const controller_url = ref("");
const page_caption_ref = ref("");
const page_insertable = ref(false);
const page_readable = ref(false);
const page_editable = ref(false);
const page_deletable = ref(false);
const page_exportable = ref(false);
const filter_request = ref();

const actions = ref([]);
const is_saved = ref(true);
const is_saving = ref(false);
const headers = ref({});
const records = ref([]);
const headers_sticky = ref([]);
const headers_not_sticky = ref([]);
const added_filters = ref({});
const show_selectbox = ref(false);
const show_filter = ref(false);
const filter_panel = useTemplateRef("filter_panel");
const dialog_delete_one = ref(false);
const dialog_delete_many = ref(false);
const selected_delete_record = ref();
const primary_field = ref();
const field_errors = ref({});
const all_fields = ref({});
const current_edit_record = ref();
const is_initializing = ref(true);

let pagination = reactive(new Pagination());
const saved_expressions = reactive({});

// Emits
const emit = defineEmits([
	"loaded",
	"record:delete", "records:delete", "records:change",
	"update:selected_records", "update:before"
]);

// Expose
defineExpose({
	initRecords,
	onDoFilter,
	loadRecordsByIds
});

// Functions
function onSelectRowSubMenuItem(data) {
	switch (data.id) {
		case PAGE_LIST_DROPDOWN_MENU_ITEM_TYPE.VIEW: // View record
			viewRecord(data);
			break;
		case PAGE_LIST_DROPDOWN_MENU_ITEM_TYPE.EDIT: // Edit record
			editRecord(data);
			break;
		case PAGE_LIST_DROPDOWN_MENU_ITEM_TYPE.DELETE: // Delete record
			dialog_delete_one.value = true;
			const primary_field_code = data?.primary_field?.code;
			selected_delete_record.value = {
				id: data.record[primary_field_code],
				data: data.record,
			};
			break;
		case PAGE_LIST_DROPDOWN_MENU_ITEM_TYPE.SELECT_MORE: // Show More
			selected_records.value.push(data.record);

			showSelectBox(!show_selectbox.value);

			emit("update:selected_records", selected_records.value);
			break;
	}
}

function onSelectHeaderSubMenuItem(header, e) {
	switch (e.id) {
		case PAGE_LIST_HEADER_MENU_ITEM_TYPE.ASC: // Sort Ascending
		case PAGE_LIST_HEADER_MENU_ITEM_TYPE.DESC: // Sort Descending
		case PAGE_LIST_HEADER_MENU_ITEM_TYPE.CLEAR_SORT: // Clear Sort
			onDoFilter();
			break;
		case PAGE_LIST_HEADER_MENU_ITEM_TYPE.CLEAR_ALL_SORTS: // Clear All Sorts
			Object.entries(headers.value).forEach(([key, header]) => {
				header.sort = "";
			});
			onDoFilter();
			break;
		case PAGE_LIST_HEADER_MENU_ITEM_TYPE.FILTER: // Filter
			show_filter.value = true;
			filter_panel.value.addFilter(header);
			break;
		case PAGE_LIST_HEADER_MENU_ITEM_TYPE.CLEAR_FILTER: // Clear Filter
			const filter = {
				field: header.field,
				expression: ""
			};
			filter_panel.value.removeFilter(filter);
			break;
	}
}

function onRecordSelected(primary_field, is_selected, record) {
	if (primary_field) {
		if (!select_multiple) {
			records.value.forEach((record) => {
				record.select_box = false;
			});

			// Delete previous selected records
			for (let i in selected_records.value) {
				selected_records.value.splice(i, 1);
			}
		}

		if (is_selected) {
			// Search if there is existing record
			let has_added = false;
			for (let i in selected_records.value) {
				if (selected_records.value[i][primary_field.code] == primary_field.value) {
					has_added = true;
					break;
				}
			}

			if (!has_added) {
				selected_records.value.push(record);
			}
		} else {
			// Delete from selected_record
			for (let i in selected_records.value) {
				if (selected_records.value[i][primary_field.code] == primary_field.value) {
					selected_records.value.splice(i, 1);
					break;
				}
			}

			if (selected_records.value.length <= 0) {
				showSelectBox(false);
			}
		}

		emit("update:selected_records", selected_records.value);
	}
}

async function viewRecord(data) {
	if (data?.primary_field) {
		await navigateTo(data?.primary_field?.view_url);
	}
}

async function editRecord(data) {
	if (data?.primary_field) {
		await navigateTo(data?.primary_field?.edit_url);
	}
}

function showSelectBox(val) {
	if (select_mode) {
		val = true;
	}

	if (show_selectbox.value == val) {
		return;
	}

	show_selectbox.value = val;
	// Show
	if (show_selectbox.value) {
		headers.value[PAGE_LIST_HEADER_TYPE.SELECT_BOX].width = CHECKBOX_WIDTH;
		Object.entries(headers.value).forEach(([key, value]) => {
			value.left += CHECKBOX_WIDTH;
		});
	} else {
		headers.value[PAGE_LIST_HEADER_TYPE.SELECT_BOX].width = 0;

		Object.entries(headers.value).forEach(([key, value]) => {
			value.left -= CHECKBOX_WIDTH;
		});

		selected_records.value = [];
		// Un-select records
		records.value.forEach((record) => {
			record.select_box = false;
		});

		emit("update:selected_records", selected_records.value);
	}
}

async function onDoFilter(reset_page = false) {
	const sessionKey = SESSION_STORAGE_KEY;
	const currentPage = window.location.pathname;
	const sessionData = JSON.parse(sessionStorage.getItem(sessionKey) || "{}");

	sessionData[currentPage] = {};

	Object.entries(added_filters.value).forEach(([field_code, filter]) => {
		let exprStr = filter.expression;

		switch (filter.field.input_type) {
			case FIELD_INPUT_TYPE.DATE:
				exprStr = Array.isArray(filter.expression) && filter.expression.length === 2
					? `${formatMySQLDate(filter.expression[0])}${STRING_VALUES_SEPERATOR}${formatMySQLDate(filter.expression[1])}`
					: '';
				break;

			case FIELD_INPUT_TYPE.DATE_TIME:
				exprStr = Array.isArray(filter.expression) && filter.expression.length === 2
					? `${formatMySQLDateTime(filter.expression[0])}${STRING_VALUES_SEPERATOR}${formatMySQLDateTime(filter.expression[1])}`
					: '';
				break;

			default:
				exprStr = filter.expression;
		}

		sessionData[currentPage][field_code] = exprStr;
	});

	sessionStorage.setItem(sessionKey, JSON.stringify(sessionData));

	// Make filters: 
	let filters = [];
	// Combine with initial filter request
	if (initial_filters && initial_filters.length > 0) {
		filters = initial_filters;
	}
	
	// Convert added filters to class FilterRequest
	Object.entries(added_filters.value).forEach(function ([key, filter]) {
		let new_filter = { ...filter };

		switch (filter.field.input_type) {
			case FIELD_INPUT_TYPE.BOOL:
				new_filter.expression = Boolean(filter.expression);
				break;
			case FIELD_INPUT_TYPE.DATE:
				if (Array.isArray(filter.expression) && filter.expression.length === 2) {
					const [start, end] = filter.expression;
					const startStr = start ? formatMySQLDate(start) : "";
					const endStr = end ? formatMySQLDate(end) : "";
					new_filter.expression = `${startStr}${STRING_VALUES_SEPERATOR}${endStr}`;
				} else if (filter.expression) {
					new_filter.expression = "";
				}
				break;
			case FIELD_INPUT_TYPE.DATE_TIME:
				if (Array.isArray(filter.expression) && filter.expression.length === 2) {
					const [start, end] = filter.expression;
					const startStr = start ? formatMySQLDateTime(start) : "";
					const endStr = end ? formatMySQLDateTime(end) : "";
					new_filter.expression = `${startStr}${STRING_VALUES_SEPERATOR}${endStr}`;
				} else if (filter.expression) {
					new_filter.expression = "";
				}
				break;
			case FIELD_INPUT_TYPE.MULTI_SELECT:
				let selected_values = filter.expression || [];
				new_filter.expression = selected_values.join(STRING_VALUES_SEPERATOR);
				break;
			default:
				new_filter.expression = String(filter.expression);
		}

		filters.push(new_filter);
	});

	// Make sorts
	const sorts = [];
	Object.entries(headers.value).forEach(function ([key, header]) {
		if (header.sort) {
			sorts.push({
				field_code: header.field.code,
				direction: header.sort
			});
		}
	});

	if (reset_page) {
		// Reset page to 1
		pagination.page = 1;
	}

	filter_request.value = new FilterRequest(pagination, filters, sorts);
	await requestFilter(filter_request.value);

	emit("records:change", records.value);
}

function onSelectedAll(is_selected_all) {
	Object.entries(records.value).forEach(([key, record]) => {
		const id = record[primary_field.value.code];
		if (id) {
			if (is_selected_all) {
				selected_records.value.push(record);
			}

			record[PAGE_LIST_HEADER_TYPE.SELECT_BOX] = is_selected_all;
		}
	});

	if (!is_selected_all) {
		selected_records.value.splice(0);
	}

	if (selected_records.value.length <= 0) {
		showSelectBox(false);
	}

	emit("update:selected_records", selected_records.value);
}

function goNewRecord() {
	if (page_path.value) {
		router.push({ path: page_path.value + VIEW_PATH });
	}
}

function changeMode() {
	if (!page_editable.value) {
		return;
	}

	switch (form_mode.value) {
		case FORM_MODE.VIEW:
			form_mode.value = FORM_MODE.EDIT;
			break;
		default:
			form_mode.value = FORM_MODE.VIEW;
	}

	// Assign to secret variable. Avoid conflict with other record fields
	if (current_edit_record.value) {
		current_edit_record.value._is_editng = false;
	}
}

async function requestDeleteOne() {
	if (!selected_delete_record.value) {
		// no primary id , do nothing
		return;
	}

	is_loading.value = true;
	const response_data = await useApiFetch(
		controller_url.value + DELETE_URL + "/" + selected_delete_record.value.id, {
		method: HTTP_METHOD.DELETE,
	});
	is_loading.value = false;

	if (response_data.result) {
		emit("record:delete", selected_delete_record.value);
	}

	onDoFilter();
}

async function requestDeleteMany() {
	if (selected_records.value.length <= 0) {
		// no primary id , do nothing
		return;
	}

	const deleted_records = [];
	const selected_ids_array = [];
	for (let i in selected_records.value) {
		const s = selected_records.value[i];

		selected_ids_array.push(s[primary_field.value.code]);
		deleted_records.push(s);
	}

	is_loading.value = true;
	const response_data = await useApiFetch(
		controller_url.value + DELETE_SELECTED_URL, {
		method: HTTP_METHOD.DELETE,
		body: {
			field_code: primary_field.value.code,
			values: selected_ids_array
		}
	});
	is_loading.value = false;

	if (response_data.result) {
		selected_records.value.splice(0);

		emit("records:delete", deleted_records);
		emit("update:selected_records", selected_records.value);
		showSelectBox(false);
	}

	onDoFilter(true);
}

async function requestFilter(new_filter_request) {
	if (!new_filter_request) {
		return;
	}
	if (typeof new_filter_request.toArray !== "function") {
		new_filter_request = new FilterRequest(
			new_filter_request.pagination,
			new_filter_request.filters,
			new_filter_request.sorts
		);
	}

	is_loading.value = true;
	const response_data = await useApiFetch(
		controller_url.value + FILTER_URL, {
		method: HTTP_METHOD.POST,
		body: new_filter_request.toArray()
	});

	if (response_data && response_data.result) {
		records.value = response_data.records;
		pagination.fromArray(response_data.pagination);

		// Check selected records
		records.value.forEach((record) => {
			const primary_key_value = record[primary_field.value.code];
			for (let i in selected_records.value) {
				if (selected_records.value[i][primary_field.value.code] == primary_key_value) {
					record.select_box = true;
					break;
				}
			}
		});
	}

	form_messages.value = response_data.messages;
	is_loading.value = false;
}

async function exportFile() {
	if (!filter_request.value) {
		return;
	}

	is_loading.value = true;
	try {
		const response_data = await useApiFetch(
			controller_url.value + EXPORT_URL, {
			method: HTTP_METHOD.POST,
			body: filter_request.value.toArray()
		});
		form_messages.value = response_data.messages;

		if (response_data?.result && response_data?.file_export && typeof window !== 'undefined') {
			window.location.href = response_data.file_export;
		}
	} finally {
		is_loading.value = false;
	}
}

async function requestLayout() {
	const response_data = await $admin_page.getLayout(page_class);
	if (response_data.result) {
		layout.value = response_data.layout;
		page_path.value = layout.value.path;

		page_insertable.value = layout.value.insertable;
		if (!insertable) {
			page_insertable.value = false;
		}

		page_readable.value = layout.value.readable;
		if (!readable) {
			page_readable.value = false;
		}

		page_editable.value = layout.value.editable;
		if (!editable) {
			page_editable.value = false;
		}

		page_deletable.value = layout.value.deletable;
		if (!deletable) {
			page_deletable.value = false;
		}

		page_exportable.value = layout.value.exportable;
		if (!exportable) {
			page_exportable.value = false;
		}

		controller_url.value = layout.value.controller;
		actions.value = layout.value.actions;
		headers.value = layout.value.headers;
		filter_panel.value.init(headers);

		if (!page_caption) {
			page_caption_ref.value = layout.value.caption;
		} else {
			page_caption_ref.value = page_caption;
		}
	}

	return response_data.result;
}

function onSelectedRecordsChange() {
	// Update records select box
	records.value.forEach((record) => {
		record.select_box = false;

		for (let i in selected_records.value) {
			if (selected_records.value[i][primary_field.value.code] == record[primary_field.value.code]) {
				record.select_box = true;
			}
		}
	});

	emit("update:selected_records", selected_records.value);
}

function onClickRecord(record) {
	if (form_mode.value != FORM_MODE.EDIT) {
		return;
	}

	if (current_edit_record.value) {
		// Assign to secret variable. Avoid conflict with other record fields
		current_edit_record.value._is_editng = false;
	}

	current_edit_record.value = record;
	current_edit_record.value._is_editng = true;
}

function onChangeField(field, record) {
	is_saved.value = false;
}

function onBlurField(field, record) {
	if (!field.code) {
		return;
	}

	record[field.code] = field.value;
	requestUpdate(record);
}

async function requestUpdate(record) {
	if (!primary_field.value) {
		// no primary field , do nothing
		return false;
	}

	const primary_id = record[primary_field.value.code];
	if (!primary_id) {
		return false;
	}

	// Run event before update
	emit("update:before");

	// Update
	is_saving.value = true;
	is_loading.value = true;
	const response_data = await useApiFetch(
		controller_url.value + UPDATE_URL + "/" + primary_id, {
		method: HTTP_METHOD.PUT,
		body: record
	});
	if (!response_data.result) {
		// TODO: Process false result
	}

	form_messages.value = response_data.messages;

	await onDoFilter();
	is_saving.value = false;
	is_saved.value = true;
	is_loading.value = false;

	return true;
}

async function loadRecordsByIds(record_ids) {
	if (!record_ids) {
		return;
	}

	const filter_expression = record_ids.join(STRING_VALUES_SEPERATOR);
	let load_filter_request = new FilterRequest();
	load_filter_request.pagination.size = -1;
	load_filter_request.filters = [{
		field: {
			code: primary_field.value.code
		},
		expression: filter_expression
	}];

	is_loading.value = true;
	const response_data = await useApiFetch(
		controller_url.value + FILTER_URL, {
		method: HTTP_METHOD.POST,
		body: load_filter_request.toArray()
	});
	is_loading.value = false;

	if (response_data.result) {
		return response_data.records || [];
	}

	return [];
}

function initRecords() {
	const sessionKey = SESSION_STORAGE_KEY;
	const sessionData = JSON.parse(sessionStorage.getItem(sessionKey) || "{}");

	Object.entries(sessionData).forEach(([page, filterObj]) => {
		if (!filterObj || Object.keys(filterObj).length === 0) {
			delete sessionData[page];
		}
	});
	sessionStorage.setItem(sessionKey, JSON.stringify(sessionData));

	const currentPage = window.location.pathname;
	const savedFilter = sessionData[currentPage];

	if (!savedFilter) {
		onDoFilter();
		return;
	}

	added_filters.value = {};

	Object.entries(savedFilter).forEach(([field_code, expression]) => {
		const fieldInfo = all_fields.value[field_code];
		if (!fieldInfo) return;

		switch (fieldInfo.input_type) {
			case FIELD_INPUT_TYPE.DATE:
				if (typeof expression === 'string') {
					const parts = expression.split(STRING_VALUES_SEPERATOR);
					expression = parts.map(p => new Date(p + 'T00:00:00'));
				}
				break;

			case FIELD_INPUT_TYPE.DATE_TIME:
				if (typeof expression === 'string') {
					const parts = expression.split(STRING_VALUES_SEPERATOR);
					expression = parts.map(p => new Date(p));
				}
				break;
		}

		added_filters.value[field_code] = {
			field: fieldInfo,
			expression
		};
		saved_expressions[field_code] = expression;
	});

	if (Object.keys(added_filters.value).length > 0) {
		show_filter.value = true;
	}

	const filters = Object.values(added_filters.value).map(filter => {
		let exprStr = filter.expression;

		switch (filter.field.input_type) {
			case FIELD_INPUT_TYPE.DATE:
				if (Array.isArray(filter.expression) && filter.expression.length === 2) {
					exprStr = `${formatMySQLDate(filter.expression[0])}${STRING_VALUES_SEPERATOR}${formatMySQLDate(filter.expression[1])}`;
				} else {
					exprStr = '';
				}
				break;

			case FIELD_INPUT_TYPE.DATE_TIME:
				if (Array.isArray(filter.expression) && filter.expression.length === 2) {
					exprStr = `${formatMySQLDateTime(filter.expression[0])}${STRING_VALUES_SEPERATOR}${formatMySQLDateTime(filter.expression[1])}`;
				} else {
					exprStr = '';
				}
				break;

			default:
				exprStr = filter.expression;
		}

		return {
			...filter,
			expression: exprStr
		};
	});

	filter_request.value = {
		filters,
		sorts: [],
		pagination: { page: 1, size: 50 }
	};

	requestFilter(filter_request.value);
}


async function init() {
	is_initializing.value = true;
	const layout_result = await requestLayout();
	if (!layout_result) {
		// If failed to get page layout navigate to home page
		navigateTo("/");
		return;
	}

	// Initialize headers
	headers.value[PAGE_LIST_HEADER_TYPE.SELECT_BOX] = {
		field: {
			code: PAGE_LIST_HEADER_TYPE.SELECT_BOX,
			caption: "",
		},
		width: CHECKBOX_WIDTH,
		is_sticky: true,
		is_checkbox: true,
	};

	headers.value[PAGE_LIST_HEADER_TYPE.DROPDOWN_MENU] = {
		field: {
			code: PAGE_LIST_HEADER_TYPE.DROPDOWN_MENU,
			caption: "",
		},
		width: DROPDOWN_MENU_WIDTH,
		is_sticky: true,
		is_dropdown: true,
	};

	headers_sticky.value.push(headers.value[PAGE_LIST_HEADER_TYPE.SELECT_BOX]);

	// Split to sticky and not-sticky headers
	let sticky_header_left = 0; // First column is check box. Hide it intially.
	Object.entries(headers.value).forEach(([key, value]) => {
		// Find primary field
		if (value.field.is_primary) {
			primary_field.value = value.field;
		}

		// Assign new fields to header
		if (value.is_dropdown) {
			value.left = sticky_header_left;
			sticky_header_left += DROPDOWN_MENU_WIDTH;
		}

		if (!value.is_dropdown && !value.is_checkbox) {
			if (value.is_sticky) {
				value.left = sticky_header_left;
				headers_sticky.value.push(value);

				sticky_header_left += value.width ? value.width : 0;
			} else {
				headers_not_sticky.value.push(value);
			}
		}

		// Add to all_fields
		if (!value.field.is_auto_generated) {
			all_fields.value[value.field.code] = value.field;
		}
	});

	headers_sticky.value.push(headers.value[PAGE_LIST_HEADER_TYPE.DROPDOWN_MENU]);

	// Show/Close Select Box
	if (select_mode) {
		showSelectBox(true);
	} else {
		showSelectBox(false);
	}

	if (!load_selected_records) {
		initRecords();
	}

	emit("loaded");
	is_initializing.value = false;
}

watch(added_filters, (val) => {
	const sessionKey = SESSION_STORAGE_KEY;
	const currentPage = window.location.pathname;
	const sessionData = JSON.parse(sessionStorage.getItem(sessionKey) || "{}");

	sessionData[currentPage] = {};

	Object.entries(val).forEach(([field_code, filter]) => {
		let expr = filter.expression;

		if (filter.field.input_type === FIELD_INPUT_TYPE.DATE) {
			if (Array.isArray(expr)) {
				expr = `${formatMySQLDate(expr[0])}|${formatMySQLDate(expr[1])}`;
			}
		}

		if (filter.field.input_type === FIELD_INPUT_TYPE.DATE_TIME) {
			if (Array.isArray(expr)) {
				expr = `${formatMySQLDateTime(expr[0])}|${formatMySQLDateTime(expr[1])}`;
			}
		}

		sessionData[currentPage][field_code] = expr;
	});

	sessionStorage.setItem(sessionKey, JSON.stringify(sessionData));
}, { deep: true });

onMounted(init);

</script>

<style scoped lang="less">
.la-page-list {
	display: flex;
	flex-direction: column;
	height: 100%;
	background-color: #fff;
	border: 1px solid var(--la_primary_color_silver_1);
	border-radius: 8px;
	overflow: hidden;
	box-shadow: 0px 2px 2px 1px #c3c3c3;

	.v-toolbar {
		background-color: var(--la_primary_color_silver_1);
	}

	.page-caption {
		display: flex;
		gap: 16px;
		align-items: center;
	}

	.system-actions {
		display: flex;
		gap: 8px;
		padding: 8px;
	}

	.custom-actions {
		display: flex;
		gap: 4px;
		padding: 8px;
		border-left: 1px solid var(--la_primary_color_silver_3);
		padding-left: 16px;
	}

	.table-body {
		display: flex;
	}

	.table-container {
		display: grid;
		grid-template-rows: 1fr auto;
		width: 100%;
		max-height: calc(100vh - 160px);
	}

	.vertical-wrapper {
		position: relative;
		overflow: scroll;
		white-space: nowrap;
	}

	table {
		border-collapse: collapse;
		border: 0;
		border-spacing: 0;
		table-layout: fixed;
		padding: 8px;
		width: 100%;
	}

	table.real-header {
		position: sticky;
		top: 0;
		z-index: 200;
		box-shadow: 0px 6px 4px -4px #ccc;
		background-color: #fff;
	}

	table.real-table {
		margin-top: -40px;
	}

}
</style>
