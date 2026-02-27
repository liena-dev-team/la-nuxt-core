<template>
	<td class="record-field" :class="{
		'sticky-col': header?.is_sticky,
		'is-checkbox': header?.is_checkbox,
		'show-selectbox': show_selectbox,
		'edit-mode': (form_mode == FORM_MODE.EDIT),
		'is-editing': (header?.is_sticky && is_editing)
	}" :style="header_style">
		<template v-if="field.code != PAGE_LIST_HEADER_TYPE.SELECT_BOX">
			<!-- Row Field -->
			<div class="field" v-if="!header?.is_dropdown">
				<div v-if="field.is_primary" class="primary">
					<template v-if="field.view_url && has_card_page">
						<a class="key-url" :href="field.view_url" title="View detail">{{ field.value }}</a>
					</template>
					<template v-else>
						{{ field.value }}
					</template>
				</div>
				<template v-else>
					<!-- View Mode -->
					<div class="view" v-if="!is_editing">
						<template v-if="$slots[field.slot]">
							<slot :name="field.slot" :field="field"></slot>
						</template>
						<template v-else>
							<!-- String/Int -->
							<a :title="field.value" :class="field.input_type" v-if="field.input_type == FIELD_INPUT_TYPE.STRING
								|| field.input_type == FIELD_INPUT_TYPE.INT">
								{{ field.value }}
							</a>
							<!-- Decimal -->
							<div :class="field.input_type" v-if="field.input_type == FIELD_INPUT_TYPE.DECIMAL">
								{{ field.value }}
							</div>
							<!-- Bool -->
							<div :class="field.input_type" v-if="field.input_type == FIELD_INPUT_TYPE.BOOL">
								<v-icon icon="mdi-checkbox-marked" v-if="field.value == 1"></v-icon>
								<v-icon icon="mdi-checkbox-blank-outline" v-else></v-icon>
							</div>
							<!-- Date -->
							<div :class="field.input_type" v-if="field.input_type == FIELD_INPUT_TYPE.DATE">
								{{ formatDisplayDate(field.value) }}
							</div>
							<!-- Date Time -->
							<div :class="field.input_type" v-if="field.input_type == FIELD_INPUT_TYPE.DATE_TIME">
								{{ formatDisplayDateTime(field.value) }}
							</div>
							<!-- Select -->
							<div :class="field.input_type" v-if="field.input_type == FIELD_INPUT_TYPE.SELECT">
								{{ field.options?.[field.value]?.title || "" }}
							</div>
							<!-- Select/Multi-Select -->
							<div :class="field.input_type" v-if="field.input_type == FIELD_INPUT_TYPE.MULTI_SELECT">
								{{ get_multi_select_value(field) }}
							</div>
							<!-- Media Image -->
							<div :class="field.input_type" v-if="field.input_type == FIELD_INPUT_TYPE.MEDIA_FILE">
								<div class="image-thumbnails" v-if="media_option_images.length">
									<template v-for="(image_src, index) in media_option_images" :key="index">
										<v-img class="image-thumbnail" :src="image_src" width="100" height="100"
											cover></v-img>
									</template>
								</div>
							</div>
							<!-- Encrypted / EncryptedPhone-->
							<field-encrypt-phone
								:key="'encrypt-phone-view-' + field.code + '-' + (field.record_sync_version ?? 0)"
								v-if="field.input_type == FIELD_INPUT_TYPE.ENCRYPTED || field.input_type == FIELD_INPUT_TYPE.ENCRYPTED_PHONE"
								:field="field"
								:model_value="field?.value"
								mode="view"
								:caption="field?.caption || header?.title">
							</field-encrypt-phone>
						</template>
					</div>
					<!-- Edit Mode -->
					<div class="edit" v-else>
						<div :class="field.input_type" v-if="field.input_type == FIELD_INPUT_TYPE.STRING">
							<!-- String -->
							<v-text-field v-model="field.value" density="compact" variant="outlined" hide-details="auto"
								:disabled="!field.editable" tile @update:model-value="on_change_field"
								@blur="on_blur_field">
							</v-text-field>
						</div>
						<div :class="field.input_type" v-if="field.input_type == FIELD_INPUT_TYPE.INT">
							<!-- Int -->
							<v-text-field v-model="field.value" type="number" density="compact" variant="outlined"
								hide-details="auto" :disabled="!field.editable" tile @update:model-value="on_change_field"
								@blur="on_blur_field">
							</v-text-field>
						</div>
						<div :class="field.input_type" v-if="field.input_type == FIELD_INPUT_TYPE.DECIMAL">
							<!-- Decimal -->
							<v-text-field v-model="field.value" type="number" density="compact" variant="outlined"
								hide-details="auto" :disabled="!field.editable" tile @update:model-value="on_change_field"
								@blur="on_blur_field">
							</v-text-field>
						</div>
						<div :class="field.input_type" v-if="field.input_type == FIELD_INPUT_TYPE.BOOL">
							<!-- Boolean -->
							<v-checkbox v-model="field.value" density="compact" variant="outlined" hide-details="auto"
								:disabled="!field.editable" @update:model-value="on_change_field" @blur="on_blur_field">
							</v-checkbox>
						</div>
						<div :class="field.input_type" v-if="field.input_type == FIELD_INPUT_TYPE.DATE">
							<!-- Date -->
							<vue-date-picker v-model="field.value" :text-input="{
								format: 'd/M/yyyy'
							}" :teleport="true" format="d/M/yyyy" @update:model-value="on_blur_field" />
						</div>
						<div :class="field.input_type" v-if="field.input_type == FIELD_INPUT_TYPE.DATE_TIME">
							<!-- Date Time -->
							<vue-date-picker v-model="field.value" :text-input="{
								format: 'd/M/yyyy HH:mm'
							}" :teleport="true" format="d/M/yyyy HH:mm" @update:model-value="on_blur_field" />
						</div>
						<div :class="field.input_type" v-if="field.input_type == FIELD_INPUT_TYPE.SELECT">
							<!-- Select -->
							<v-autocomplete v-model="field.value" :items="Object.values(field.options)"
								density="compact" variant="outlined" hide-details="auto" :disabled="!field.editable"
								autocomplete="off" @update:model-value="on_change_field" @blur="on_blur_field">
							</v-autocomplete>
						</div>
						<div :class="field.input_type" v-if="field.input_type == FIELD_INPUT_TYPE.MULTI_SELECT">
							<!-- Multi Select -->
							<v-autocomplete v-model="field.value" multiple :items="Object.values(field.options)"
								density="compact" variant="outlined" hide-details="auto" :disabled="!field.editable"
								@update:model-value="on_change_field" @blur="on_blur_field">
							</v-autocomplete>
						</div>
						<div :class="field.input_type"
							v-if="field.input_type == FIELD_INPUT_TYPE.ENCRYPTED_PHONE">
							<!-- EncryptedPhone: auto-decrypt and display plain text directly (no eye) -->
							<field-encrypt-phone
								:field="field"
								:model_value="field?.value"
								mode="edit_plain"
								@update:model_value="(val) => { field.value = val; on_change_field(); }"
								variant="outlined"
								hide_details="auto"
								:disabled="!field.editable"
								@blur="on_blur_field">
							</field-encrypt-phone>
						</div>
					</div>
				</template>
			</div>

			<v-menu v-if="header?.is_dropdown" @update:model-value="on_show_sub_menu">
				<template v-slot:activator="{ props }">
					<v-btn icon="mdi-dots-vertical" variant="text" size="x-small" v-bind="props"></v-btn>
				</template>
				<v-list style="max-width: 200px;" @click:select="on_menu_item_selected">
					<v-list-item v-for="(item, index) in items" :key="index" :value="index">
						<template v-slot:prepend>
							<v-icon :icon="item.icon" size="x-small"></v-icon>
						</template>
						<v-list-item-title>{{ item.title }}</v-list-item-title>
					</v-list-item>
				</v-list>
			</v-menu>
		</template>
		<!-- Check Box -->
		<input v-else class="field-checkbox" type="checkbox" v-model="is_selected" @change="on_selected" />

	</td>
</template>

<script setup>
// Model
const is_selected = defineModel('is_selected', { default: false });

// Constants
const MENU_ITEM_VIEW = { title: 'View', icon: 'mdi-eye-outline' };
const MENU_ITEM_EDIT = { title: 'Edit', icon: 'mdi-pencil' };
const MENU_ITEM_DELETE = { title: 'Delete', icon: 'mdi-delete' };
const MENU_ITEM_SELECT_MORE = { title: 'Select More...', icon: 'mdi-format-list-checks' };

// Emits
const emit = defineEmits(['field:change', 'field:blur', 'menu-item-selected', 'update:is_selected']);

const {
	field, header, show_selectbox, form_mode,
	editable, insertable, deletable, has_card_page
} = defineProps({
	field: Object,
	header: Object,
	show_selectbox: {
		type: Boolean,
		default: false
	},
	form_mode: {
		type: String,
		default: FORM_MODE.VIEW
	},
	is_editing: {
		type: Boolean,
		default: false
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
	}
});

// Computed
const header_style = computed(() => {
	return {
		'width': header?.width ? (header.width + 'px') : '0',
		'left': header?.left ? (header.left + 'px') : '0'
	}
})
const media_option_images = computed(() => get_multi_select_image(field));

// Refs
const items = ref({});

// Functions
function on_menu_item_selected(e) {
	const data = {
		id: e.id
	}

	emit('menu-item-selected', data);
}

function on_selected(e) {
}

function on_show_sub_menu() {
	items.value = {};
	if (has_card_page) {
		items.value[PAGE_LIST_DROPDOWN_MENU_ITEM_TYPE.VIEW] = MENU_ITEM_VIEW;
	}

	if (editable && has_card_page) {
		items.value[PAGE_LIST_DROPDOWN_MENU_ITEM_TYPE.EDIT] = MENU_ITEM_EDIT;
	}

	if (deletable) {
		items.value[PAGE_LIST_DROPDOWN_MENU_ITEM_TYPE.DELETE] = MENU_ITEM_DELETE;
	}

	items.value[PAGE_LIST_DROPDOWN_MENU_ITEM_TYPE.SELECT_MORE] = MENU_ITEM_SELECT_MORE;
}

function on_change_field() {
	emit("field:change", field);
}

function on_blur_field() {
	emit("field:blur", field);
}

function get_multi_select_value(field) {
	let values = field.value || "";

	try {
		values = values.split(STRING_VALUES_SEPERATOR).map((val) => {
			return field.options?.[val]?.title || "";
		}).join(", ");
	} catch {
		values = "";
	}

	return values;
}

function get_multi_select_image(field) {
	const raw_value = field.value;
	if (!raw_value) {
		return [];
	}

	// const values = Array.isArray(raw_value)
	// 	? raw_value
	// 	: String(raw_value).split(STRING_VALUES_SEPERATOR);
	const values = String(raw_value).split(STRING_VALUES_SEPERATOR);

	return values
		.map((val) => field.options?.[val]?.title)
		.filter((src) => !!src);
}

onMounted(() => {
	// Process field value
	switch (field.input_type) {
		case FIELD_INPUT_TYPE.BOOL:
			field.value = Boolean(field.value);
			break;
		case FIELD_INPUT_TYPE.SELECT:
			if (field.value) {
				field.value = String(field.value);
			} else {
				field.value = "";
			}

			break;
	}
})

</script>

<style scoped lang="less">
@la_record_edit_highlight: #d2ffaf;

.dp__theme_light {
	--dp-background-color: @la_record_edit_highlight !important;
}

td.record-field {
	display: table-cell;
	width: auto;
	min-width: 20px;
	max-width: 1000px;
	vertical-align: middle;

	// Is Sticky
	&.sticky-col {
		position: sticky;
		background-color: var(--la_primary_color_silver_1);
		z-index: 100;
	}

	// Checkbox
	&.is-checkbox {
		display: none;
	}

	&.edit-mode {
		border-right: 1px solid var(--la_primary_color_silver_2);
	}

	&.is-editing {
		background-color: @la_record_edit_highlight;
	}

	&.show-selectbox {
		display: table-cell;
	}

	.field {
		.view {
			overflow: hidden;
			cursor: default;
			padding: 8px 16px;

			.string {
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
		}

		.edit {
			background-color: @la_record_edit_highlight;

			.bool {
				padding-left: 14px;
			}
		}

		.image-thumbnails {
			display: flex;
			flex-wrap: wrap;
			gap: 8px;

			.image-thumbnail {
				width: 100px;
				height: 100px;
				flex: 0 0 100px;
				border-radius: 4px;
				overflow: hidden;
			}
		}

		// Primary Key
		.primary {
			padding: 8px 8px;

			.key-url {
				display: block;
				text-decoration: none;
				color: unset;

				&:hover {
					text-decoration: underline;
				}
			}
		}

	}

}

.field-checkbox {
	width: 20px;
	height: 20px;
	cursor: pointer;
	margin: 10px;
}
</style>
