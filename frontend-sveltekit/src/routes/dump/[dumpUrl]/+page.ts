import { fetchDumpMetadata } from '$lib/fetch';

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
	const url = decodeURIComponent(params.dumpUrl);
	const metadata = await fetchDumpMetadata(url);
	return {
		dumpUrl: params.dumpUrl,
		url,
		metadata
	};
}
