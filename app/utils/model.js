
const DEFAULT_SORT_CODE = "id";
const DEFAULT_PAGINATION_PAGE = 1;
const DEFAULT_PAGINATION_SIZE = 50;

/**
 * Field
 */
export class Field {
	code = "";
	is_primary = false;
	is_auto_generated = false;
	backend = false;
	input_type = "";
	caption = "";
	value = "";
	default = null;
	editable = true;
	options = [];

	constructor(
		code,
		caption = "",
		input_type = ""
	) {
		this.code = code;
		this.caption = caption;
		this.input_type = input_type;
	}
}

export class FieldSort {
	field_code = DEFAULT_SORT_CODE;
	direction = "DESC";

	constructor(
		field_code = DEFAULT_SORT_CODE,
		direction = "DESC"
	) {
		this.field_code = field_code;
		this.direction = direction;
	}
}

export class Pagination {
	page = DEFAULT_PAGINATION_PAGE;
	size = DEFAULT_PAGINATION_SIZE;
	total = 0;
	skip = 0;
	last_page = 0;
	prev = false;
	next = false;

	constructor(
		page = DEFAULT_PAGINATION_PAGE,
		size = DEFAULT_PAGINATION_SIZE,
	) {
		this.page = page;
		this.size = size;
		
		this.skip = (this.page - 1) * this.size;
	}
	
	setTotal = function(total) {
		this.total = total;
		this.last_page = Math.ceil(this.total / this.size);
	}
	
	fromArray = function(array) {
		this.page = array.page;
		this.size = array.size;
		this.total = array.total;
		this.skip = array.skip;
		this.last_page = array.last_page;
		this.prev = array.prev;
		this.next = array.next
	}
}

export class Filter {

	field = null;
	expression = "";

	constructor(
		field, expression = ""
	) {
		this.field = field;
		this.expression = expression;
	}
}

export class FilterRequest {
	pagination = null;
	filters = [];
	sorts = [];

	constructor(
		pagination = new Pagination(),
		filters = [],
		sorts = []
	) {
		this.pagination = pagination;
		this.filters = filters;
		this.sorts = sorts;
	}

	toArray = function() {
		return {
			pagination: this.pagination,
			filters: this.filters,
			sorts: this.sorts
		}
	}
}

