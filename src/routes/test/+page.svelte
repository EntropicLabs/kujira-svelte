<script lang="ts">
  import { refreshing } from "$lib/refreshing";
  import { msg } from "$lib/rpc/msg";
  import { client, savedAdapter, savedNetwork, signer } from "$lib/stores";
  import NetworkSelect from "$lib/wallet/components/NetworkSelect.svelte";
  import WalletWidget from "$lib/wallet/components/WalletWidget.svelte";
  import { protoRegistry } from "$lib/wallet/utils";
  import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
  import { GasPrice, accountFromAny } from "@cosmjs/stargate";

  const balances = refreshing(
    async () => {
      const s = await $signer;
      const c = await $client;
      if (!s) throw new Error("No signer connected");
      return await c.client.bank.allBalances(s.account().address);
    },
    { refreshOn: [signer] }
  );

  const txSim = refreshing(
    async () => {
      const s = await $signer;
      const c = await $client;
      if (!s) throw new Error("No signer connected");
      const msgs = [
        msg.bank.msgSend({
          fromAddress: s.account().address,
          toAddress: "kujira17xpfvakm2amg962yls6f84z3kell8c5lp3pcxh",
          amount: [{ denom: "ukuji", amount: "1" }],
        }),
      ];
      const anyMsgs = msgs.map((m) => protoRegistry.encodeAsAny(m));
      const accountQuery = await c.client.auth.account(s.account().address);
      if (!accountQuery) throw new Error("Account not found");

      const account = accountFromAny(accountQuery);
      const simulation = await c.client.tx.simulate(
        anyMsgs,
        "",
        s.account().pubkey,
        account.sequence
      );
      return simulation;
    },
    { refreshOn: [signer] }
  );

  async function submitTx() {
    const s = await $signer;
    const c = await $client;
    if (!s) throw new Error("No signer connected");
    const sim = await $txSim;
    const msgs = [
      msg.bank.msgSend({
        fromAddress: s.account().address,
        toAddress: "kujira17xpfvakm2amg962yls6f84z3kell8c5lp3pcxh",
        amount: [{ denom: "ukuji", amount: "1" }],
      }),
    ];
    const gasEstimate = parseInt(sim.gasInfo!.gasUsed.toString());
    const gas = Math.round(gasEstimate * 1.4);
    const bytes = await s.sign(
      c.client.getTmClient(),
      msgs,
      gas,
      GasPrice.fromString("0.00125ukuji")
    );
    const cwClient = await CosmWasmClient.create(c.client.getTmClient());
    const result = await cwClient.broadcastTx(bytes);
    console.log(result);
    return result;
  }
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
  {#await $balances}
    <p>Loading...</p>
  {:then coins}
    {#each coins as coin}
      <p>{coin.denom}: {coin.amount}</p>
    {/each}
  {:catch error}
    <p>Error: {error.message}</p>
  {/await}

  {#await $txSim}
    <p>Loading...</p>
  {:then sim}
    <button class="button" on:click={submitTx}>Execute</button>
  {:catch error}
    <p>Error: {error.message}</p>
  {/await}
</div>
