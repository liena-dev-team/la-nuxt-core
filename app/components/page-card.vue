<template>
	<div class="la-page-card">
		<v-sheet :elevation="0">
			<!-- Sticky ToolBar -->
			<v-banner class="sticky-bar" :sticky="true">
				<v-toolbar density="compact" :extension-height="8" extended>
					<v-toolbar-title>
						<div class="page-caption">
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
							<nuxt-link v-if="go_back" :to="page_path" custom #="{ navigate }">
								<v-btn @click="navigate" prepend-icon="mdi-arrow-left" size="small"
									variant="elevated">Back</v-btn>
							</nuxt-link>
							<v-btn v-if="page_insertable" prepend-icon="mdi-plus" size="small" variant="elevated"
								@click="resetForm">New</v-btn>
							<v-btn v-if="page_editable" :color="form_mode == FORM_MODE.EDIT ? 'orange-darken-4' : ''"
								prepend-icon="mdi-pencil" size="small" variant="elevated"
								@click="changeMode">Edit</v-btn>
							<span class="manual-save">
								<v-btn v-if="page_editable && primary_id" color="primary" :loading="is_loading"
									:disabled="form_mode == FORM_MODE.VIEW" ref="btn_save"
									prepend-icon="mdi-content-save" size="small" variant="elevated"
									@click="requestUpdate">Save</v-btn>
								<v-btn v-if="page_insertable && !primary_id" color="primary" :loading="is_loading"
									:disabled="form_mode == FORM_MODE.VIEW" ref="btn_save"
									prepend-icon="mdi-content-save" size="small" variant="elevated"
									@click="requestCreate">Save</v-btn>
							</span>
							<v-btn v-if="page_deletable && primary_id" prepend-icon="mdi-delete" size="small"
								color="error" variant="elevated" @click="dialog_delete_record = true">
								Delete
							</v-btn>
						</div>
						<!-- Custom Actions -->
						<div class="custom-actions" v-if="actions.length > 0">
							<!-- <slot name="actions"></slot> -->
							<template v-for="action in actions">
								<slot :name="'action:' + action.code"></slot>
							</template>
						</div>
					</template>
					<template v-slot:extension>
						<!-- Loading Bar -->
						<v-progress-linear :active="is_loading" color="light-blue" indeterminate
							rounded></v-progress-linear>
					</template>
				</v-toolbar>
			</v-banner>
			<!-- Form -->
			<v-container fluid>
				<div class="form-caption text-h5">
					<span>{{ form_caption }}</span>
				</div>
				<v-form @submit.prevent :readonly="form_mode == FORM_MODE.VIEW" v-if="record">
					<form-message :messages="form_messages" v-model:field_errors="field_errors"
						:fields="all_fields"></form-message>
					<!-- Group Sections -->
					<v-expansion-panels class="groups" :modelValue="expansion_mode" :elevation="0" eager multiple>
						<v-expansion-panel class="group" v-for="section in display_sections" :key="section.code">
							<template v-if="section.is_visible">
								<v-expansion-panel-title class="group-caption">
									<strong>{{ section.caption }}</strong>
								</v-expansion-panel-title>
								<v-divider></v-divider>
								<v-expansion-panel-text>
									<v-container v-if="section.type == CARD_SECTION_TYPE.GROUP"
										:class="'group-body ' + section.code" class="pa-0" fluid>
										<v-row class="fields align-center" no-gutters>
											<template v-for="field in (section.fields || [])">
												<template v-if="field.is_visible">
													<!-- Label -->
													<v-col :md="field.label_width" :sm="12" :cols="12"
														class="col-label pa-2" :class="field.code">
														<div class="caption">
															<span class="label"> {{ field.caption }}</span>
															<span class="dots"></span>
														</div>
													</v-col>
													<!-- Control -->
													<v-col :md="field.control_width" :sm="12" :cols="12"
														class="col-field pa-2" :class="field.code">
														<div class="control"
															:class="{ 'read-only': (form_mode == FORM_MODE.VIEW || !field.editable) }">
															<template v-if="$slots['field:' + field.code]">
																<slot :name="'field:' + field.code" :field="field"
																	:calculateFieldVariant="calculateFieldVariant"
																	:field_errors="field_errors"
																	:saveFieldValue="saveFieldValue"
																	:getFieldByCode="getFieldByCode">
																</slot>
															</template>
															<template v-else>
																<div :class="field.input_type"
																	v-if="field.input_type == FIELD_INPUT_TYPE.STRING">
																	<!-- String -->
																	<v-text-field v-model="record[field.code]"
																		density="compact" autocomplete="off"
																		:variant="calculateFieldVariant(field)"
																		hide-details="auto" :disabled="!field.editable"
																		@update:model-value="onValueChange(field)"
																		@blur="saveFieldValue(field)"
																		:error="!!field_errors[field.code]"
																		:error-messages="field_errors[field.code]">
																	</v-text-field>
																</div>
																<div :class="field.input_type"
																	v-if="field.input_type == FIELD_INPUT_TYPE.INT">
																	<!-- Int -->
																	<v-text-field v-model="record[field.code]"
																		type="number" density="compact" autocomplete="off"
																		:variant="calculateFieldVariant(field)"
																		hide-details="auto" :disabled="!field.editable"
																		@update:model-value="onValueChange(field)"
																		@blur="saveFieldValue(field)"
																		:error="!!field_errors[field.code]"
																		:error-messages="field_errors[field.code]">
																	</v-text-field>
																</div>
																<div :class="field.input_type"
																	v-if="field.input_type == FIELD_INPUT_TYPE.DECIMAL">
																	<!-- Decimal -->
																	<v-text-field v-model="record[field.code]"
																		type="number" density="compact" autocomplete="off"
																		:variant="calculateFieldVariant(field)"
																		hide-details="auto" :disabled="!field.editable"
																		@update:model-value="onValueChange(field)"
																		@blur="saveFieldValue(field)"
																		:error="!!field_errors[field.code]"
																		:error-messages="field_errors[field.code]">
																	</v-text-field>
																</div>
																<div :class="field.input_type"
																	v-if="field.input_type == FIELD_INPUT_TYPE.BOOL">
																	<!-- Boolean -->
																	<v-checkbox v-model="record[field.code]"
																		density="compact"
																		:variant="calculateFieldVariant(field)"
																		hide-details="auto" :disabled="!field.editable"
																		@update:model-value="saveFieldValue(field)"
																		:error="!!field_errors[field.code]"
																		:error-messages="field_errors[field.code]">
																	</v-checkbox>
																</div>
																<div :class="field.input_type"
																	v-if="field.input_type == FIELD_INPUT_TYPE.DATE">
																	<!-- Date -->
																	<vue-date-picker v-model="record[field.code]"
																		:text-input="{
																			format: 'd/M/yyyy'
																		}" :teleport="true" format="d/M/yyyy" :disabled="!field.editable"
																		@update:model-value="saveFieldValue(field)" />
																</div>
																<div :class="field.input_type"
																	v-if="field.input_type == FIELD_INPUT_TYPE.DATE_TIME">
																	<!-- Date Time -->
																	<vue-date-picker v-model="record[field.code]"
																		:text-input="{
																			format: 'd/M/yyyy HH:mm'
																		}" :teleport="true" format="d/M/yyyy HH:mm" :disabled="!field.editable"
																		:start-time="{ hours: 0, minutes: 0 }"
																		time-picker-inline
																		@update:model-value="saveFieldValue(field)" />
																</div>
																<div :class="field.input_type"
																	v-if="field.input_type == FIELD_INPUT_TYPE.SELECT">
																	<!-- Select -->
																	<v-autocomplete v-model="record[field.code]"
																		:items="Object.values(field.options)"
																		density="compact" autocomplete="off"
																		:variant="calculateFieldVariant(field)"
																		hide-details="auto" :disabled="!field.editable"
																		@update:model-value="saveFieldValue(field)"
																		:error="!!field_errors[field.code]"
																		:error-messages="field_errors[field.code]">
																	</v-autocomplete>
																</div>
																<div :class="field.input_type"
																	v-if="field.input_type == FIELD_INPUT_TYPE.MULTI_SELECT">
																	<!-- Multi Select -->
																	<v-autocomplete v-model="record[field.code]"
																		multiple :items="Object.values(field.options)"
																		density="compact"  autocomplete="off" clearable
																		:variant="calculateFieldVariant(field)"
																		hide-details="auto" :disabled="!field.editable"
																		@update:model-value="saveFieldValue(field)"
																		:error="!!field_errors[field.code]"
																		:error-messages="field_errors[field.code]">
																	</v-autocomplete>
																</div>
																<div :class="field.input_type"
																	v-if="field.input_type == FIELD_INPUT_TYPE.TREE">
																	<!-- Tree -->
																	<field-tree :ref_id="field.code" :field="field"
																		:record="record" :mode="form_mode"
																		v-model:selected_ids_str="record[field.code]"
																		@tree:open="onDislayAdvTreeDialog"
																		@update:selected_nodes="onSelectedNodesChange">
																	</field-tree>
																</div>
																<div :class="field.input_type"
																	v-if="field.input_type == FIELD_INPUT_TYPE.TEXT_AREA">
																	<!-- Text Area -->
																	<v-textarea v-model="record[field.code]"
																		density="compact"
																		:variant="calculateFieldVariant(field)"
																		@update:model-value="onValueChange(field)"
																		@blur="saveFieldValue(field)">
																	</v-textarea>
																</div>
																<div :class="field.input_type"
																	v-if="field.input_type == FIELD_INPUT_TYPE.RICH_EDITOR">
																	<!-- Rich Editor -->
																	<!-- <field-tiptap-editor v-model="record[field.code]"
																		@update:model-value="onValueChange(field)"
																		@blur="saveFieldValue(field)" /> -->
																	<client-only>
																		<field-rich-editor ref="ref_rich_editor"
																			:ref_id="field.code"
																			v-model="record[field.code]" :field="field"
																			:form_mode="form_mode"
																			@update:model-value="onValueChange(field)"
																			@blur="saveFieldValue(field)" />
																	</client-only>
																</div>
																<div :class="field.input_type"
																	v-if="field.input_type == FIELD_INPUT_TYPE.CODE_EDITOR">
																	<field-code-editor v-model="record[field.code]"
																		:field="field" :form_mode="form_mode"
																		@update:model-value="onValueChange(field)"
																		@blur="saveFieldValue(field)" />
																</div>
																<div :class="field.input_type"
																	v-if="field.input_type == FIELD_INPUT_TYPE.MEDIA_FILE">
																	<!-- Media File -->
																	<client-only>
																		<field-media-file :mode="form_mode"
																			:field="field" :record="record"
																			v-model:files="record[field.code]"
																			@items:change="onChangeMediaFile" />
																	</client-only>
																</div>
																<div :class="field.input_type"
																	v-if="field.input_type == FIELD_INPUT_TYPE.UPLOAD_FILE">
																	<!-- Upload File -->
																	<client-only>
																		<!-- <field-upload-file :mode="form_mode" :field="field"
																		:record="record"
																		@uploaded="onUploadedFile"/> -->
																	</client-only>
																</div>
																<div :class="field.input_type"
																	v-if="field.input_type == FIELD_INPUT_TYPE.ENCRYPTED">
																	<!-- Encrypted -->
																	<v-text-field v-model="record[field.code]"
																		density="compact" autocomplete="off"
																		:variant="calculateFieldVariant(field)"
																		:hide-details="(form_mode == FORM_MODE.VIEW) || !!!field_errors[field.code]"
																		:disabled="!field.editable"
																		@blur="saveFieldValue(field)"
																		:error="!!field_errors[field.code]"
																		:error-messages="field_errors[field.code]"
																		:append-icon="field.show ? 'mdi-eye' : 'mdi-eye-off'"
																		:type="field.show ? 'text' : 'password'" counter
																		@click:append="field.show = !field.show">
																	</v-text-field>
																</div>
																<div :class="field.input_type"
																	v-if="field.input_type == FIELD_INPUT_TYPE.ENCRYPTED_PHONE">
																	<field-encrypt-phone
																		:key="'encrypt-phone-' + field.code + '-' + record_refresh_key"
																		:field="field"
																		:model_value="record[field.code]"
																		@update:model_value="(val) => { record[field.code] = val; onValueChange(field); }"
																		:variant="calculateFieldVariant(field)"
																		:hide_details="(form_mode == FORM_MODE.VIEW) || !!!field_errors[field.code]"
																		:disabled="!field.editable"
																		:error="!!field_errors[field.code]"
																		:error_messages="field_errors[field.code]"
																		@blur="saveFieldValue(field)">
																	</field-encrypt-phone>
																</div>
																<div :class="field.input_type"
																	v-if="field.input_type == FIELD_INPUT_TYPE.LOOKUP && field.field_lookup">
																	<!-- Lookup -->
																	<field-lookup :mode="form_mode" :field="field"
																		v-model:selected_records="record[field.code]"
																		:record="record" @done="onFieldLookupDone">
																	</field-lookup>
																</div>
																<div :class="field.input_type"
																	v-if="field.input_type == FIELD_INPUT_TYPE.RATING_STAR">
																	<!-- Rating Star -->
																	<field-rating-star :modelValue="record"
																		:field="field"
																		:mode="(form_mode == FORM_MODE.VIEW || !field.editable) ? 'view' : 'rating'"
																		:max="field.max || 5" @update:model-value="val => {
																			record[field.code] = val[field.code];
																			saveFieldValue(field);
																		}" />
																</div>
																<div :class="field.input_type"
																	v-if="field.input_type == FIELD_INPUT_TYPE.TAG">
																	<!-- Tag -->
																	<field-tag :mode="form_mode"
																		:keywords="record[field.code]"
																		@update:model-value="saveInputTagFieldValue($event, field)">
																	</field-tag>
																</div>
															</template>
														</div>
													</v-col>
												</template>
											</template>
										</v-row>
									</v-container>
									<v-container v-if="section.type == CARD_SECTION_TYPE.PART"
										:class="'part-body ' + section.part" class="pa-0" fluid>
										<slot :name="'part:' + section.code"></slot>
									</v-container>
								</v-expansion-panel-text>
							</template>
						</v-expansion-panel>
					</v-expansion-panels>
				</v-form>
			</v-container>
		</v-sheet>

		<!-- Dialog Delete  -->
		<v-dialog v-model="dialog_delete_record" max-width="500">
			<v-card title="Delete">
				<v-card-text>
					Do you want to delete record {{ primary_id }} ?
				</v-card-text>
				<v-card-actions>
					<v-btn variant="tonal" text="Yes" @click="requestDelete()"></v-btn>
					<v-spacer></v-spacer>
					<v-btn color="primary" variant="tonal" text="No" @click="dialog_delete_record = false"></v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<!-- Dialog Error - No Record  -->
		<v-dialog v-model="dialog_no_record" max-width="500">
			<v-card title="Error">
				<v-card-text>Record is not found !</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn color="primary" variant="tonal" text="Ok" @click="router.back()"></v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script setup>

// Plugins
const { $admin_page } = useNuxtApp();

// Constants
const CREATE_URL = "/create";
const READ_URL = "/read";
const UPDATE_URL = "/update";
const DELETE_URL = "/delete";

// Route
const route = useRoute();
const router = useRouter();

// Props
const {
	page_caption, page_class, readable, editable, insertable,
	deletable, go_back, auto_save, expand_all
} = defineProps({
	page_caption: {
		type: String,
		default: ''
	},
	page_class: {
		type: String,
		default: ''
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
	go_back: {
		type: Boolean,
		default: false
	},
	auto_save: {
		type: Boolean,
		default: true
	},
	expand_all: {
		type: Boolean,
		default: true
	}
});

// Model
const record = defineModel('record', { default: {} });
const form_messages = defineModel('form_messages', { default: [] });
const form_mode = defineModel('form_mode', { default: FORM_MODE.VIEW });
const page_path = defineModel('page_path', { default: "" });
const is_saved = defineModel('is_saved', { default: true });

// Emits
const emit = defineEmits([
	"record:reset", "record:created", "record:changed", "record:deleted",
	"field:changed", "field:tree:display", "create:before", "update:before", "update:record"
]);

// Expose
defineExpose({
	loadById,
	resetForm,
	setRecord,
	requestUpdate,
	requestRead,
	getFieldByCode,
	getSectionByCode,
	saveFieldValue
});

// Template Ref
const ref_rich_editor = useTemplateRef("ref_rich_editor");

// Refs
const layout = ref({});
const controller_url = ref("");
const page_caption_ref = ref("");
const page_insertable = ref(false);
const page_readable = ref(false);
const page_editable = ref(false);
const page_deletable = ref(false);
const caption_fields = ref([]); // list of fields to display in captions
const primary_id = ref(); // Primary Id value
const x_record = ref({
	// Old value of record
	...record.value,
});

const form_caption = ref("");
const actions = ref([]);
const dialog_no_record = ref(false);
const dialog_delete_record = ref(false);
const is_saving = ref(false);
const is_loading = ref(false);
const display_sections = ref([]);
const primary_field = ref();
const field_errors = ref({});
const all_fields = ref({});
const expansion_mode = ref(0);
const record_refresh_key = ref(0);

const rules = {
	required: value => !!value || 'Required.',
	min: v => v.length >= 8 || 'Min 8 characters'
};

// Functions
function calculateFieldVariant(field) {
	if (!field.editable) {
		return "plain";
	}

	switch (form_mode.value) {
		case FORM_MODE.EDIT:
			return "outlined";
		default:
			return "plain";
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
}

function setRecord(new_value) {
	// If same values, do nothing
	if (JSON.stringify(new_value) !== JSON.stringify(record.value)) {
		const old_value = record.value;
		if (Object.keys(new_value).length === 0) {
			for (let key in record.value) {
				delete record.value[key];
			}
		} else {
			Object.assign(record.value, old_value, new_value);
		}

		// x_record is a copy of record, to save old values
		x_record.value = {
			...record.value,
		};

		record_refresh_key.value++;
		emit("update:record", record.value);
		emit("record:changed", new_value, old_value);
	}

	Object.entries(display_sections.value).forEach(([key_section, section]) => {
		Object.entries(section.fields).forEach(([key_field, field]) => {
			switch (field.input_type) {
				case FIELD_INPUT_TYPE.STRING:
					record.value[field.code] = record.value[field.code] || field.default;
					record.value[field.code] = String(record.value[field.code]);
					break;
				case FIELD_INPUT_TYPE.INT:
					record.value[field.code] = record.value[field.code] != null ? record.value[field.code] : field.default;
					record.value[field.code] = isNaN(record.value[field.code]) ? 0 : parseInt(record.value[field.code]);
					break;
				case FIELD_INPUT_TYPE.DECIMAL:
					record.value[field.code] = record.value[field.code] != null ? record.value[field.code] : field.default;
					record.value[field.code] = isNaN(record.value[field.code]) ? 0 : parseFloat(record.value[field.code]);
					break;
				case FIELD_INPUT_TYPE.BOOL:
					record.value[field.code] = record.value[field.code] != null ? record.value[field.code] : field.default;
					record.value[field.code] = Boolean(record.value[field.code]);
					break;
				case FIELD_INPUT_TYPE.SELECT:
					record.value[field.code] = record.value[field.code] ? record.value[field.code] : field.default;
					break;
				case FIELD_INPUT_TYPE.MULTI_SELECT:
					let value_array = field.default ?? [];
					if (record.value[field.code]) {
						value_array = record.value[field.code].split(STRING_VALUES_SEPERATOR);
					}

					record.value[field.code] = value_array;
					break;
				case FIELD_INPUT_TYPE.DATE:
					if (record.value[field.code]) {
						// Convert "2025-03-25T00:00:00+00:00" to "2025-03-25"
						const dateValue = record.value[field.code];
						record.value[field.code] = dateValue.split("T")[0];
					}
					break;
				case FIELD_INPUT_TYPE.RICH_EDITOR:
					record.value[field.code] = record.value[field.code] || field.default;
					const found_ref_editor = filterTemplateById(ref_rich_editor, field.code);
					if (found_ref_editor) {
						found_ref_editor.setContent(record.value[field.code]);
					}
					break;
				case FIELD_INPUT_TYPE.LOOKUP:
					record.value[field.code] = record.value[field.code] || [];
					break;
			}

			emit("field:changed", field, record.value[field.code]);
		});
	});
}

async function loadById(new_id) {
	primary_id.value = new_id;
	form_messages.value = [];

	window.history.pushState(
		{}, "",
		route.path + "?" + primary_field.value.code + "=" + primary_id.value + `&mode=${form_mode.value}`
	);

	return await requestRead();
}

function getFieldByCode(code) {
	for (let i in display_sections.value) {
		const section = display_sections.value[i];
		for (let j in section.fields) {
			const field = section.fields[j];
			if (field.code == code) {
				return field;
			}
		}
	}
}

function getSectionByCode(code) {
	for (let i in display_sections.value) {
		const section = display_sections.value[i];
		if (section.code == code) {
			return section;
		}
	}
}

async function onValueChange(field) {
	is_saved.value = false;
}

async function saveFieldValue(field) {
	if (form_mode.value == FORM_MODE.VIEW) {
		return;
	}

	// Transform input data
	switch (field.input_type) {
		case FIELD_INPUT_TYPE.DATE_TIME:
			if (record.value[field.code]) {
				const mysql_datetime = formatMySQLDateTime(record.value[field.code]);
				record.value[field.code] = mysql_datetime;
			}
			break;
	}

	// Compare new vs old value
	const current_value = record.value[field.code];
	const old_value = x_record.value[field.code];

	if (JSON.stringify(old_value) === JSON.stringify(current_value)) {
		is_saved.value = true;
		return;
	}

	// Keep a copy of new value
	x_record.value[field.code] = current_value;

	// Save
	if (auto_save) {
		if (primary_id.value) {
			await requestUpdate();
		} else {
			await requestCreate();
		}
	} else {
		is_saved.value = false;
	}

	emit("field:changed", field, current_value);
}

function transformRecordBeforeSave() {
	// Transform data before save
	const record_to_save = { ...record.value };
	Object.entries(display_sections.value).forEach(([key_section, section]) => {
		Object.entries(section.fields).forEach(([key_field, field]) => {
			switch (field.input_type) {
				case FIELD_INPUT_TYPE.MULTI_SELECT:
					if (record_to_save[field.code] && record_to_save[field.code].length > 0) {
						record_to_save[field.code] = record_to_save[field.code].filter((val) => {
							return val ? true : false;
						});

						record_to_save[field.code] = record_to_save[field.code].join(STRING_VALUES_SEPERATOR);
					} else {
						record_to_save[field.code] = "";
					}
					break;
			}
		});
	});

	return record_to_save;
}

async function requestCreate() {
	// If it's not readable, do nothing
	if (!page_insertable.value) {
		return false;
	}

	// Run event before create
	emit("create:before");

	// Transform data before save
	const record_to_save = transformRecordBeforeSave();

	is_loading.value = true;
	const response_data = await useApiFetch(
		controller_url.value + CREATE_URL, {
		method: HTTP_METHOD.POST,
		body: record_to_save
	});

	if (response_data.result) {
		const id = response_data.id;
		primary_id.value = id;

		emit("record:created", id, response_data.record);

		window.history.pushState(
			{}, "",
			route.path + "?" + primary_field.value.code + "=" + id + `&mode=${form_mode.value}`
		);
	}

	is_loading.value = false;
	// Get record again
	requestRead();
	form_messages.value = response_data.messages;

	updateFormCaption();
}

async function requestRead() {
	if (!primary_id.value) {
		// no primary id , do nothing
		return false;
	}

	// If it's not readable, do nothing
	if (!page_readable.value) {
		return false;
	}

	is_loading.value = true;
	const response_data = await useApiFetch(
		controller_url.value + READ_URL + "/" + primary_id.value, {
		method: HTTP_METHOD.GET,
	});

	if (response_data.result) {
		setRecord(response_data.record);
	} else {
		resetForm();
	}

	updateFormCaption();
	is_saving.value = false;
	is_saved.value = true;
	is_loading.value = false;

	return response_data.result;
}

async function requestUpdate() {
	// No primary id , do nothing
	if (!primary_id.value) {
		return false;
	}

	// If it's not editable, do nothing
	if (!page_editable.value) {
		return false;
	}

	// Run event before update
	emit("update:before");

	// Transform data before save
	const record_to_save = transformRecordBeforeSave();

	// Update
	is_saving.value = true;
	is_loading.value = true;
	const response_data = await useApiFetch(
		controller_url.value + UPDATE_URL + "/" + primary_id.value, {
		method: HTTP_METHOD.PUT,
		body: record_to_save
	});

	if (!response_data.result) {
		// TODO: Process false result
	}

	form_messages.value = response_data.messages;

	await requestRead();
	is_saving.value = false;
	is_saved.value = true;
	is_loading.value = false;

	return true;
}

async function requestDelete() {
	if (!primary_id.value) {
		// no primary id , do nothing
		return;
	}

	// If it's not deletable, do nothing
	if (!page_deletable.value) {
		return false;
	}

	const response_data = await useApiFetch(
		controller_url.value + DELETE_URL + "/" + primary_id.value, {
		method: HTTP_METHOD.DELETE,
	});

	form_messages.value = response_data.messages;

	if (response_data.result) {
		emit("record:deleted", primary_id.value);
		goBack();
	}

	dialog_delete_record.value = false;
}

function resetForm() {
	primary_id.value = null;
	setRecord({});
	form_mode.value = FORM_MODE.VIEW;

	updateFormCaption();

	emit("record:reset");
}

function goBack() {
	if (go_back) {
		window.location = page_path.value;
	}
}

function updateFormCaption() {
	let caption = "";
	// Begin with primary id
	if (primary_id.value) {
		caption += primary_id.value;

		let values = [];
		caption_fields.value.forEach((f) => {
			if (record.value[f]) {
				values.push(record.value[f]);
			}
		});

		if (values.length > 0) {
			caption += " - " + values.join(" ");
		}
	} else {
		caption = "New";
	}

	form_caption.value = caption;
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

		controller_url.value = layout.value.controller;
		actions.value = layout.value.actions;
		caption_fields.value = layout.value.caption_fields;

		if (!page_caption) {
			page_caption_ref.value = layout.value.caption;
		} else {
			page_caption_ref.value = page_caption;
		}

		const sections = layout.value.sections;
		expansion_mode.value = expand_all ? Array.from(Array(Object.entries(sections).length).keys()) : 0;

		Object.entries(sections).forEach(([key, section]) => {
			let fields_children = [];
			if (section.fields) {
				Object.entries(section.fields).forEach(([key, f]) => {
					if (f.is_primary) {
						primary_field.value = f;
					}

					if (!f.is_auto_generated) {
						fields_children.push(f);
						all_fields.value[f.code] = f;
					}
				});
			}

			let new_section = { ...section };
			new_section.fields = fields_children;

			display_sections.value.push(new_section);
		});
	}

	return response_data.result;
}

/**
 * Field Upload
 */
async function onUploadedFile(file) {
	await requestRead();
}

/**
 * Field Lookup
 */
async function onFieldLookupDone(field, selected_records) {
	record.value[field.code] = selected_records;
	saveFieldValue(field);
}

/**
 *  Field Tree
 */
function onDislayAdvTreeDialog(field, adv_tree, record_value) {
	emit("field:tree:display", field, adv_tree, record_value);
}

function onSelectedNodesChange(nodes, field, new_value) {
	if (!field) {
		return;
	}

	record.value[field.code] = new_value;
	saveFieldValue(field);
}

/** 
 * Field Media File
 */
async function onChangeMediaFile(field, new_files) {
	record.value[field.code] = [...new_files];
	saveFieldValue(field);
}

/**
 * Field Tag
 */
async function saveInputTagFieldValue(new_val, field) {
	record.value[field.code] = [...new_val];
	saveFieldValue(field);
}

function filterTemplateById(template_ref, ref_id) {
	if (template_ref.value) {
		for (let i in template_ref.value) {
			const field_ref = template_ref.value[i];
			if (field_ref.$attrs.ref_id == ref_id) {
				return field_ref;
			}
		}
	}

	return null;
}

onMounted(async () => {
	// Assign form mode from URL Query: View/Edit
	if (route.query.mode) {
		form_mode.value = route.query.mode;
	}

	// If not editable, then only view
	if (!page_editable.value) {
		form_mode.value = FORM_MODE.VIEW;
	}

	// Assign primary id
	if (route.query.id) {
		primary_id.value = route.query.id;
	}

	const layout_result = await requestLayout();
	if (!layout_result) {
		// If failed to get page layout navigate to home page
		navigateTo("/");
		return;
	}

	// If there is primary id
	if (primary_id.value) {
		const read_result = await requestRead();
		if (!read_result) {
			dialog_no_record.value = true;
		}
	} else {
		// If no primary id, Reset form
		resetForm();
	}

	// Emit record initially
	emit("update:record", record.value);
});
</script>

<style lang="less">
.la-page-card {
	background-color: #fff;
	margin-bottom: 100px;

	.v-theme--light {
		--v-disabled-opacity: 1.0;
	}

	// Sticky Bar
	.sticky-bar {
		z-index: 100;
		padding: 0px;
		border-radius: 8px;
		border: 1px solid var(--la_primary_color_silver_1);
		box-shadow: 0px 2px 2px 1px #c3c3c3;

		.v-toolbar-title {
			min-width: 300px;
		}

		.v-toolbar__content {
			height: auto !important;
			flex-wrap: wrap;
			padding: 8px 8px;
			gap: 8px;
		}

		.page-caption {
			display: flex;
			gap: 16px;
			align-items: center;
		}

		.system-actions {
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
			margin-right: 16px;
		}

		.custom-actions {
			display: flex;
			gap: 4px;
			border-left: 1px solid var(--la_primary_color_silver_3);
			padding-left: 16px;
		}
	}

	// Form Caption
	.form-caption {
		margin-bottom: 8px;
	}

	// Section Groups
	.groups {
		.group {
			.group-caption {
				white-space: nowrap;
				font-size: 18px;
			}
		}
	}

	.fields {
		.col-label {
			align-self: center;
		}

		.caption {
			display: grid;
			column-gap: 8px;
			align-items: baseline;
			grid-template-columns: auto 1fr;

			.label {
				overflow: hidden;
			}

			.dots {
				background-image: url(data:image/svg+xml;charset=utf-8;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc4JyBoZWlnaHQ9JzgnPjxjaXJjbGUgY3g9JzEnIGN5PSc0JyByPScxJyBmaWxsPScjZDBkM2Q3JyAvPjwvc3ZnPg==);
				background-repeat: repeat-x;
				background-position-y: center;
				height: 1px;
			}
		}

		.control {
			&.read-only {
				padding: 4px 8px;
				background-color: #eee;
				filter: brightness(0.9);
				border-radius: 4px;

				.v-field__input:not(textarea) {
					padding-top: 0px;
				}

				// Field Encrypted
				.encrypted {
					.v-input__append {
						padding: 4px;
					}
				}
			}

			// Field Datetime
			.date_time {
				input {
					border-color: #b1b1b1;
					height: 40px;

					&:focus {
						border: 2px solid #252525;
					}
				}
			}

		}
	}

	.ql-editor {
		p {
			margin: 0 20px;
		}
	}

	.v-expansion-panel--active>.v-expansion-panel-title:not(.v-expansion-panel-title--static) {
		min-height: 42px;
	}

	.v-expansion-panel-text__wrapper {
		padding: 4px 24px 4px 24px;
	}
}
</style>
