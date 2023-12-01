<script lang="ts">
  import NetworkSelect from "$lib/network/components/NetworkSelect.svelte";
  import WalletWidget from "$lib/wallet/components/WalletWidget.svelte";
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
  <p>An example transaction:</p>
  <a
    href="https://github.com/EntropicLabs/kujira-svelte"
    class="font-medium text-blue-600 dark:text-blue-500 hover:underline"
    target="_blank"
  >
    View on Github
  </a>
</div>
