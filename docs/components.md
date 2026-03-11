# Components

## External Components

- **`online_image`** (patched, from `components/online_image/`): Adds `request_headers` support so image fetches use `x-api-key` header auth instead of query-string keys. Includes `libjpeg-turbo-esp32` for hardware-accelerated JPEG decoding.
- **`gsl3680`** (from `guition-esp32-p4-jc8012p4a1/components/gsl3680/`): Custom touchscreen driver for the GSL3680 controller on this panel.

## Accent Color

The `extract_accent_color` script (in `addon/accent_color.yaml`) samples the displayed image and derives a dominant colour for letter-boxed areas, so they complement the photo instead of staying plain black.

### How It Works

1. The sampling logic is encapsulated in a reusable `fill_accent` lambda that operates on any `esphome::image::Image*`.
2. A 20×20 grid of pixels is sampled from the image's RGB565 buffer (read little-endian to match the display byte order), skipping letterbox padding by scanning inward from the edges for the first non-zero pixel.
3. Each pixel's saturation (max channel − min channel) is computed. The weight is `sat² + 1`, so vivid colours dominate while blacks, whites, and greys contribute minimally.
4. A weighted average produces the accent RGB. This is darkened to half intensity (`r/2, g/2, b/2`) so the background doesn't overpower the photo.
5. The darkened colour is written directly into the letterbox pixels of the raw image buffer.
6. For **portrait pairs**, `fill_accent` is called on both the left and right portrait images (or their preloaded equivalents), and the `portrait_pair_container` is invalidated. For **single images**, it is called on the active slot's image and `slideshow_img` is invalidated.

### LVGL Background Color Caveat

When setting an LVGL object's background colour from C/lambda code, you must set **both** the colour and the opacity. Setting only `lv_obj_set_style_bg_color` has no visible effect because the background opacity defaults to transparent. Always pair it with `lv_obj_set_style_bg_opa`:

```c
lv_obj_set_style_bg_color(id(slideshow_page)->obj, color, 0);
lv_obj_set_style_bg_opa(id(slideshow_page)->obj, LV_OPA_COVER, 0);
```

Also note that ESPHome's `LvPageType*` is not a raw LVGL object pointer — use `->obj` to get the underlying `_lv_obj_t*` that LVGL functions expect.
