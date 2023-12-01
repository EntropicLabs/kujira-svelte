<script lang="ts">
  import { ChevronDown } from "lucide-svelte";
  import { NETWORKS } from "$lib/resources/networks";
  import { createPopover, melt } from "@melt-ui/svelte";
  import { fade } from "svelte/transition";
  import { writable } from "svelte/store";
  import RpcSelect from "./RpcSelect.svelte";
  import { client, savedNetwork } from "../stores";

  const open = writable(false);
  const {
    elements: { trigger, content },
  } = createPopover({ open });

  $: networkMeta = $savedNetwork && NETWORKS[$savedNetwork.chainId];
  let networks = Object.values(NETWORKS).sort((a, b) =>
    a === b ? 0 : a.prod ? -1 : 1
  );
</script>

{#if networkMeta}
  <button
    class="p-1.5 button text-xs text-bold space-x-1 overflow-auto w-fit"
    use:melt={$trigger}
    aria-haspopup="true"
    aria-label="Change Network"
  >
    <svelte:component this={networkMeta.icon} class="w-4 h-4" />
    <p class="overflow-hidden overflow-ellipsis whitespace-nowrap flex-shrink">
      {networkMeta.name}
      <span class="text-gray-400">({networkMeta.chainId})</span>
    </p>
    <ChevronDown class="w-4 h-4" />
  </button>
{/if}

{#if $open}
  <div use:melt={$content} class="content" transition:fade={{ duration: 100 }}>
    <div class="flex flex-col items-stretch gap-1">
      {#each networks as meta}
        <button
          class="p-1.5 button text-xs text-bold space-x-1 justify-between"
          class:active={$savedNetwork.chainId === meta.chainId}
          aria-label="Change Network"
          on:click={() => {
            $savedNetwork = { chainId: meta.chainId };
          }}
        >
          <div class="flex flex-row space-x-1">
            <svelte:component this={meta.icon} class="w-4 h-4" />
            <p>
              {meta.name}
            </p>
          </div>
          <span class="text-gray-400">({meta.chainId})</span>
        </button>
      {/each}
      <hr class="border-gray-100 mt-2 mb-0.5" />
      <RpcSelect />
      {#await $client catch e}
        <p class="text-red-400 text-xs">
          {e.message}
        </p>
      {/await}
    </div>
  </div>
{/if}

<style lang="postcss">
  .button {
    @apply rounded-lg border border-gray-200 flex flex-row items-center transition-colors;
    @apply hover:bg-gray-200;
  }
  .active {
    @apply border-blue-500;
  }
  .content {
    @apply z-20 rounded-lg bg-white p-3 pt-2 shadow-sm border border-gray-100 w-60;
  }
</style>
