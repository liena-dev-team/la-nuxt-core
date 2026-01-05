<template>
	<div class="la-file-browser-tree">
		<v-card>
			<v-card-title>Media Files</v-card-title>
			<v-card-text>
				<advanced-tree :nodes="file_tree" :parse_records="false" :open_on_select="true"
					@node:activated="onLabelSelected">
					<template #['prepend']="{ element }">
						<div class="folder-icon">
							<v-icon :icon="element.is_open ? 'mdi-folder-open' : 'mdi-folder'"></v-icon>
						</div>
					</template>
					<template #['label']="{ element }">
						{{ element.title }}
					</template>
				</advanced-tree>
			</v-card-text>
			<v-divider></v-divider>
			<v-card-actions>
			</v-card-actions>
		</v-card>
	</div>
</template>

<script setup>

// Constant
const FOLDER_MEDIA_FILE = "/media/file";
const STORAGE_KEY_SELECTED_PATH = "la_file_browser_selected_path";

// Use
const { $media_manager } = useNuxtApp();

// Emits
const emit = defineEmits(["loaded", "selected"]);

// Props
const { title } = defineProps({
	title: {
		type: String,
		default: 'File Browser',
	},
});

// Refs
const selected_node = ref();
// Manual set data for media folder
const file_tree = ref([{
	id: "root",
	title: "Media",
	level: 0,
	parent_id: "",
	is_open: true,
	is_selected: false,
	selectable: true,
	data: {
		is_dir: true,
		name: "Media",
		relative_path: FOLDER_MEDIA_FILE,
		extension: "",
		size: 0
	},
	children: []
}]);

// Expose
defineExpose({
	openSelectedFolder, onDeleteFolder
});

// Functions
async function onLabelSelected(node) {
	selected_node.value = node;
	openSelectedFolder();
	// Persist selected folder path
	try {
		if (node?.data?.relative_path) {
			localStorage.setItem(STORAGE_KEY_SELECTED_PATH, node.data.relative_path);
		}
	} catch (e) { }
}

async function openSelectedFolder() {
	if (!selected_node.value) {
		return;
	}

	const nodes = await openFolderPath(
		selected_node.value.level,
		selected_node.value.data.relative_path
	);

	selected_node.value.children = nodes;
	emit("selected", selected_node.value);
}

async function onDeleteFolder() {
	const nodes = await openFolderPath(0, FOLDER_MEDIA_FILE);
	if (file_tree.value) {
		file_tree.value[0].children = nodes;
	}
}

async function openFolderPath(level, folder_path) {
	let nodes = [];
	const result_data = await $media_manager.list(folder_path, true);
	if (result_data.result) {
		const items = result_data.items;
		for (let i in items) {
			const item = items[i];
			nodes.push({
				id: item.name,
				title: item.name,
				level: level + 1,
				parent_id: item.name,
				is_open: false,
				is_selected: false,
				data: item,
				selectable: true,
				parent_id: folder_path,
				children: []
			})
		}
	}

	return nodes;
}

onMounted(async () => {
	const nodes = await openFolderPath(0, FOLDER_MEDIA_FILE);
	if (file_tree.value) {
		file_tree.value[0].children = nodes;
	}

	// Restore previously selected folder from localStorage
	try {
		const saved_path = localStorage.getItem(STORAGE_KEY_SELECTED_PATH);
		if (saved_path) {
			await restoreSelectedPath(saved_path);
		}
	} catch (e) { }
})

// Helpers
async function restoreSelectedPath(target_path) {
	// Validate target path
	if (!target_path || typeof target_path !== "string") {
		return;
	}

	// Ensure starts with root
	if (!target_path.startsWith(FOLDER_MEDIA_FILE)) {
		return;
	}

	const root = file_tree.value?.[0];
	if (!root) {
		return;
	}

	let current = root;
	current.is_open = true;
	const suffix = target_path.substring(FOLDER_MEDIA_FILE.length);
	const segments = suffix.split("/").filter(Boolean);
	for (const seg of segments) {
		
		// Ensure children are loaded for current node
		if (!current.children || current.children.length === 0) {
			const children = await openFolderPath(current.level, current.data.relative_path);
			current.children = children;
		}

		const next = current.children.find(c => c?.data?.name === seg);
		if (!next) {
			// Path segment not found; stop restoring
			break;
		}

		// Open this node and continue deeper
		next.is_open = true;
		current = next;
	}

	// Mark final node as selected if path matched
	if (current && current.data?.relative_path === target_path) {
		current.is_selected = true
		current.is_activated = true
		// current.is_open=false;
		selected_node.value = current;
		await openSelectedFolder();
	}
}

</script>

<style lang="less">
.la-file-browser-tree {
	.folder-icon {
		cursor: pointer;
	}

	.advanced-tree {
		max-height: 600px;
		overflow: scroll;
	}

}
</style>
