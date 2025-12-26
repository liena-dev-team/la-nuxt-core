<template>
	<v-sheet class="mx-auto">
		<v-container fluid>
			<v-row>
				<v-col cols="12" md="3" class="pa-2">
					<v-card>
						<v-card-title>Categories</v-card-title>
						<v-card-text>
							<advanced-tree ref="advanced_tree" :filter_url="FILTER_URL" key_title="name"
								@node:activated="onSelectCategory"></advanced-tree>
						</v-card-text>
						<v-divider></v-divider>
						<v-card-actions>
							<v-btn @click="newCategory">New Category</v-btn>
						</v-card-actions>
					</v-card>
				</v-col>
				<v-spacer></v-spacer>
				<v-col cols="12" md="9" class="pa-2">
					<page-card v-show="last_selected_id" ref="category_card"
						page_class="App\AdminPage\Catalog\CategoryCard" :caption_fields="['name']"
						@field:changed="onFieldUpdated" @record:created="onCardUpdated" @record:deleted="onCardDeleted"
						@field:tree:display="onDislayAdvTreeDialog">
						<template #["part:attribute_dependency"]>
							<!-- Attribute Dependency Tree via v-treeview -->
							<client-only>

								<tree-view-classic ref="attribute_dependency_tree" :item-title="'label'"
									:items="attribute_dep_nodes" select-strategy="classic" selectable
									v-model:selected_nodes="attribute_selected_nodes"
									@update:selected_nodes="onAttributeSelectedNodesChange" />
							</client-only>
						</template>
					</page-card>
				</v-col>
			</v-row>
		</v-container>
	</v-sheet>
</template>

<script setup>
// Constants
const FILTER_URL = "/admin/catalog/category/filter";
const ATTRIBUTE_DEP_FILTER_URL = "/admin/catalog/attribute-dependency/filter"; // Unused with static sample
// Attribute dependency nodes from API
const attribute_dep_nodes = ref([]);
// Selected nodes for attribute dependency tree (object map by id)
const attribute_selected_nodes = ref({});

// Template Ref
const category_card = useTemplateRef("category_card");
const advanced_tree = useTemplateRef("advanced_tree");
const route = useRoute();

// Refs 
const last_selected_id = ref();

function onSelectCategory(node) {
	try {
		if (!node.is_activated) {
			// If not selected
			last_selected_id.value = null;
			return;
		}

		last_selected_id.value = node.id;
		if (last_selected_id.value) {
			category_card.value.loadById(last_selected_id.value);
			// Load attribute dependencies for selected category
			loadAttributeDependencies(last_selected_id.value);
		}
	} catch (error) {
		console.log(error);
	}
}

function onFieldUpdated(field, current_value) {
	if (field.code == "parent_id"
		|| field.code == "name"
	) {
		advanced_tree.value.getNodes();
	}
}

function onCardUpdated() {
	advanced_tree.value.getNodes();
}

function onCardDeleted() {
	last_selected_id.value = null;
	advanced_tree.value.getNodes();
}

function onDislayAdvTreeDialog(field, adv_tree, record_value) {
	const id_value = record_value["id"];
	adv_tree.getNodes([
		{
			field: {
				code: "id"
			},
			expression: "<> " + id_value
		}
	]);
}

function newCategory() {
	category_card.value.resetForm();
	last_selected_id.value = -1;
}



function onAttributeSelectedNodesChange(nodes) {
	saveAttributeDependencies();
}

// Fetch attribute dependency tree via API
async function loadAttributeDependencies(category_id) {
	if (!category_id || Number(category_id) <= 0) {
		attribute_dep_nodes.value = [];
		return;
	}

	try {
		const url = `/admin/catalog/category/dependencies?category_id=${category_id}`;
		const res_data = await useApiFetch(url, { method: HTTP_METHOD.GET });

		// Expected shape: { result, messages, parent_id, level, dependencies: [...] }
		const records = (res_data && Array.isArray(res_data.dependencies)) ? res_data.dependencies : [];

		attribute_dep_nodes.value = records;
		attribute_selected_nodes.value = (res_data && res_data.attribute_selected_nodes && Object.keys(res_data.attribute_selected_nodes).length)
			? res_data.attribute_selected_nodes
			: {};
	
	} catch (e) {
		console.error('Failed to load attribute dependencies', e);
		attribute_dep_nodes.value = [];
	}
}

// Save currently selected dependency attribute ids to server
async function saveAttributeDependencies() {
	const category_id = last_selected_id.value;
	if (!category_id || Number(category_id) <= 0) {
		return;
	}

	const selected_attribute_ids = {};
	for (const id in (attribute_selected_nodes.value || {})) {
		selected_attribute_ids[id] = { id: Number(id) };
	}

	try {
		await useApiFetch('/admin/catalog/category/dependencies', {
			method: HTTP_METHOD.POST,
			body: {
				category_id: Number(category_id),
				attribute_selected_nodes: selected_attribute_ids
			}
		});
	} catch (e) {
		console.error('Failed to save attribute dependencies', e);
	}
}

onMounted(() => {
	if (route.query.id) {
		last_selected_id.value = route.query.id;
	}

	// Initial load for default or routed category
	if (last_selected_id.value) {
		loadAttributeDependencies(last_selected_id.value);
	}
});

// React to category change
watch(last_selected_id, (newVal) => {
	if (newVal) {
		loadAttributeDependencies(newVal);
	} else {
		attribute_dep_nodes.value = [];
	}
});

</script>