
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as labsComponents from 'vuetify/labs/components'
import * as directives from "vuetify/directives";
import { aliases, mdi } from "vuetify/iconsets/mdi";

export default defineNuxtPlugin({
	parallel: true,
	async setup(nuxtApp) {
		const vuetify = createVuetify({
			ssr: true,
			components: {
				...components,
				...labsComponents,
			},
			directives,
			theme: {
				defaultTheme: "light",
			},
			icons: {
				defaultSet: "mdi",
				aliases,
				sets: {
					mdi,
				},
			},
		});

		nuxtApp.vueApp.use(vuetify);
	}
})
