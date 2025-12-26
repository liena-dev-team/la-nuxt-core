
import spacetime from 'spacetime';

export function dateTimeConvertUtcToLocal(utc_js_datetime) {
	let s = spacetime(utc_js_datetime, "UTC" );
	s = s.goto(null); // Current Timezone from browser, or computer
	return s;
}
