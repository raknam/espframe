# UI & Screens

The UI uses separate LVGL pages for each screen, navigated via `lvgl.page.show`. The first page in the merged config (`loading_page`) is shown at startup.

## Loading Page

Defined in `addon/screen_loading.yaml`.

"Starting up" label and a progress bar. Shown at boot; the system transitions away once WiFi connects or the 10s grace period expires.

## WiFi Setup Page

Defined in `addon/screen_wifi_setup.yaml`.

WiFi icon and instructions to connect to the captive portal hotspot. Shown via `lvgl.page.show: wifi_setup_page` when WiFi disconnects after the boot grace period.

## Slideshow Page

Defined in `addon/screen_slideshow.yaml`. The main photo display, shown via `lvgl.page.show: slideshow_page` when WiFi connects.

- **`slideshow_img`** — Full-screen LVGL image widget displaying the active slot's image. Zoom level is applied per-slot via `lv_img_set_zoom`. Hidden when a portrait pair is active.
- **`portrait_pair_container`** — Hidden by default. A 1280×800 flex ROW container with two 640×800 child objects, each containing an image widget (`portrait_left_img`, `portrait_right_img`). Shown when a portrait pair is displayed; supports the same touch gestures as `slideshow_img`. Each portrait image is resized to 640×1200 and centred within its half.
- **`info_overlay`** — Transparent container anchored to bottom-left (no background bar). Tap image to toggle visibility. Uses a flex ROW layout with the clock on the left and metadata stacked vertically to its right.
  - **`time_label`** — Current time (HH:MM) in Roboto Light 150px, updated every 60s via SNTP.
  - **`time_ago_label`** — Relative photo age ("3 years ago") in Roboto Light 46px.
  - **`location_label`** — Photo location (city, country) in Roboto Light 32px.
  - Each label has a paired `*_shadow` label rendered behind it (same text, black at 50% opacity, offset 2px right and 2px down) for readability over photos.

## Touch Gestures

| Gesture | Threshold | Action |
|---|---|---|
| Swipe left | dx < -80px | Advance to next image |
| Swipe right | dx > 80px | Show previous image |
| Tap | \|dx\| <= 80px | Toggle info overlay |
| Long press | — | Advance to next image |

Both `slideshow_img` and `portrait_pair_container` handle these gestures identically.

## Adding a New Screen

To add a screen, create a single `addon/screen_*.yaml` file and add one `!include` line to `packages.yaml`. No existing files need modification.

The new file defines its own LVGL page plus any screen-specific globals and scripts:

```yaml
# addon/screen_settings.yaml
lvgl:
  pages:
    - id: settings_page
      bg_color: 0x000000
      scrollable: false
      widgets:
        # ... screen widgets

globals:
  - id: my_screen_state
    type: int
    initial_value: '0'

script:
  - id: my_screen_script
    then:
      # ...
```

Then register it in `packages.yaml`:

```yaml
  screen_settings: !include addon/screen_settings.yaml
```

Navigate to the screen from any file using `lvgl.page.show: settings_page`. Shared resources (fonts, icons, time, accent color) are referenced by their global IDs across files.
