# The Forever Club (2022–2026)

> **Four Girls. One Universe. Infinite Memories.**  
> Members: Kahean (`FC–001`), Líng Lëé (`FC–002`), Jia Qi (`FC–003`), yimin_04 (`FC–004`).

## Features Implemented
- **Scene 00 — Royal Admission Printer**: 3D pearlescent & champagne-gold chassis, glass display, progressive ticket extrusion, swipe-up/click collect, Skip Intro, Web Audio SFX.
- **Scene 01 — Royal Invitation**: 3D layered envelope with animated wax seal & long-press secret.
- **Scene 02 & 03 — Identity Selection & Royal Membership Card**: Interactive pointer/touch-tilting holographic foil cards with PNG download.
- **Scene 04 — Memory Orbit**: 3D Z-layered Polaroids with foreground/background champagne-gold splines, touch parallax, and 6 Celestial Worlds.
- **Six Worlds**:
  1. *Memory Museum* + *Infinity Gallery* (3D curved depth corridor)
  2. *Chaos Archives* (*The Forever Times* vintage 3D page-turning magazine)
  3. *Memory Cinema* (velvet curtains, ticket stubs, on-demand video)
  4. *Royal Ballroom* (3D multi-ring Astrolabe Destiny Wheel with 4 non-repeating blessings + PNG export)
  5. *Friendship Challenge* (3D flipping oracle cards, scoring, memory reveal)
  6. *Secret Letters* (3 wax-sealed envelopes, typewriter reveal)
- **Additional Celestial Artifacts**: *The Memory Crystal* (interactive 3D faceted amethyst polyhedron), *The Time Capsule* (2030-01-01 example countdown + preview unlock), *Cinematic Memory Mode* (Ken Burns), 4 *Hidden Easter Eggs*, and *Final Constellation* with PNG keepsake export.

## GitHub Pages Deployment
All paths are relative (`./`) and `.nojekyll` is included. Push the contents of `the-forever-club/` directly to a GitHub repository and enable GitHub Pages.

## Local Preview
```bash
npx serve ./the-forever-club
```
Or with Python:
```bash
python -m http.server 8000 --directory ./the-forever-club
```

## V5 preview and media status

From the repository root, run `python3 -m http.server 8080`. The site uses native
JavaScript modules and relative URLs for static Cloudflare Pages hosting.
The production address is https://the-forever-club.pages.dev/.

The repository contains no original photo or video files. In `media.json`, every
photo slot from `fc-p00` through `fc-p36` has empty `src` and `thumb` fields.
Every video slot from `fc-v00` through `fc-v40` has empty `src` and `poster`
fields. These are the exact missing slots. The manifest contains placeholder
names, so original filenames and paths are unknown. Each slot renders a labelled
temporary plate or simulated reel.

The source manifest schema remains compatible with original media. When the
originals are supplied, set each file path and clear its `isPlaceholder` flag.
Keep each deployed file below 24 MiB. Review the configured draft letters,
unconfirmed story and quiz photo mappings, and example capsule date in
`config.json` before the graduation release.
