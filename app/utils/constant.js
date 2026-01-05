
export const ENVIRONMENT = {
	DEV: "dev",
	TEST: "test",
	LIVE: "live",
};

export const ENVIRONMENT_OPTIONS = [
	{
		title: "DEV",
		value: ENVIRONMENT.DEV,
		color: "blue"
	}, {
		title: "TEST",
		value: ENVIRONMENT.TEST,
		color: "green"
	}, {
		title: "LIVE",
		value: ENVIRONMENT.LIVE,
		color: "red"
	}
];

// HTTP Request Method
export const HTTP_METHOD = {
	GET: "GET",
	POST: "POST",
	PUT: "PUT",
	DELETE: "DELETE",
};

// Input Type
export const FIELD_INPUT_TYPE = {
	STRING: "string",
	INT: "int",
	DECIMAL: "decimal",
	BOOL: "bool",
	DATE: "date",
	DATE_TIME: "date_time",
	SELECT: "select",
	MULTI_SELECT: "multi_select",
	TREE: "tree",
	TEXT_AREA: "text_area",
	RICH_EDITOR: "rich_editor",
	CODE_EDITOR: "code_editor",
	JSON: "json",
	MEDIA_FILE: "media_file",
	UPLOAD_FILE: "upload_file",
	ENCRYPTED: "encrypted",
	RATING_STAR: "rating_star",
	LOOKUP: "lookup",
	TAG: "tag"
};

// Input Type Label
export const FIELD_INPUT_TYPE_LABEL = {
	STRING: "String",
	INT: "Int",
	DECIMAL: "Decimal",
	BOOL: "Bool",
	DATE: "Date",
	DATE_TIME: "Date Time",
	SELECT: "Select",
	MULTI_SELECT: "Multi Select",
	TREE: "Tree",
	TEXT_AREA: "Text Area",
	RICH_EDITOR: "Rich Editor",
	CODE_EDITOR: "Code Editor",
	JSON: "Json",
	UPLOAD_FILE: "Upload File",
	ENCRYPTED: "Encrypted",
	RATING_STAR: "Rating Star",
	LOOKUP: "Lookup"
};

export function getInputTypeLabel(type) {
	switch (type) {
		case FIELD_INPUT_TYPE.STRING:
			return FIELD_INPUT_TYPE_LABEL.STRING;
		case FIELD_INPUT_TYPE.INT:
			return FIELD_INPUT_TYPE_LABEL.INT;
		case FIELD_INPUT_TYPE.DECIMAL:
			return FIELD_INPUT_TYPE_LABEL.DECIMAL;
		case FIELD_INPUT_TYPE.BOOL:
			return FIELD_INPUT_TYPE_LABEL.BOOL;
		case FIELD_INPUT_TYPE.DATE:
			return FIELD_INPUT_TYPE_LABEL.DATE;
		case FIELD_INPUT_TYPE.DATE_TIME:
			return FIELD_INPUT_TYPE_LABEL.DATE_TIME;
		case FIELD_INPUT_TYPE.SELECT:
			return FIELD_INPUT_TYPE_LABEL.SELECT;
		case FIELD_INPUT_TYPE.MULTI_SELECT:
			return FIELD_INPUT_TYPE_LABEL.MULTI_SELECT;
		case FIELD_INPUT_TYPE.TREE:
			return FIELD_INPUT_TYPE_LABEL.TREE;
		case FIELD_INPUT_TYPE.TEXT_AREA:
			return FIELD_INPUT_TYPE_LABEL.TEXT_AREA;
		case FIELD_INPUT_TYPE.RICH_EDITOR:
			return FIELD_INPUT_TYPE_LABEL.RICH_EDITOR;
		case FIELD_INPUT_TYPE.JSON:
			return FIELD_INPUT_TYPE_LABEL.JSON;
		case FIELD_INPUT_TYPE.UPLOAD_FILE:
			return FIELD_INPUT_TYPE_LABEL.UPLOAD_FILE;
		case FIELD_INPUT_TYPE.ENCRYPTED:
			return FIELD_INPUT_TYPE_LABEL.ENCRYPTED;
		case FIELD_INPUT_TYPE.LOOKUP:
			return FIELD_INPUT_TYPE_LABEL.LOOKUP;
		case FIELD_INPUT_TYPE.RATING_STAR:
			return FIELD_INPUT_TYPE_LABEL.RATING_STAR;
	}
}

export function getAllInputTypes(key_title = 'title', key_value = 'value') {
	let all = [];
	for (let i in FIELD_INPUT_TYPE) {
		let type = FIELD_INPUT_TYPE[i];
		let label = getInputTypeLabel(type);

		let data = {};
		data[key_title] = label;
		data[key_value] = type;

		all.push(data);
	}

	return all;
}

export const FIELD_SORT = {
	ASCENDING: "ASC",
	DESCENDING: "DESC",
};

// /**
//  * FIELD TREE
//  */
export const FIELD_TREE = {
	SELECT_TYPE_NONE: "none",
	SELECT_TYPE_LEAF: "leaf",
	SELECT_TYPE_SINGLE_LEAF: "single-leaf",
	SELECT_TYPE_INDEPENDENT: "independent",
	SELECT_TYPE_SINGLE_INDEPENDENT: "single-independent",
	SELECT_TYPE_CLASSIC: "classic",
}

/**
 * FIELD CODE EDITOR
 */
export const FIELD_CODE_EDITOR = {
	LANGUAGE_JS: "javascript",
	LANGUAGE_JSON: "json",
	LANGUAGE_CSS: "css"
}

/**
 * PAGE LIST
 */
export const PAGE_LIST_HEADER_MENU_ITEM_TYPE = {
	ASC: "asc",
	DESC: "desc",
	CLEAR_SORT: "clear_sort",
	CLEAR_ALL_SORTS: "clear_all_sorts",
	FILTER: "filter",
	CLEAR_FILTER: "clear_filter",
};

export const PAGE_LIST_DROPDOWN_MENU_ITEM_TYPE = {
	VIEW: "view",
	EDIT: "edit",
	DELETE: "delete",
	SELECT_MORE: "select_more",
};

export const PAGE_LIST_HEADER_TYPE = {
	SELECT_BOX: "select_box",
	DROPDOWN_MENU: "dropdown_menu",
};

// Page Card
export const FORM_MODE = {
	VIEW: "view",
	EDIT: "edit",
};

export const CARD_SECTION_TYPE = {
	GROUP: "group",
	PART: "part",
};

export const CARD_SECTION_POSITION = {
	LEFT: "left",
	RIGHT: "right",
};

export const STRING_VALUES_SEPERATOR = "|";

// Cache Types
export const CACHE_TYPE = {
	STATIC: "static",
	CONFIG: "config"
};
