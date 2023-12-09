<script lang="ts">
	import SourceLink from '$lib/components/SourceLink.svelte';
	import Container from '$lib/components/Container.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<main class="mx-auto max-w-3xl">
	<Container>
		<header class="py-5 px-6 border-b border-b-gray-200 dark:border-b-gray-700 leading-none">
			<small>
				Viendo archivo en
				<a
					class="underline text-blue-500 dark:text-blue-300"
					target="_blank"
					rel="noopener"
					href={data.url}>{data.url}</a
				>
			</small>
		</header>

		<ul class="divide-y divide-gray-100 dark:divide-gray-700">
			{#each data.metadata.sites as site}
				{@const portalLink = `/dump/${data.dumpUrl}`}
				<li>
					<div class="flex px-6 py-5 justify-between gap-3">
						<div class="flex flex-col">
							<h3 class="text-lg">{site.title}</h3>
							<p class="text-sm">{site.description}</p>
						</div>
						<div class="flex flex-col items-center justify-center shrink-0">
							<a
								href={portalLink}
								class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium tracking-wide text-white transition-colors duration-200 bg-blue-600 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-700 focus:shadow-outline focus:outline-none"
								>Ver portal</a
							>
							<SourceLink href={site.url} />
						</div>
					</div>
				</li>
			{/each}
		</ul>
	</Container>
</main>
