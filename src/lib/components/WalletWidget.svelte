<script lang="ts">
  import { createPopover, melt } from "@melt-ui/svelte";
  import { copy } from "svelte-copy";
  import {
    client,
    persistedWallet,
    selectedNetwork,
    wallet,
  } from "$lib/stores";
  import { fade } from "svelte/transition";
  import { WalletAdapter, type Wallet } from "$lib/types";
  import autoAnimate from "@formkit/auto-animate";
  import { asyncDerived } from "@square/svelte-store";
  import { DENOMS } from "$lib/resources/denoms";
  import { Copy, Search, Wallet2 } from "lucide-svelte";
  import { WALLETS } from "$lib/adapters";
  import { NETWORKS } from "$lib/resources/networks";
  import { getNativeBalances } from "cosmes/client";

  const {
    elements: { trigger: popoverTrigger, content: popoverContent },
    states: { open: popoverOpen },
  } = createPopover({
    forceVisible: true,
  });

  let installedWallets: Wallet[] = [];
  let uninstalledWallets: Wallet[] = [];
  WALLETS.map(async (wallet: Wallet) => {
    if (await wallet.isInstalled()) {
      installedWallets.push(wallet);
    } else {
      uninstalledWallets.push(wallet);
    }
  });

  $: isConnected =
    $wallet && $wallet.getMetadata().adapter !== WalletAdapter.Disconnected;

  $: displayAddr6 =
    $wallet?.account &&
    $wallet.account.address.slice(0, 6) +
      "..." +
      $wallet.account.address.slice(-6);
  $: displayAddr10 =
    $wallet?.account &&
    $wallet.account.address.slice(0, 10) +
      "..." +
      $wallet.account.address.slice(-10);

  const balances = asyncDerived(
    [client, wallet],
    async ([$client, $wallet]) => {
      if (!$client || !$wallet || !$wallet.account) return [];
      // const client = await createKujiraClient($client.client);
      // const balances = await client.bank.allBalances($wallet.account.address);
      const balances = await getNativeBalances($client.rpc, {
        address: $wallet.account.address,
      });
      return balances
        .map((coin) => {
          const meta = DENOMS[coin.denom] ?? { name: coin.denom, dec: 0 };
          return {
            ...meta,
            amount: parseInt(coin.amount) / Math.pow(10, meta.dec),
          };
        })
        .sort((a, b) => b.amount - a.amount);
    }
  );
</script>

<button
  type="button"
  class="p-1.5 w-fit text-xs button"
  class:connect-cta={!isConnected}
  class:disconnect-cta={isConnected}
  use:melt={$popoverTrigger}
  aria-label={isConnected ? "Disconnect Wallet" : "Connect Wallet"}
  use:autoAnimate
>
  {#if isConnected}
    <svelte:component
      this={$wallet && $wallet.getMetadata().logo}
      class="w-4 h-4"
    />
    <p class="ml-2">{displayAddr6}</p>
  {:else}
    <Wallet2 class="w-4 h-4" />
    <p class="ml-2">Connect Wallet</p>
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
            use:copy={$wallet?.account?.address ?? ""}
          >
            <p>{displayAddr10}</p>
            <Copy class="w-4 h-4" />
          </button>
          <a
            class="p-1.5 button"
            href="{NETWORKS[$selectedNetwork.chainId].explorer}/address/{$wallet
              ?.account?.address}"
            target="_blank"
          >
            <Search class="w-4 h-4" />
          </a>
        </div>
        {#await balances.load()}
          <p class="text-xs text-center">Loading balances...</p>
        {:then balances}
          {#if balances.length > 0}
            <div class="grid grid-cols-2 gap-1">
              {#each balances.slice(0, 5) as coin}
                <div class="col-start-1 col-end-1 text-right">
                  <p class="text-xs">{coin.amount.toFixed(2)}</p>
                </div>
                <div class="col-start-2 col-end-2">
                  <p class="text-xs">{coin.name}</p>
                </div>
              {/each}
            </div>
            {#if balances.slice(5).length > 0}
              <p class="text-xs text-center">
                + {balances.slice(5).length} more
              </p>
            {/if}
          {/if}
        {/await}
        <button
          class="wallet-option button active"
          title="Disconnect Wallet"
          on:click={() => wallet.set(null)}
        >
          <svelte:component
            this={$wallet && $wallet.getMetadata().logo}
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
                class:active={$persistedWallet === type}
                title="Connect with {name}"
                on:click={() =>
                  connect($selectedNetwork.chainId).then((w) => wallet.set(w))}
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
              class:active={$persistedWallet === type}
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
  .connect-cta {
  }
  .disconnect-cta {
    @apply border border-gray-200;
  }
  .content {
    @apply z-10 w-60 rounded-lg bg-white p-3 pt-2 shadow-sm border border-gray-100;
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
    @apply opacity-50 bg-gray-100;
  }
</style>
