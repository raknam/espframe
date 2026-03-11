# Getting Started

This project implements a standalone digital photo frame powered by [Immich](https://immich.app/), running on the Guition ESP32-P4 (JC8012P4A1) without Home Assistant. It uses [ESPHome](https://esphome.io/) for firmware configuration and deployment.

## Project Structure

```
guition-esp32-p4-jc8012p4a1/
├── esphome.yaml                # User entry point (substitutions, wifi, remote package ref)
├── packages.yaml               # Aggregates all local packages
├── device/
│   └── device.yaml             # Hardware config (display, touch, SoC, external components)
├── addon/
│   ├── lvgl_base.yaml          # Shared LVGL config (buffer, displays)
│   ├── connectivity.yaml       # WiFi, captive portal, HTTP client
│   ├── immich_config.yaml      # Runtime-configurable Immich URL and API key
│   ├── backlight.yaml          # Display backlight light component
│   ├── screen_loading.yaml     # Loading screen (LVGL page + boot sequence)
│   ├── screen_wifi_setup.yaml  # WiFi setup screen (LVGL page)
│   ├── screen_slideshow.yaml   # Slideshow screen (LVGL page, ring buffer, API, scripts)
│   ├── accent_color.yaml       # Extract accent color from photo for letterbox fill
│   └── time.yaml               # SNTP clock and time label updates
├── assets/
│   ├── fonts.yaml              # Roboto font definitions (32/30/46/88/150pt)
│   └── icons.yaml              # MDI WiFi icon for setup screen
└── components/
    └── gsl3680/                # Custom touchscreen driver
components/
└── online_image/               # Patched online_image with header-based auth
```

Each screen is a self-contained YAML file that contributes an LVGL page, along with any screen-specific globals and scripts, to the merged config. ESPHome's `packages:` system deep-merges dictionaries and appends lists, so each file can independently define `lvgl: pages:`, `globals:`, `script:`, etc.

## User Setup

Create a minimal `esphome.yaml` that references the remote package:

```yaml
substitutions:
  name: "immich-frame-10inch"
  friendly_name: "Immich Frame 10inch"
  immich_base_url: "http://192.168.1.30:2283"
  immich_api_key: !secret immich_api_key

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

packages:
  immich_frame:
    url: https://github.com/jtenniswood/immich-frame
    files: [guition-esp32-p4-jc8012p4a1/packages.yaml]
    ref: main
    refresh: 1s
```

Then compile and flash with ESPHome as usual. On first boot, the device will connect to your WiFi network and start fetching random photos from your Immich server.
