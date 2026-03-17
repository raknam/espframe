---
title: Configuration
description: Configure photo sources, slideshow intervals, clock overlay, backlight schedules, and Wi-Fi settings for your Immich Frame.
---

# Configuration

All settings can be changed at any time through the device's built-in web UI — no recompilation needed.

## Web UI Settings

Open `http://<device-ip>/` in your browser to access the settings page. Changes are saved to flash and persist across reboots.

### Immich Connection

| Setting | Description |
|---|---|
| **Immich URL** | Your Immich server address (e.g. `http://192.168.1.30:2283`). Do not include a trailing slash. |
| **Immich API Key** | Your Immich API key (masked in the UI for security) |

See [Creating an API Key](/api-key) for how to generate a key and which permissions to select.

### Photo Source

| Setting | Default | Description |
|---|---|---|
| **Source** | All Photos | Which photos to display (see options below) |
| **Album IDs** | *(empty)* | Comma-separated Immich album UUIDs (visible when Source is `Album`) |
| **Person IDs** | *(empty)* | Comma-separated Immich person UUIDs (visible when Source is `Person`) |

Available source options:

| Source | Description |
|---|---|
| **All Photos** | Random photos from your entire Immich library |
| **Favorites** | Only photos you've marked as favorites in Immich |
| **Album** | Photos from specific albums — paste one or more album UUIDs separated by commas |
| **Person** | Photos of specific people — paste one or more person UUIDs separated by commas |
| **Memories** | "On this day" photos from previous years, just like the Memories feature in the Immich app. Falls back to random photos on days with no memories. |

::: tip Finding UUIDs
To find an album or person UUID, open the album or person page in the Immich web UI. The UUID is the last segment of the URL — for example, `http://immich.local:2283/albums/a1b2c3d4-...` has the album UUID `a1b2c3d4-...`.
:::

Changes to photo source settings are applied automatically — the frame flushes its image cache and begins fetching from the new source within a few seconds.

### Frequency

| Setting | Default | Description |
|---|---|---|
| **Slideshow Interval** | 15 seconds | Time between photos (10 seconds – 10 minutes) |

### Screen Schedule

| Setting | Default | Description |
|---|---|---|
| **Enable Schedule** | Off | Toggle scheduled backlight on/off |
| **On Time** | 6:00 AM | Hour the backlight turns on |
| **Off Time** | 11:00 PM | Hour the backlight turns off |

When the schedule is active and the current time is outside the on/off window, the backlight turns off and photo downloads are paused to conserve bandwidth. Downloads resume automatically when the backlight turns back on.

### Screen Brightness

| Setting | Default | Description |
|---|---|---|
| **Daytime Brightness** | 100% | Brightness level during the day (10–100%) |
| **Nighttime Brightness** | 75% | Brightness level at night (10–100%) |

Brightness automatically adjusts based on sunrise and sunset times, which are calculated from the selected timezone. The current sunrise and sunset times are displayed below the brightness sliders.

### Clock

| Setting | Default | Description |
|---|---|---|
| **Show Clock** | On | Toggle the clock overlay on the slideshow screen |
| **Clock Format** | 24 Hour | `24 Hour` or `12 Hour` |
| **Timezone** | Europe/London | Select from a list of common timezones |

!!! note
    Changes to clock settings can take up to 10 seconds to apply to the screen.

### Firmware Updates

| Setting | Default | Description |
|---|---|---|
| **Auto Update** | On | Automatically check for and install firmware updates |
| **Update Frequency** | Daily | How often to check for updates: `Hourly`, `Daily`, or `Weekly` |

When auto update is enabled, the device periodically checks for new firmware and installs it automatically. You can always check for updates manually using the **Check for Update** button, regardless of the auto update setting.
