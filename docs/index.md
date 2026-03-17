---
title: Immich Frame – ESP32 Digital Photo Frame
description: Standalone Immich-powered digital photo frame on ESP32-P4. No hub, cloud, or extra software required.
---

# Immich Frame

A standalone digital photo frame that displays your [Immich](https://immich.app/) photo library on a 10" touchscreen — no hub, cloud, or extra software required.

<img src="/immich-frame.png" alt="Immich Frame displaying photos on a 10-inch touchscreen" style="max-width: 700px; width: 100%; display: block; margin: 1.5rem auto;" />

Built with [ESPHome](https://esphome.io/) on the ESP32-P4, the frame connects directly to your Immich server over HTTP and streams photos to your display, completely in private over your local network.

**[Get Started →](/install)** · [GitHub](https://github.com/jtenniswood/espframe)

## Features

- **Photo Filtering** — Show all photos, favorites only, specific albums, specific people, or "on this day" memories from previous years.
- **Portrait Pairing** — Automatically pairs portrait photos taken on the same day for a side-by-side display that fills the screen edge-to-edge.
- **Accent Color Fill** — Replaces black letterbox bars with a muted color sampled from the photo itself.
- **Clock Overlay** — Displays the current time over your photos when enabled in settings.
- **Backlight Schedules** — Control brightness across day and night, with optional auto-off scheduling.
- **Slideshow** — Photos advance automatically with configurable intervals and background prefetching for instant transitions.
- **No Hub Required** — Connects directly to your Immich server over HTTP — no Home Assistant, cloud service, or extra software needed.

## Support This Project

If you find this project useful, consider buying me a coffee to support ongoing development!

<a href="https://www.buymeacoffee.com/jtenniswood">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="50" />
</a>
