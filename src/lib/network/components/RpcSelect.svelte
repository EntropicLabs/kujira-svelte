<script lang="ts">
  import { NETWORKS } from "$lib/resources/networks";
  import { createPopover, melt } from "@melt-ui/svelte";
  import { LockIcon, SatelliteDish } from "lucide-svelte";
  import { writable } from "svelte/store";
  import { fade } from "svelte/transition";
  import { client, savedNetwork, savedNetworkOptions } from "../stores";

  const open = writable(false);
  const {
    elements: { trigger, content },
  } = createPopover({ open, positioning: { placement: "right", flip: true } });

  let activeRpc = writable<string | undefined>(undefined);
  $: $client.then((c) => {
    activeRpc.set(c.getRpc());
  });
  $: activeRpc.set(
    $savedNetworkOptions[$savedNetwork.chainId]?.preferredRpc || undefined
  );

  $: pinned = !!$savedNetworkOptions[$savedNetwork.chainId]?.preferredRpc;
</script>

<div class="relative">
  <button
    class="button py-1.5 pr-1.5 text-xs w-full"
    use:melt={$trigger}
    aria-haspopup="true"
    aria-label="Change RPC"
  >
    <div
      class="flex flex-row space-x-1 overflow-hidden items-center justify-between"
    >
      <SatelliteDish class="w-4 h-4 ml-1.5" />
      <p class="flex-shrink truncate min-w-0 m">
        {#if $activeRpc}
          {@const url = new URL($activeRpc)}
          {@const display = url.hostname + (url.port ? ":" + url.port : "")}
          {display}
        {:else}
          Loading RPC...
        {/if}
      </p>
    </div>
  </button>
  <button
    class="absolute -right-2.5 -top-1.5 flex items-center justify-center mr-1.5 visible rounded-full bg-black p-1 z-40"
    class:hidden={!pinned}
    aria-label="Unpin RPC"
    on:click={(e) => {
      let networkOptions = $savedNetworkOptions;
      delete networkOptions[$savedNetwork.chainId];
      savedNetworkOptions.set(networkOptions);
      client.reload();
      e.stopPropagation();
    }}
  >
    <LockIcon class="w-3 h-3 text-gray-200" />
  </button>
</div>

{#if $open}
  <div
    use:melt={$content}
    class="content max-h-60 overflow-y-scroll"
    transition:fade={{ duration: 100 }}
  >
    <div class="flex flex-col items-stretch gap-1">
      {#each NETWORKS[$savedNetwork.chainId].rpcs as rpc}
        <button
          class="p-1.5 button text-xs text-bold space-x-1 justify-between overflow-hidden"
          class:active={$activeRpc === rpc}
          aria-label="Change RPC"
          on:click={() => {
            let chainId = $savedNetwork.chainId;
            savedNetworkOptions.set({
              ...$savedNetworkOptions,
              [chainId]: { preferredRpc: rpc },
            });
          }}
        >
          <p class="flex-shrink truncate min-w-0 m">
            {rpc}
          </p>
        </button>
      {/each}
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
    @apply z-30 rounded-lg bg-white p-3 pt-2 shadow-sm border border-gray-100 w-60;
  }
</style>
