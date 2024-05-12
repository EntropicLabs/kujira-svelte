<script lang="ts">
  import { createPopover, melt } from "@melt-ui/svelte";
  import { copy } from "svelte-copy";
  import { fade } from "svelte/transition";
  import autoAnimate from "@formkit/auto-animate";
  import { Copy, Search, Wallet2 } from "lucide-svelte";
  import { WALLETS, adapterToIWallet } from "$lib/wallet/adapters";
  import { MAINNET, NETWORKS } from "$lib/resources/networks";
  import { WalletAdapter, type Connectable } from "../adapters/types";
  import { SonarURI } from "../adapters/sonar";
  import IconSonar from "../icons/IconSonar.svelte";
  import QR from "./QR.svelte";
  import { client, savedNetwork } from "$lib/network/stores";
  import { savedAdapter, signer, signerResolved } from "../stores";
  import { refreshing } from "$lib/refreshing";
  import { Balance, Balances } from "../coin";
  import { get } from "svelte/store";
  import { PageRequest } from "cosmjs-types/cosmos/base/query/v1beta1/pagination";

  const {
    elements: { trigger: popoverTrigger, content: popoverContent },
    states: { open: popoverOpen },
  } = createPopover({
    forceVisible: true,
  });

  let installedWallets: Connectable[] = [];
  let uninstalledWallets: Connectable[] = [];
  WALLETS.map(async (adapter: WalletAdapter) => {
    const wallet = await adapterToIWallet(adapter);
    if (!wallet) return;
    if (await wallet.isInstalled()) {
      installedWallets.push(wallet);
    } else {
      uninstalledWallets.push(wallet);
    }
  });

  $: isConnected =
    $signerResolved?.getMetadata().adapter ??
    WalletAdapter.Disconnected !== WalletAdapter.Disconnected;

  function displayAddr(addr: string | undefined, len: number): string {
    if (!addr) return "";
    return addr.slice(0, len) + "..." + addr.slice(-len);
  }

  const balances = refreshing(
    async () => {
      const s = await get(signer);
      const c = await get(client);
      if (!s) return Balances.from([]);
      const coins = await c.bank.allBalances(
        s.account().address,
        PageRequest.fromPartial({ limit: BigInt(200) })
      );
      const balances = coins
        .map((coin) => Balance.from(coin))
        .sort((a, b) => b.normalized().minus(a.normalized()).toNumber());
      return Balances.from(balances);
    },
    { refreshOn: [signer, client] }
  );
</script>

{#if $SonarURI}
  <QR
    uri={$SonarURI}
    rounding={150}
    backgroundColor="#fff"
    cutout
    class="w-96 h-96"
  >
    <IconSonar class="object-contain w-full h-full" />
  </QR>
{/if}

<button
  type="button"
  class="p-1.5 w-fit text-xs button max-h-8"
  class:disconnect-cta={isConnected}
  use:melt={$popoverTrigger}
  aria-label={isConnected ? "Disconnect Wallet" : "Connect Wallet"}
  use:autoAnimate
>
  {#if isConnected}
    <svelte:component
      this={$signerResolved?.getMetadata().logo}
      class="w-4 h-4"
    />
    <p class="mx-2 hidden sm:inline">
      {displayAddr($signerResolved?.account().address, 6)}
    </p>
  {:else}
    <Wallet2 class="w-4 h-4" />
    <p class="mx-2">Connect Wallet</p>
  {/if}
</button>

{#if $popoverOpen}
  <div
    use:melt={$popoverContent}
    class="content"
    transition:fade={{ duration: 100 }}
  >
    <div class="flex flex-col gap-1" use:autoAnimate>
      {#if isConnected}
        <div class="flex flex-row items-center space-x-1 justify-between">
          <button
            class="text-xs text-bold space-x-1 p-1.5 button flex-grow justify-between"
            use:copy={$signerResolved?.account().address ?? ""}
          >
            <p class="flex-grow">
              {displayAddr($signerResolved?.account().address, 10)}
            </p>
            <Copy class="w-4 h-4" />
          </button>
          <a
            class="p-1.5 button"
            href="{NETWORKS[$savedNetwork.chainId ?? MAINNET]
              .explorer}/address/{$signerResolved?.account().address}"
            target="_blank"
          >
            <Search class="w-4 h-4" />
          </a>
        </div>
        {#await $balances}
          <p class="text-xs text-center">Loading balances...</p>
        {:then balances}
          {@const coins = balances.coins.filter((c) => c.known())}
          {#if coins.length === 0}
            <p class="text-xs text-center">No balances found</p>
          {:else}
            <div class="grid grid-cols-2 gap-1">
              {#each coins.slice(0, 5) as bal}
                <div class="col-start-1 col-end-1 text-right">
                  <p class="text-xs">{bal.humanAmount()}</p>
                </div>
                <div class="col-start-2 col-end-2">
                  <p class="text-xs">{bal.name}</p>
                </div>
              {/each}
            </div>
            {#if coins.slice(5).length > 0}
              <p class="text-xs text-center">
                + {coins.slice(5).length} more
              </p>
            {/if}
          {/if}
        {:catch}
          <p class="text-xs text-center">Failed to load balances</p>
        {/await}
        <button
          class="wallet-option button active"
          title="Disconnect Wallet"
          on:click={() => savedAdapter.set(WalletAdapter.Disconnected)}
        >
          <svelte:component
            this={$signerResolved?.getMetadata().logo}
            class="w-6 h-6"
          />
          <p class="ml-1.5 text-sm">Disconnect</p>
        </button>
      {:else}
        <h2 class="text-lg font-semibold">Choose Wallet</h2>
        <div class="flex flex-col space-y-2">
          <div class="flex flex-col space-y-2">
            {#each installedWallets as { metadata: { name, logo, adapter: type }, connect } (type)}
              <button
                class="wallet-option button"
                class:active={$savedAdapter === type}
                title="Connect with {name}"
                on:click={() =>
                  connect($savedNetwork.chainId ?? MAINNET).then((w) =>
                    savedAdapter.set(type)
                  )}
              >
                <svelte:component this={logo} class="w-6 h-6" />
                <p class="ml-1.5 text-sm">{name}</p>
              </button>
            {/each}
          </div>
          {#if uninstalledWallets.length > 0}
            <h3 class="text-sm text-gray-500 !-mb-2">Undetected Wallets</h3>
          {/if}
          {#each uninstalledWallets as { metadata: { name, logo, adapter: type } } (type)}
            <button
              class="wallet-option button"
              class:active={$savedAdapter === type}
              disabled
              title="{name} not detected"
            >
              <svelte:component this={logo} class="w-6 h-6" />
              <p class="ml-1.5 text-sm">{name}</p>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style lang="postcss">
  .disconnect-cta {
    @apply border border-gray-200;
  }
  .content {
    @apply z-10 w-60 rounded-lg bg-white p-3 pt-2 shadow-sm border border-gray-200;
  }
  .button {
    @apply rounded-lg border border-gray-200 flex flex-row items-center transition-colors;
    @apply hover:bg-gray-200;
  }
  .wallet-option {
    @apply p-2 justify-center;
  }
  .active {
    @apply border-blue-500;
  }
  .wallet-option:disabled {
    @apply opacity-50 bg-zinc-700;
  }
</style>
