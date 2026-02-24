<template>
	<tr class="record">
		<!-- Checkbox -->
		<page-list-record-field :field="field_checkbox" :header="headers[PAGE_LIST_HEADER_TYPE.SELECT_BOX]"
			:show_selectbox="show_selectbox" @update:is_selected="onRecordSelected"
			v-model:is_selected="record.select_box">
		</page-list-record-field>

		<!-- Sticky fields -->
		<page-list-record-field v-for="(field, key) in fields_sticky" :key="key" :field="field" :header="headers[key]"
			:form_mode="form_mode" :is_editing="record._is_editng" :show_selectbox="show_selectbox"
			:insertable="insertable" :editable="editable" :deletable="deletable" :has_card_page="has_card_page" >
		</page-list-record-field>

		<!-- Dropdown -->
		<page-list-record-field :field="field_dropdown_menu" :header="headers[PAGE_LIST_HEADER_TYPE.DROPDOWN_MENU]"
			:form_mode="form_mode" :is_editing="record._is_editng"
			:insertable="insertable" :editable="editable" :deletable="deletable" :has_card_page="has_card_page"
			:show_selectbox="show_selectbox" @menu-item-selected="onMenuItemSelected">
		</page-list-record-field>

		<!-- Non sticky fields -->
		<page-list-record-field v-for="(field, key) in fields_not_sticky" :key="key" :field="field"
			:header="headers[key]" :form_mode="form_mode" :is_editing="record._is_editng" 
			:insertable="insertable" :editable="editable" :deletable="deletable" :has_card_page="has_card_page"
			:show_selectbox="show_selectbox" :slot="field.slot" 
			@field:change="onChangeField" @field:blur="onBlurField">
			<template v-if="$slots[field.slot]" #[field.slot]="slot_data">
				<slot :name="field.slot" v-bind="{ record: record, ...slot_data } || {}"></slot>
			</template>
		</page-list-record-field>

		<td style="width: '100%'"></td>
	</tr>
</template>

<script setup>

// Constants
const SLOT_KEY_FIELD = "field:";

// Props
const { record, headers, show_selectbox, view_path, 
	selected_ids, editable, insertable, has_card_page
} = defineProps({
	record: {
		type: Object,
		default: {}
	},
	headers: {
		type: Object,
	},
	show_selectbox: {
		type: Boolean,
		default: false,
	},
	view_path: {
		type: String,
		default: ''
	},
	form_mode: {
		type: String,
		default: FORM_MODE.VIEW
	},
	selected_ids: {
		type: Object
	},
	editable: {
		type: Boolean,
		default: true
	},
	insertable: {
		type: Boolean,
		default: true
	},
	deletable: {
		type: Boolean,
		default: true
	},
	has_card_page: {
		type: Boolean,
		default: true
	},
});

// Emits
const emit = defineEmits([
	'field:change', 'field:blur', 'menu-item-selected', 'record-selected'
]);

// Refs
const field_checkbox = ref({
	code: PAGE_LIST_HEADER_TYPE.SELECT_BOX,
	value: ''
});

const field_dropdown_menu = ref({
	code: PAGE_LIST_HEADER_TYPE.DROPDOWN_MENU,
	value: ''
});

const fields_sticky = ref({});
const fields_not_sticky = ref({});
const primary_field = ref();

// Functions
function onMenuItemSelected(data) {
	data.record = record;
	data.primary_field = primary_field.value;

	switch (data.id) {
		case PAGE_LIST_DROPDOWN_MENU_ITEM_TYPE.VIEW:
			break;
		case PAGE_LIST_DROPDOWN_MENU_ITEM_TYPE.EDIT:
			break;
		case PAGE_LIST_DROPDOWN_MENU_ITEM_TYPE.DELETE:
			break;
		case PAGE_LIST_DROPDOWN_MENU_ITEM_TYPE.SELECT_MORE:
			if (!show_selectbox) {
				record.select_box = true;
			}
			break;
	}
	
	emit('menu-item-selected', data);
}

async function onRecordSelected(is_checked) {
	emit('record-selected', primary_field.value, is_checked, record);
}

function calcUrl(key, value, mode) {
	if (view_path) {
		let url = view_path + '?' + key + '=' + value + '&mode=' + mode;
		return url;
	}

	return "";
}

function onChangeField(field) {
	emit("field:change", field, record);
}

function onBlurField(field) {
	emit("field:blur", field, record);
}

onMounted(async () => {
	try {
		fields_sticky.value = {};
		fields_not_sticky.value = {};
		Object.entries(headers).forEach(([header_key, header]) => {
			if (header.is_checkbox) {
				return;
			}

			if (header_key == PAGE_LIST_HEADER_TYPE.DROPDOWN_MENU ||
				header_key == PAGE_LIST_HEADER_TYPE.SELECT_BOX
			) {
				return;
			}

			const value = record[header_key];

			const field_data = {
				...header.field
			}; // Copy field info from header to field_data

			field_data.value = value; // Assign record data to field data

			// Assign fields to primary field
			if (field_data.is_primary) {
				field_data.view_url = calcUrl(header_key, value, FORM_MODE.VIEW);
				field_data.edit_url = calcUrl(header_key, value, FORM_MODE.EDIT);
				primary_field.value = field_data;
			}

			if (header?.is_sticky) {
				fields_sticky.value[header_key] = field_data;
			} else {
				// Add field slot
				field_data.slot = SLOT_KEY_FIELD + field_data.code;
				fields_not_sticky.value[header_key] = field_data;
			}
		});
	} catch (error) {
		console.log(error);
	}
});

</script>

<style scoped lang="less">
tr {
	border-bottom: 1px solid var(--la_primary_color_silver_2);

	&:hover {
		background-color: var(--la_primary_color_silver_1);
	}
}
</style>
