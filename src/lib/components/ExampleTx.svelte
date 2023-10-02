<script lang="ts">
  import { msg } from "$lib/resources/msg";
  import { Tx } from "$lib/utils";
  import { writable } from "svelte/store";

  let address = "";
  let addressDebounced = writable("");
  let timeout: NodeJS.Timeout | null = null;
  $: {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      addressDebounced.set(address);
    }, 500);
  }

  const tx = new Tx(
    async (_, wallet, [addr]) => {
      if (addr == "") throw new Error("No address provided");
      const msgSend = msg.bank.msgSend({
        fromAddress: wallet.account.address,
        toAddress: addr,
        amount: [{ denom: "ukuji", amount: "1" }],
      });
      return {
        msgs: [msgSend],
      };
    },
    { extraStores: [addressDebounced] }
  );
  const simulation = tx.subscribeSimulate();
</script>

<div class="flex flex-col">
  <input type="text" bind:value={address} class="border" />

  <pre>{JSON.stringify($tx, null, 2)}</pre>
  <pre>{JSON.stringify($simulation?.fee, null, 2)}</pre>
  {#if $simulation?.fee}
    <button
      class="button"
      on:click={() => {
        tx.signAndBroadcast().then(console.log).catch(console.error);
      }}
    >
      Send
    </button>
  {/if}
</div>
