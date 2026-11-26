# The Forever Club · A Universe of Us

An interactive graduation keepsake for KAHEAN, Líng Lëé, Jia Qi, and yimin_04.
The visitor journey starts at the royal ticket printer and opens into a
single-screen map with four destinations.

- **Our Memories** is the 3D Memory Waterfall. Open any photo or video in the
  fullscreen viewer, and start or pause cinematic playback in that same viewer.
- **Royal Destiny** is the interactive fortune instrument.
- **Across the Stars** is the personalized graduation letter. Turn to its final
  page to read, seal, or download the Forever Pact.
- **Est. Forever** is the four-star constellation and graduation message.

Every destination is available as soon as the map opens. The selected identity,
discovered secrets, and personal pact seals stay on the current device.

## Local preview

From the checkout, run `python3 -m http.server 8080` and open the site on
port 8080. The site uses native JavaScript modules and relative URLs. It has
no build step, dependencies, account system, or paid services.
The production address is https://the-forever-club.pages.dev/.

## Content files

- `config.json` holds the four members, blessings, finale text, and ticket artwork setting.
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
