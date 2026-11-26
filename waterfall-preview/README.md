# Memory Waterfall

From the repository root, run `python3 -m http.server 8000 --bind 127.0.0.1` and open `/waterfall-preview.html`. The page runs from the checked-in bundle and reads the existing `media.json`. WebGL 2 enables the 3D scene. The fallback opens a selection of memories in the same viewer.

Drag to move the camera, or choose Cinematic for a slow automatic drift. Tap a print to open its photo or play its reel. Reduced-motion mode starts with the flow paused. The viewer stops the scene clock and releases video playback on close.

The cloud artwork and six neutral placeholder photos are generated images containing no club members. The silent sample reel animates one of those photos. When a manifest entry has a source, the viewer uses that source. The 3D prints prefer thumbnails and video posters. Ribbons use additive core and halo meshes with a scene-depth test. The cloud canyon is a textured background with camera parallax, and the prints use textured paper, shaded edges and distance fog.

To rebuild after editing the source, run `npm ci` and `npm run build` in `waterfall-preview/`. Three.js is bundled locally and its license is included.
