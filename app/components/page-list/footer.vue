<template>
	<div class="footer">
		<div class="pagination">
			<v-pagination v-model="pagination.page" :length="pagination.last_page" :total-visible="6"
				@update:model-value="onPaginationChange" density="comfortable"></v-pagination>
			<v-spacer></v-spacer>
			<v-select class="page-sizes" v-model="pagination.size" :items="[50, 100, 200]" variant="outlined" hide-details="auto"
				@update:model-value="onPaginationChange" density="compact"></v-select>
		</div>
		<div class="selected_records" v-if="show_selected_records && selected_records.length > 0">
			<div class="record" v-for="(record, index) in selected_records">
				<span class="label"> {{ record[selected_record_label] }}</span>
				<div class="actions">
					<v-btn @click="onClickRemoveRecord(index)" density="compact" icon="mdi-close-circle"
						variant="text"></v-btn>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>

// Emits
const emit = defineEmits(["update:pagination", "update:selected_records"]);

// Model
const pagination = defineModel('pagination', { default: new Pagination() });
const selected_records = defineModel('selected_records', { default: [] });

// Props
const { show_selected_records, selected_record_label } = defineProps({
	show_selected_records: {
		type: Boolean,
		default: false
	},
	selected_record_label: {
		type: String,
		default: "label"
	}
});

// Functions
function onPaginationChange() {
	emit("update:pagination", pagination.value);
}

function onClickRemoveRecord(index) {
	// Un-select
	selected_records.value[index].select_box = false;
	selected_records.value.splice(index, 1);

	emit("update:selected_records", selected_records.value);
}

</script>

<style lang="less">
.la-page-list {
	.footer {
		.v-btn--icon.v-btn--density-compact {
			padding: 0px 8px;
			min-width: calc(var(--v-btn-height) + -8px);
			width: auto;
			height: calc(var(--v-btn-height) + -8px);
		}

		.pagination {
			display: flex;
			flex-wrap: wrap;
			gap: 12px;
			padding: 12px;

			.page-sizes {
				max-width: 200px;
			}
		}

		.selected_records {
			display: flex;
			flex-wrap: wrap;
			padding: 8px;
			border-radius: 8px;
			border: 1px solid #ccc;
			gap: 8px;
			max-height: 300px;
    		overflow-y: scroll;
			
			.record {
				padding: 4px 8px;
				border: 1px solid #ccc;
				border-radius: 8px;
				display: flex;
				gap: 8px;
				align-items: center;

				.actions {
					.remove {
						cursor: pointer;
					}
				}
			}
		}
	}
}
</style>
