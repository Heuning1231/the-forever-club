# The Forever Club · A Universe of Us

An interactive graduation keepsake for KAHEAN, Líng Lëé, Jia Qi, and yimin_04.
The visitor journey starts at the royal ticket printer and opens into a
single-screen map of the seven experiences. Golden starlight, revealed secrets,
the selected identity, and personal pact seals are stored on the current device.
Every destination, including the finale, is available as soon as the map opens.

## Local preview

From the checkout, run `python3 -m http.server 8080` and open the site on
port 8080. The site uses native JavaScript modules and relative URLs. It has
no build step, dependencies, account system, or paid services.
The production address is https://the-forever-club.pages.dev/.

## Content files

- `config.json` holds the four members, blessings, finale text, and Future Time
  Capsule content. The January 1, 2030 date is provisional. The countdown is
  a presentation feature and the static letter content is publicly readable.
- `letters.json` holds Kahean's provisional shared letter and a separate empty
  paragraph field for each of the three recipients.
- `config.json` → `ticketArtwork` accepts a local image path for the original
  graduation ticket. Leave it empty to display the labelled temporary artwork.
  The image is displayed at its original aspect ratio.
- `media.json` retains the original manifest schema and interleaves photos and
  videos in Memory Waterfall without assigning categories. Add original files
  under a static path, set their `src` and optional `thumb` or `poster` paths,
  and clear `isPlaceholder`. Keep each deployed file below 24 MiB.

The original graduation ticket artwork was unavailable. Every photo slot
`fc-p00`–`fc-p36` has an empty `src` and `thumb`, and every video slot
`fc-v00`–`fc-v40` has an empty `src` and `poster`. Original filenames are
unknown. The site displays labelled placeholder plates and simulated reels for
these slots.
