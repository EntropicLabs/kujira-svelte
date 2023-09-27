import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
	plugins: [sveltekit(), nodePolyfills({ include: ['crypto', 'stream'] }), visualizer()],
});
