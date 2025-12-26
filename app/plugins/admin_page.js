
export default defineNuxtPlugin({
	parallel: true,
	async setup(nuxtApp) {
		// the next plugin will be executed immediately
		// console.log("plugin: admin_page");

		class AdminPage {
			async filter(filter_request) {
				return await useApiFetch(
					"/admin/page/filter", {
					method: HTTP_METHOD.POST,
					body: {
						pagination: filter_request.pagination,
						filters: filter_request.filters,
						sorts: filter_request.sorts
					}
				});
			}

			async getByClass(page_class) {
				return await useApiFetch("/admin/page/class?page_class=" + page_class, {
					method: HTTP_METHOD.GET,
				});
			}

			async getLayout(page_class) {
				return await useApiFetch("/admin/page/layout?page_class=" + page_class, {
					method: HTTP_METHOD.GET,
				});
			}
			
			async filterPagePermissions(filter_request) {
				return await useApiFetch(
					"/admin/page/permission/filter", {
					method: HTTP_METHOD.POST,
					body: {
						pagination: filter_request.pagination,
						filters: filter_request.filters,
						sorts: filter_request.sorts
					}
				});
			}

			async populatePermissions(role_id) {
				return await useApiFetch("/admin/page/permission/populate/" + role_id, {
					method: HTTP_METHOD.POST,
				});
			}

			async resetPermission(permission_id) {
				return await useApiFetch("/admin/page/permission/reset/" + permission_id, {
					method: HTTP_METHOD.POST,
				});
			}
		}

		const admin_page = new AdminPage();

		return {
			provide: {
				admin_page: admin_page,
			},
		};
	}
});
