<script lang="ts">
  import { refreshing } from "$lib/refreshing";
  import { msg } from "$lib/resources/msg";
  import NetworkSelect from "$lib/network/components/NetworkSelect.svelte";
  import WalletWidget from "$lib/wallet/components/WalletWidget.svelte";
  import { client } from "$lib/network/stores";
  import { signer } from "$lib/wallet/stores";
  import { TxStep, broadcastTx, simulate } from "$lib/helpers/transaction";
  import { writable } from "svelte/store";
  import type { EncodeObject } from "@cosmjs/proto-signing";

  const status = writable<TxStep>(TxStep.None);

  let input: HTMLInputElement;
  const msgs = refreshing<EncodeObject[]>(
    async () => {
      const s = await $signer;
      if (!s) throw new Error("No signer connected");
      const msgs = [
        msg.bank.msgSend({
          fromAddress: s.account().address,
          toAddress: "kujira17xpfvakm2amg962yls6f84z3kell8c5lp3pcxh",
          amount: [{ denom: "ukuji", amount: input.value }],
        }),
      ];
      return msgs;
    },
    { refreshOn: [signer] }
  );

  const txSim = refreshing(
    async () => {
      const s = await $signer;
      const c = await $client;
      const m = await $msgs;
      status.set(TxStep.None);
      if (!s) throw new Error("No signer connected");
      return await simulate(c.client, s.account(), m, "", status);
    },
    { refreshOn: [msgs], debounce: 300 }
  );

  async function submitTx() {
    const s = await $signer;
    const c = await $client;
    if (!s) throw new Error("No signer connected");
    const sim = await $txSim;
    const m = await $msgs;
    return await broadcastTx(c.client, s, sim, m, "", status);
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
  <h3 class="text-xl">Example Transaction</h3>
  <div class="flex flex-col items-start">
    <p>Amount of ukuji to send:</p>
    <input
      type="text"
      class="p-2 border border-gray-200 rounded-lg"
      value="1"
      bind:this={input}
      on:input={() => {
        msgs.reload();
      }}
    />
    <div><p>Transaction Status: {$status}</p></div>
    <pre>
      {#await $msgs then m}
        {JSON.stringify(m, null, 2)}
      {/await}
    </pre>
    {#await $txSim}
      <p>Loading...</p>
    {:then sim}
      <p>{sim.gasInfo?.gasUsed} gas estimated</p>
      <button
        class="bg-gray-200 rounded-lg hover:bg-gray-300 transition-all p-4"
        on:click={submitTx}
      >
        Execute (Sends ukuji to distribution address)
      </button>
    {:catch error}
      <p>Error: {error.message}</p>
    {/await}
  </div>
</div>
