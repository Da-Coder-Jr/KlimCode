import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			out: 'build',
			precompress: true,
			envPrefix: 'KLIMCODE_'
		}),
		alias: {
			$components: 'src/lib/components',
			$server: 'src/lib/server',
			$stores: 'src/lib/stores',
			$utils: 'src/lib/utils',
			$types: 'src/lib/types'
		},
		csrf: {
			checkOrigin: true
		}
	}
};

export default config;
