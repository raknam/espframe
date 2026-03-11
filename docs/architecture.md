# Architecture

## 3-Slot Image Ring Buffer

Three `online_image` components (`immich_img_0`, `immich_img_1`, `immich_img_2`) form a circular buffer. At any time one slot is **active** (displayed), and the system prefetches into the next two slots. Each slot stores its own metadata (asset ID, image URL, date, location, year, month, person, is_portrait, datetime, companion_url, zoom).

When advancing forward, the active slot index moves `(active + 1) % 3`. If that slot is already prefetched, display is instant. Otherwise, a fresh API call fetches into it.

## Portrait Detection and Dual Display

When fetching an image, EXIF dimensions (`exifImageWidth`, `exifImageHeight`) and `orientation` are parsed to determine whether the photo is portrait. EXIF orientations 5–8 swap width and height before comparison. If `height > width`, the image is flagged as portrait.

When a portrait is displayed, the system searches Immich for a **companion portrait** taken on the same calendar day. If one is found, both portraits are downloaded at half-width (640×1200) and displayed **side-by-side** in a `portrait_pair_container`, filling the 1280×800 screen more effectively than a single letterboxed portrait.

The system uses four dedicated `online_image` components for portrait pairs:

- **`immich_portrait_left`** and **`immich_portrait_right`** — for the currently displayed pair.
- **`immich_portrait_preload_left`** and **`immich_portrait_preload_right`** — for prefetching the next portrait pair during the prefetch chain, enabling instant transitions.

If no companion is found or the companion download fails, the portrait falls back to single-image display in the standard slot.

## Landscape Zoom

For landscape images with aspect ratios between 1.6:1 and 2.0:1 (mildly panoramic), a zoom level is calculated to fill the 800px display height, slightly cropping the sides. The zoom value is stored per-slot as a `uint16_t` (256 = no zoom, higher = more zoom). LVGL's `lv_img_set_zoom` applies it at display time. Images wider than 2.0:1 are not zoomed (too panoramic to crop usefully).

## Previous Image Navigation

One previous image is stored separately (`immich_prev_*` globals, including zoom level). Swiping right swaps current and previous metadata, re-downloads the previous image URL into the newly active slot.
