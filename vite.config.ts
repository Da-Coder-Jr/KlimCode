import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 7700,
		host: '0.0.0.0'
	},
	preview: {
		port: 7700
	},
	optimizeDeps: {
		exclude: ['better-sqlite3']
	},
	build: {
		target: 'esnext',
		rollupOptions: {
			external: ['better-sqlite3']
		}
	}
});
