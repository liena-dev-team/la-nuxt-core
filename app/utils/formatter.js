
import spacetime from 'spacetime';

function getPriceFormatter() {
	return new Intl.NumberFormat('vi-VN', {
		style: 'currency',
		currency: 'VND',
		maximumFractionDigits: 0,
		currencyDisplay: 'code',
	})
}

export function formatPrice(price, omit_currency_sup = false) {
	if (!price || isNaN(price)) {
		return "";
	}

	const formatter = getPriceFormatter();
	price = formatter.format(price).replace("VND", "");
	price = price.replace(/\s+/g, '');
	price = price.trim();
	if (!omit_currency_sup) {
		price += "<sup>đ</sup>";
	}
	return price;
}

/**
 * Format a date
 * 
 * @param {String|Object} datetime 
 * @returns {String}
 */
export function formatDisplayDate(datetime) {
	if (!datetime) {
		return "";
	}

	const local_spacetime = spacetime(datetime);
	const formatted = local_spacetime.unixFmt('d/M/yyyy');
	return formatted;
}

/**
 * Format a date time
 * 
 * @param {String|Object} datetime 
 * @returns {String}
 */
export function formatDisplayDateTime(datetime) {
	if (!datetime) {
		return "";
	}
	
	const local_spacetime = spacetime(datetime);
	const formatted = local_spacetime.unixFmt('d/M/yyyy HH:mm:ss');
	return formatted;
}

/**
 * Format MySQL date
 * 
 * @param {String|Object} date 
 * @returns {String}
 */
export function formatMySQLDate(date) {
	const local_spacetime = spacetime(date);
	const formatted = local_spacetime.unixFmt('yyyy-MM-dd');
	return formatted;
}

/**
 * Format MySQL date time
 * 
 * @param {String|Object} datetime 
 * @returns {String}
 */
export function formatMySQLDateTime(datetime) {
	const local_spacetime = spacetime(datetime);
	const formatted = local_spacetime.unixFmt('yyyy-MM-dd HH:mm:ss');
	return formatted;
}

// // MySQL Formats
// export const FORMAT_MYSQL_DATE = 'yyyy-MM-dd';
// export const FORMAT_MYSQL_DATETIME = 'yyyy-MM-dd HH:mm:ss';
