import { useRequestHeaders } from '#imports';

export const useApiFetch = async (url, opts) => {
	const headers = useRequestHeaders(['cookie'])

	try {
		const data = await $fetch("/api" + url, {
			// credentials: 'include',
			headers,
			...opts,
		}).catch((error) => {
			if (error.statusCode == 401 || error.message.includes('Unauthorized')) {
				return {
					result: false,
					errors: [{
						code: 401,
						msg: "Unauthorized"
					}]
				}
			}

			console.log("Fetch Catch Error:");
			console.log(error);
		});

		return data;
	} catch (e) {
		console.log("Fetch Error:");
		console.log(e);
	}

	return null;

};
