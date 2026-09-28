# Image assets

How visual artwork is stored and used. Nothing here is final art yet: until the rendered
glass panels and landscapes exist, sections use the CSS lighting in `components/visual/Ambient.tsx`.
Sections must look complete without artwork, so swapping art in later never changes layout.

## Folders

| Path | Contents |
| --- | --- |
| `scenes/` | Full-bleed backgrounds (landscape, horizon, rendered glass panels) used with `<SceneImage/>` |
| `work/` | Portfolio project previews |
| `og/` | Open Graph / social cards (1200x630) |

## Naming

`{section}-{subject}-{theme}.webp`, for example `hero-panels-light.webp`, `hero-panels-dark.webp`.
Every scene ships a light and a dark variant. Same composition, same crop, different lighting.

## Formats and sizes

- WebP (AVIF optional later). Photos and renders only. Icons stay in `lucide-react`.
- Scenes: 2400px wide max, quality 78-82, target under 250 KB. Mobile crops come from
  `objectPosition` on `<SceneImage/>`; only export a separate mobile file if the crop needs
  a different composition (then add a `-m` variant and swap with a media query).
- Only the single LCP image on a page gets `priority`. Everything else lazy-loads.
- Always reserve space (a sized parent) so images cause no layout shift.
