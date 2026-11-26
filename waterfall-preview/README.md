# Memory Waterfall visual prototype

Open `/waterfall-preview.html` through an HTTP server from the repository root.
The prototype requires WebGL 2. Drag to tilt the camera, tap a Polaroid to
inspect it, or pause the flow. The initial flow is paused when the browser
reports a reduced-motion preference.

The committed bundle contains Three.js, its post-processing passes, and the
prototype. It does not load dependencies from a CDN. Rebuild from the
repository root after editing the JavaScript or shaders:

```sh
npm --prefix waterfall-preview ci
npm --prefix waterfall-preview run build
```

The standalone page reads photos from the existing `media.json`. Empty slots
use explicitly labelled abstract artwork. No original files are modified.
