<template>
	<v-sheet class="pa-6">
		<div class="text-h6 font-weight-bold mb-4 d-flex">
			Filter
			<v-spacer></v-spacer>
			<!-- Popup Help -->
			<v-btn icon="mdi-help-circle-outline" density="compact" variant="text"
					@click="showHelp = true">
			</v-btn>
    		<page-list-filter-help v-model="showHelp"/>
			
			<v-btn icon="mdi-close" density="compact" variant="text" @click="closeFilter"></v-btn>
		</div>
		<v-container class="filter-panel pa-0">
			<v-row>
				<v-col>
					<div class="filters">
						<div class="filter" v-for="(filter, index) in added_filters" :key="index">
							<div class="row-top">
								<v-btn icon="mdi-close" density="compact" variant="text" size="small" color="grey"
									@click="removeFilter(filter)"></v-btn>
								<div class="label" color="text-red-lighten-1"> {{ filter.field.caption }}</div>
							</div>
							<div class="row-bottom">
								<div :class="filter.field.input_type"
									v-if="[FIELD_INPUT_TYPE.INT, FIELD_INPUT_TYPE.DECIMAL, FIELD_INPUT_TYPE.STRING, FIELD_INPUT_TYPE.ENCRYPTED_PHONE].includes(filter.field.input_type)">
									<!-- String/Int/Decimal-->
									<v-text-field density="compact" variant="outlined" hide-details="auto"
										v-model="filter.expression" @keydown.enter="doFilter"></v-text-field>
								</div>
								<div :class="filter.field.input_type"
									v-if="filter.field.input_type == FIELD_INPUT_TYPE.BOOL">
									<!-- Bool -->
									<v-checkbox density="compact" variant="outlined" hide-details="auto"
										v-model="filter.expression">
									</v-checkbox>
								</div>
								<div :class="filter.field.input_type"
									v-if="filter.field.input_type == FIELD_INPUT_TYPE.DATE">
									<!-- Date -->
									<vue-date-picker v-model="filter.expression" :teleport="true" range multi-calendars
										@update:model-value="doFilter" />
								</div>
								<div :class="filter.field.input_type"
									v-if="filter.field.input_type == FIELD_INPUT_TYPE.DATE_TIME">
									<!-- Date Time Range Picker -->
									<vue-date-picker v-model="filter.expression" :teleport="true" range multi-calendars time-picker-inline
										@update:model-value="doFilter" :start-time="[{ hours: 0, minutes: 0 }, { hours: 0, minutes: 0 }]"/>
								</div>
								<div :class="filter.field.input_type"
									v-if="filter.field.input_type == FIELD_INPUT_TYPE.SELECT">
									<!-- Select -->
									<v-select :items="Object.values(filter.field.options)" density="compact"
										variant="outlined" hide-details="auto" v-model="filter.expression"
										@update:model-value="doFilter">
									</v-select>
								</div>
								<div :class="filter.field.input_type"
									v-if="filter.field.input_type == FIELD_INPUT_TYPE.MULTI_SELECT">
									<!-- Multi Select -->
									<v-select :items="Object.values(filter.field.options)" density="compact"
										variant="outlined" multiple hide-details="auto" v-model="filter.expression"
										@update:model-value="doFilter">
									</v-select>
								</div>
							</div>
						</div>
					</div>
				</v-col>
			</v-row>
			<v-row>
				<v-col>
					<div class="new-filter">
						<v-btn @click="show_all_filters = !show_all_filters" density="compact" variant="text"
							prepend-icon="mdi-plus">Filter</v-btn>
						<div v-if="show_all_filters">
							<div class="overlay" @click="closeNewFilter"></div>
							<v-select :items="all_filters" density="compact" variant="outlined"
								v-model="new_filter_item" :menu-props="{ modelValue: show_all_filters }"
								@update:modelValue="onSelectNewFilter">
							</v-select>
						</div>
					</div>
				</v-col>
			</v-row>
			<v-row>
				<v-divider></v-divider>
				<v-col></v-col>
			</v-row>
			<div class="d-flex">
				<v-btn density="compact" @click="resetFilter">Reset</v-btn>
				<v-spacer></v-spacer>
				<v-btn density="compact" @click="doFilter">Filter</v-btn>
			</div>
		</v-container>

	</v-sheet>
</template>

<script setup>

// Model
const added_filters = defineModel('added_filters')

// Emits
const emit = defineEmits(['do-filter', 'close-filter']);

// Expose
defineExpose({
	init,
	addFilter,
	removeFilter,
	resetFilter
});

// Refs
const show_all_filters = ref(false);
const new_filter_item = ref();
const all_filters = ref([]);
const showHelp = ref(false)

/// Functions
function init(headers) {
	Object.entries(headers.value).forEach(([key, h]) => {
		if (key == PAGE_LIST_HEADER_TYPE.SELECT_BOX || key == PAGE_LIST_HEADER_TYPE.DROPDOWN_MENU) {
			return;
		}

		const found_items = all_filters.value.filter((i) => {
			return i.code == key;
		});

		if (found_items.length > 0) {
			return;
		}

		const item = {
			code: key,
			title: h.field.caption,
			value: h,
		};

		all_filters.value.push(item);

		sortAllFilters();
	});
}

function closeFilter() {
	emit('close-filter');
}

function onSelectNewFilter() {
	closeNewFilter();

	const header = new_filter_item.value;
	addFilter(header);

	new_filter_item.value = undefined;
}

function closeNewFilter() {
	show_all_filters.value = false;
}

function addFilter(header) {
	let init_epxression = "";

	switch (header.field.input_type) {
		case FIELD_INPUT_TYPE.BOOL:
			init_epxression = false;
			break;
		case FIELD_INPUT_TYPE.MULTI_SELECT:
			init_epxression = [];
			break;
	}

	// add to added_filters
	added_filters.value[header.field.code] = {
		field: header.field,
		expression: init_epxression
	};

	// remove from all_filters
	all_filters.value.filter((item, index) => {
		if (item.code == header.field.code) {
			all_filters.value.splice(index, 1);
			return;
		}
	});

	sortAllFilters();
}

function removeFilter(filter) {
	// Add to all_filters
	doRemoveFilter(filter);
	doFilter();
}

function doRemoveFilter(filter) {
	// Add to all_filters
	const item = {
		code: filter.field.code,
		title: filter.field.caption,
		value: filter
	};

	all_filters.value.push(item);

	// Remove from added_filters
	delete added_filters.value[filter.field.code];

	sortAllFilters();
}

function resetFilter() {
	Object.entries(added_filters.value).forEach(([key, value]) => {
		doRemoveFilter(value);
	})

	doFilter();
}

async function doFilter() {
	await nextTick();
	emit('do-filter');
}

function sortAllFilters() {
	all_filters.value = all_filters.value.sort(function (a, b) {
		let val_a = a.value;
		let val_b = b.value;
		return val_a?.position - val_b?.position;
	});
}

</script>

<style scoped lang="less">
.filter-panel {
	width: 250px;

	.filters {
		display: grid;
		gap: 12px;

		.filter {
			.row-top {
				display: flex;
				align-items: center;
				gap: 4px;
				user-select: none;

				.label {
					font-size: 14px;
				}
			}
		}
	}
}

.overlay {
	position: fixed;
	width: 100%;
	height: 100%;
	top: 0px;
	left: 0px;
	right: 0px;
	bottom: 0px;
}
</style>
