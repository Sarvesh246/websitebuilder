/**
 * Layered mountain ridgelines with a rim-lit top edge. Static SVG paths (a few hundred bytes),
 * theme-aware through --ridge-* tokens. Decorative: render inside an aria-hidden container.
 * Meant to be swapped for real artwork via <SceneImage/> in the visual-polish stage.
 */
export const Horizon = () => (
  <svg className="horizon" viewBox="0 0 1440 320" preserveAspectRatio="xMidYMax slice" aria-hidden focusable="false">
    <path
      className="horizon__far"
      d="M0 210 L120 165 L210 190 L330 118 L430 176 L540 140 L660 205 L790 128 L900 182 L1010 150 L1130 196 L1260 132 L1360 170 L1440 150 V320 H0Z"
    />
    <path
      className="horizon__mid"
      d="M0 250 L90 222 L190 246 L300 190 L410 238 L520 210 L640 252 L760 196 L880 240 L990 214 L1110 250 L1230 200 L1340 236 L1440 218 V320 H0Z"
    />
    <path
      className="horizon__near"
      d="M0 284 L140 262 L260 280 L390 252 L520 278 L660 258 L800 282 L940 260 L1080 280 L1210 258 L1330 276 L1440 264 V320 H0Z"
    />
  </svg>
);
