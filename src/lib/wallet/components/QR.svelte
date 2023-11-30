<script lang="ts">
  import { VIEWPORT_SIZE, createPath, createQrCode, type ErrorCorrectionLevel } from "./QRutil";

  let clazz: string = "";
  export { clazz as class };
  export let color: string = "#000";
  export let backgroundColor: string;
  export let cutout: boolean = false;
  export let errorCorrectionLevel: ErrorCorrectionLevel = "Q";
  export let rounding: number = 0;
  export let uri: string;

  const qr = createQrCode(uri, errorCorrectionLevel, 1)!;
  const moduleCount = qr?.moduleCount ?? 1;
  const moduleSize = VIEWPORT_SIZE / (qr?.moduleCount ?? 1);
  const cutoutSize = moduleSize * (Math.floor(moduleCount * 0.18) * 2 - 1) + 2;
  const cutoutPosition = (VIEWPORT_SIZE - cutoutSize) / 2;
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {VIEWPORT_SIZE} {VIEWPORT_SIZE}"
  class={clazz}
>
  {#if cutout}
    <mask id="react-qr-rounded__mask">
      <rect
        x="0"
        y="0"
        width={VIEWPORT_SIZE}
        height={VIEWPORT_SIZE}
        fill="#fff"
      />
      <rect
        x={cutoutPosition}
        y={cutoutPosition}
        width={cutoutSize}
        height={cutoutSize}
        rx={rounding}
        ry={rounding}
        fill="#000"
      />
    </mask>
  {/if}
  {#if backgroundColor}
    <rect
      x="0"
      y="0"
      width={VIEWPORT_SIZE}
      height={VIEWPORT_SIZE}
      fill={backgroundColor}
    />
  {/if}
  <path
    fill={color}
    d={createPath(qr, rounding)}
    mask={cutout ? "url(#react-qr-rounded__mask)" : undefined}
  />
  <foreignObject
    x={cutoutPosition}
    y={cutoutPosition}
    width={cutoutSize}
    height={cutoutSize}
  >
    <div
      class="flex justify-center items-center h-full w-full overflow-hidden"
      style="border-radius: {rounding};"
    >
      <slot />
    </div>
  </foreignObject>
</svg>
