<template>
	<div class="advanced-tree">
		<client-only>
			<advanced-tree-node :children="all_nodes" :level="0" :is_draggable="is_draggable" :select_type="select_type"
				:open_on_select="open_on_select" :activatable="activatable" @node:activated="onNodeActivated"
				@node:selected="onCheckboxSelected">
				<template v-if="$slots['prepend']" #["prepend"]="slot_data">
					<slot name="prepend" v-bind="slot_data || {}">
					</slot>
				</template>
				<template v-if="$slots['label']" #["label"]="slot_data">
					<slot name="label" v-bind="slot_data || {}">
					</slot>
				</template>
			</advanced-tree-node>
		</client-only>
	</div>
</template>

<script setup>
// import { ref, watch, onMounted, defineExpose } from 'vue';
import { FIELD_TREE, HTTP_METHOD } from 'la-ecom-2-admin-core/app/utils/constant.js';
import { useApiFetch } from 'la-ecom-2-admin-core/app/composables/useApiFetch.js';
/**
	Example Data:
	const nodes = ref([
		{
			id: 0,
			title: "A",
			level: 0,
		}, {
			id: 1,
			title: "B",
			parent_id: 0,
			level: 1,
		}, {
			id: 2,
			title: "C",
			parent_id: 1,
			level: 2,
		}
	]);
 */
// Model
const selected_nodes = defineModel('selected_nodes', { default: {} });

// Emits
const emit = defineEmits([
	"loaded", "node:activated",
	"node:selected", "update:selected_nodes"
]);

// Props
const {
	nodes, filter_url, key_id, key_title, key_parent_id, key_selectable,
	parse_records, filters, select_type, node_selectable, activatable,
	open_on_select
} = defineProps({
	nodes: {
		type: Array,
		default: []
	},
	filter_url: {
		type: String,
		default: ""
	},
	key_id: {
		type: String,
		default: "id",
	},
	key_title: {
		type: String,
		default: "title",
	},
	key_parent_id: {
		type: String,
		default: "parent_id"
	},
	key_selectable: {
		type: String,
		default: "selectable"
	},
	parse_records: {
		type: Boolean,
		default: true
	},
	is_draggable: {
		type: Boolean,
		default: false
	},
	filters: {
		type: Array,
		default: []
	},
	select_type: {
		type: String,
		default: FIELD_TREE.SELECT_TYPE_NONE
	},
	node_selectable: {
		type: Boolean,
		default: true
	},
	activatable: {
		type: Boolean,
		default: true
	},
	open_on_select: {
		type: Boolean,
		default: false
	}
});

// Refs
const all_nodes = ref([]);
const is_loading = ref(false);

// Variables
let last_activated_node;

// Watch
watch(() => nodes, async (new_nodes) => {
	// Get nodes from input
	const parsed_nodes = parseRecords(null, 0, new_nodes);
	const old_nodes = JSON.parse(JSON.stringify(all_nodes.value));
	mergeNewNodes(parsed_nodes, old_nodes);
	all_nodes.value = parsed_nodes;
});

watch(selected_nodes, async (newValue) => {
	// Check/uncheck node
	checkSelectedNodes(all_nodes.value, true);
});

// Expose
defineExpose({
	getNodes, searchNodeById, setSelectedNodes
});

// Functions

function mergeNewNodes(parsed_nodes, old_nodes) {
	if (!parsed_nodes || !old_nodes) {
		return;
	}

	for (const item of parsed_nodes) {
		for (const old_item of old_nodes) {
			if (old_item.id != item.id) {
				continue;
			}

			item.is_open = old_item.is_open;
			item.is_selected = old_item.is_selected;

			if (last_activated_node && last_activated_node.id == item.id) {
				item.is_activated = true;
				last_activated_node = item;
			}

			if (item.children) {
				mergeNewNodes(item.children, old_item.children);
			}
		}
	}
}

onMounted(async () => {
	// Load Tree Nodes
	if (nodes && nodes.length > 0) {
		// Get nodes from input
		all_nodes.value = parseRecords(null, 0, nodes);
	} else {
		// Get nodes from servers
		await getNodes();
	}

	emit("loaded", all_nodes.value);
});

function setSelectedNodes(new_selected_nodes) {
	selected_nodes.value = new_selected_nodes;
	emit("update:selected_nodes", selected_nodes.value);
}

function onNodeActivated(node) {
	node.is_activated = !Boolean(node.is_activated);
	if (last_activated_node && last_activated_node.id != node.id) {
		last_activated_node.is_activated = false;
	}

	last_activated_node = node;

	emit("node:activated", node);
}

function onCheckboxSelected(node) {
	// Process Selection Type
	switch (select_type) {
		case FIELD_TREE.SELECT_TYPE_SINGLE_LEAF:
		case FIELD_TREE.SELECT_TYPE_SINGLE_INDEPENDENT:
			// de-select other nodes
			checkSelectedNodes(all_nodes.value, false);
			for (let i in selected_nodes.value) {
				delete selected_nodes.value[i];
			}

			break;
	}

	// Check/Un-check node
	node.is_selected = !node.is_selected;
	if (node.is_selected) {
		selected_nodes.value[node.id] = node;
	} else {
		delete selected_nodes.value[node.id];
	}

	// Process Selection Type
	switch (select_type) {
		case FIELD_TREE.SELECT_TYPE_CLASSIC:
			// Select children
			doCheckOnNodeChildren(node.children, node.is_selected);
			break;
	}

	emit("update:selected_nodes", selected_nodes.value);
	emit("node:selected", node);
}

// Get all nodes
async function getNodes(custom_filters = []) {
	if (!filter_url) {
		return;
	}

	const all_filters = filters.concat(custom_filters);

	is_loading.value = true;
	const res_data = await useApiFetch(
		filter_url, {
		method: HTTP_METHOD.POST,
		body: {
			pagination: {
				page: 0,
				size: -1
			},
			filters: all_filters,
			sorts: [{
				field_code: key_id,
				direction: "ASC"
			}]
		}
	});

	if (res_data.result) {
		const parsed_nodes = parseRecords(null, 0, res_data.records);
		const old_nodes = JSON.parse(JSON.stringify(all_nodes.value));
		mergeNewNodes(parsed_nodes, old_nodes);
		all_nodes.value = parsed_nodes;
	}

	is_loading.value = false;
}

function checkSelectedNodes(nodes, to_select = true) {
	if (!nodes) {
		return;
	}

	for (let i in nodes) {
		const node = nodes[i];
		if (selected_nodes.value && selected_nodes.value[node.id]) {
			node.is_selected = to_select;
		} else {
			// If not, then not select
			node.is_selected = false;
		}

		checkSelectedNodes(node.children, to_select);
	}
}

function doCheckOnNodeChildren(nodes, to_select = true) {
	if (!nodes) {
		return;
	}

	for (let i in nodes) {
		const node = nodes[i];
		node.is_selected = to_select;
		doCheckOnNodeChildren(node.children, to_select);
	}
}

function parseRecords(current_record, current_level, records) {
	if (!parse_records) {
		return records;
	}

	// Get children same level
	let children = [];
	for (let y = 0; y < records.length; y++) {
		const record = records[y];
		if (record.level == current_level) {
			if (current_record) {
				if (record[key_parent_id] == current_record[key_id]) {
					children.push(record);
				}
			} else {
				children.push(record);
			}
		}
	}

	let children_data = [];
	for (let y = 0; y < children.length; y++) {
		const child_record = children[y];
		let new_children_data = parseRecords(child_record, current_level + 1, records);

		const data = { ...child_record };
		let child_data = {
			id: child_record[key_id],
			title: child_record[key_title],
			level: current_level,
			parent_id: current_record ? current_record[key_id] : 0,
			is_open: false,
			is_selected: false,
			is_activated: false,
			selectable: child_record[key_selectable] || node_selectable,
			open_icon: 'mdi-plus',
			close_icon: 'mdi-minus',
			data: data,
		};

		child_data.children = new_children_data;

		children_data.push(child_data);
	}

	return children_data;
}

function searchNodeById(node_id) {
	const root_node = {
		children: all_nodes.value
	};

	const found_node = depthFirstSearch(root_node, node_id);
	return found_node;
}

function depthFirstSearch(node, search_id) {
	// Else, check children
	let children = node.children;
	for (let i in children) {
		const c = children[i];
		if (search_id == c.id) {
			return c;
		}

		let child_result = depthFirstSearch(c, search_id);
		if (child_result) {
			return child_result;
		}
	}

	return null;
}

</script>

<style scoped lang="less">
.advanced-tree {
	display: grid;
	gap: 4px;
	background-color: #fff;
	padding: 12px;
	user-select: none;
}
</style>
