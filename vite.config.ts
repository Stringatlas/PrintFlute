import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

/** Chrome DevTools and IDE browsers probe these CDP paths; they are not app routes. */
function ignoreChromeDevtoolsProbes(): Plugin {
	const probePaths = new Set(['/json', '/json/list', '/json/version']);
	const faviconAliases = new Set(['/favicon.ico', '/favicon.png']);
	return {
		name: 'ignore-chrome-devtools-probes',
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				const incoming = req as { url?: string };
				const path = incoming.url?.split('?')[0];
				if (path && probePaths.has(path)) {
					res.statusCode = 204;
					res.end();
					return;
				}
				if (path && faviconAliases.has(path)) {
					incoming.url = '/pwa-192x192.png';
				}
				next();
			});
		}
	};
}

export default defineConfig({
	plugins: [
		ignoreChromeDevtoolsProbes(),
		sveltekit(),
		tailwindcss(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'Print Flute',
				short_name: 'PrintFlute',
				description: 'Design 3D-printable flutes, generate STL files, and analyze pitch',
				theme_color: '#030712',
				background_color: '#030712',
				display: 'standalone',
				scope: '/',
				start_url: '/',
				icons: [
					{
						src: '/pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: '/pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png'
					},
					{
						src: '/pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}']
			},
			devOptions: {
				enabled: true,
				type: 'module',
				navigateFallback: '/'
			}
		})
	]
});
