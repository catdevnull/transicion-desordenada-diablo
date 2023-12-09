<script lang="ts">
	import Container from '../lib/components/Container.svelte';
</script>

<main class="mx-auto prose dark:prose-invert">
	<Container>
		<div class="py-5 px-6">
			<h1>Archivo de portales de datos abiertos</h1>
			<p>
				Esta herramienta permite ver datos en archivos de portales de datos abiertos de <a
					href="https://github.com/catdevnull/transicion-desordenada-diablo/"
					rel="noopener">transicion-desordenada-diablo</a
				>
				(un mejor nombre sería genial), creada en el marco de
				<a href="https://bit.ly/CartaDatosAbiertos">un pedido hecho</a> al gobierno entrante el 10 de
				diciembre de 2023 por garantizar el mantenimiento de las políticas de datos públicos en Argentina.
			</p>

			<div class="not-prose flex place-content-center">
				<a
					href={`/dump/${encodeURIComponent('https://archivos.nulo.ar/dump-2023-12-08/')}`}
					class="flex items-center justify-center px-4 py-2 text-xl font-medium text-white transition-colors duration-200 bg-blue-600 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-700 focus:shadow-outline focus:outline-none text-center"
				>
					Acceder al archivo creado el 8 de diciembre de 2023
				</a>
			</div>

			<p>
				Los archivos y las herramientas fueron creados por
				<a href="https://nulo.ar">Nulo</a> con ayuda de varias personas. El código está disponible
				<a href="https://github.com/catdevnull/transicion-desordenada-diablo/" rel="noopener"
					>en GitHub</a
				>.
			</p>
		</div>
	</Container>
</main>
