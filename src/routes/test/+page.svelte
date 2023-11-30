<script lang="ts">
  import { msg } from "$lib/rpc/msg";
  import { createQuery } from "$lib/rpc/query";
  import { client, wallet } from "$lib/stores";
  import { createKujiraClient } from "$lib/types";
  import { isConnectedWallet, isLiveWallet } from "$lib/utils";
  import NetworkSelect from "$lib/wallet/NetworkSelect.svelte";
  import WalletWidget from "$lib/wallet/WalletWidget.svelte";
  import { get } from "svelte/store";

  const addr = createQuery(
    async () => {
      const w = get(wallet);
      if (!isConnectedWallet(w)) throw new Error("Live Wallet not connected");
      const c = get(client).client;
      return await c.bank.allBalances(w.account.address);
    },
    { refreshOn: [wallet, client] }
  );

  const txSim = createQuery(
    async () => {
      const w = get(wallet);
      if (!isLiveWallet(w)) throw new Error("Live Wallet not connected");
      const c = get(client).client;
      const msgs = msg.bank.msgSend({
        fromAddress: w.account.address,
        toAddress: "kujira17xpfvakm2amg962yls6f84z3kell8c5lp3pcxh",
        amount: [{ denom: "ukuji", amount: "1" }],
      });
      return await c.bank.allBalances(w.account.address);
    },
    { refreshOn: [wallet, client] }
  );
</script>

<div class="flex flex-col max-w-prose mx-auto text-left text-sm">
  <h1 class="text-4xl">Kujira-Svelte</h1>
  <h3 class="text-gray-500">
    Components and logic to assist with creating Frontends for Kujira-native
    applications.
  </h3>
  <h2 class="text-2xl font-bold">Components</h2>
  <h3 class="text-xl">NetworkSelect</h3>
  <p>A component to select the currently active network.</p>
  <div class="w-full flex items-center justify-center m-4">
    <NetworkSelect />
  </div>
  <h3 class="text-xl">WalletWidget</h3>
  <p>A component to allow the user to connect their wallet.</p>
  <div class="w-full flex items-center justify-center m-4">
    <WalletWidget />
  </div>
  {#await $addr}
    <p>Loading...</p>
  {:then coins}
    {#each coins as coin}
      <p>{coin.denom}: {coin.amount}</p>
    {/each}
  {:catch error}
    <p>Error: {error.message}</p>
  {/await}
</div>
