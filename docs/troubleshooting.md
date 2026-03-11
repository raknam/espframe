# Troubleshooting

## Boot Sequence

1. **Priority -200:** Turn on backlight at 100%, set progress bar to 25%.
2. **Priority -100:** Set progress bar to 50%. Populate WiFi setup instructions with device name.
3. **WiFi connect:** Set progress bar to 100%, navigate to `slideshow_page`, start first image fetch.
4. **10s timeout:** End boot grace period. If still no WiFi, navigate to `wifi_setup_page`.

## Runtime Behavior and Guardrails

- **Advance debounce:** Timer skips if last advance was less than 10s ago.
- **In-flight guard:** All scripts use `mode: single` to prevent overlapping API calls.
- **Error retry:** Up to 3 retries with 2s delay on image decode failure, then gives up and resets counter.
- **WiFi disconnect:** Shows captive portal setup prompt (after boot grace period).
- **Slot readiness:** Forward advance blocks display until the slot's image has fully downloaded; current image remains on screen until then.
- **Portrait fallback:** If portrait companion search fails or either portrait image fails to decode, the system falls back to single-image display.
- **Portrait state reset:** On every advance (forward or backward), all portrait pair state is reset to prevent stale data.

## Common Issues

- **`HTTP 401 from Immich`**: API key invalid or lacks permission.
- **`No valid asset in response`**: Response shape changed, or no matching assets in Immich.
- **Image does not update but asset ID logs change**: Image endpoint auth issue, SSL failure, or JPEG decode error.
- **`Slot N decode failed`**: Image too large or corrupt. Will retry up to 3 times then skip.
- **WiFi setup screen appears**: Device lost WiFi. Connect to the captive portal hotspot shown on screen.
- **Timer says "skipped, last advance Xms ago"**: A manual swipe happened recently; timer will resume after the debounce window.
- **`Portrait left/right decode failed, falling back to single`**: One of the portrait pair images failed to download or decode. The system falls back to single-image display.
- **`No companion portrait found for this day`**: No other portrait photo exists on the same calendar day in Immich. The portrait is shown alone.

## Known Constraints

- Only one previous image is stored; you cannot swipe back more than once.
- `immich_verify_ssl: false` is convenient for self-signed cert setups but not ideal long-term.
- Standard landscape images are resized to 1280×960. Portrait images for pair display are resized to 640×1200 each.
- SNTP timezone is hardcoded to `Europe/London` in `addon/time.yaml`.
- Companion portrait search fetches up to 10 random same-day images and uses the first portrait match; it does not guarantee the best pairing.
- Images wider than 2.0:1 aspect ratio are not zoomed (displayed with letterboxing).

## Future Improvements

1. Make SNTP timezone configurable via substitution.
2. Add album/favorites/people/date-range filters to the `/search/random` request body.
3. Support deeper backward navigation history (ring buffer of previous URLs).
4. Add screen dimming schedule or ambient light sensor integration.
5. Smarter companion portrait matching (prefer similar location, people, or time-of-day).
6. Define shared LVGL `style_definitions` in `addon/lvgl_base.yaml` for consistent styling across screens.
7. Add page transition animations via `lvgl.page.show` options (`animation`, `time`).
