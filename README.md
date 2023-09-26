# kujira-svelte
A SvelteKit project template for Kujira apps.

## Getting started
This template can be cloned and used as a base for new Kujira app sites. We use [bun](https://bun.sh) as the package manager and runtime.

To run the site in development mode, run the following commands:
```bash
bun install # Install dependencies
bun --bun run dev # Run vite dev server in the bun runtime
```

## Notes
This template is a WIP and does not yet support most functionality, notably most transaction behaviors. Wallet connection functionality has also only been tested with Keplr.

The template uses SvelteKit with `export const ssr = false;`, as most apps will function largely as SPAs. This simplifies dealing with Svelte's stores as you do not need to deal with the "server-side" case.

We use [TailwindCSS](https://tailwindcss.com) for styling, and [MeltUI](https://www.melt-ui.com) component builders.