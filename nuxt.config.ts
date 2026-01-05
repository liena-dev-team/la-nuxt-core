// https://nuxt.com/docs/api/configuration/nuxt-config
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import pkg from './package.json'

export default defineNuxtConfig({
	compatibilityDate: '2025-01-06',
	devtools: { enabled: true },
	app: {
		pageTransition: { name: 'page', mode: 'out-in' }
	},
	css: [
		'vuetify/styles',
		'./assets/css/common.css'
	],
	build: {
		transpile: ['vuetify', '@vuepic/vue-datepicker'],
	},
	
	vite: {
		vue: {
			template: {
				transformAssetUrls,
			},
		},
	},
	plugins: [
		// './plugins/vuetify.js'
		{ src: '~/plugins/vuetify.js' },
		// { src: '~/plugins/draggable.js', mode: 'client' }
	],
	runtimeConfig: {
		public: {
			appVersion: pkg.version,
			environment: process.env.ENVIRONMENT || "",
			apiHost: process.env.API_HOST || "http://localhost:8000"
		}
	},
	nitro: {
		routeRules: {
			// Proxy this path to Api Server
			'/api/**': {
				proxy: {
					to: process.env.API_HOST + '/**'
				}
			},
			// Proxy this path to Api Server's Media folder
			'/media/**': {
				proxy: {
					to: process.env.API_HOST + '/media/**'
				}
			},
			'/export/**': {
				proxy: {
					to: process.env.API_HOST + '/export/**'
				}
			},
		}
	}
})
