# Configuration

All settings can be changed at any time through the device's built-in web UI — no recompilation needed.

## Web UI Settings

Open `http://<device-ip>/` in your browser to access the settings page. Changes are saved to flash and persist across reboots.

### Immich Connection

| Setting | Description |
|---|---|
| **Immich URL** | Your Immich server address (e.g. `http://192.168.1.30:2283`) |
| **Immich API Key** | Your Immich API key (masked in the UI for security) |

#### Creating an API Key

In your Immich web UI, go to **Account Settings → API Keys → New API Key**.

Immich lets you scope API keys to specific permissions. Immich Frame only needs read access — it never modifies, deletes, or uploads anything in your library. Deselect all permissions first, then enable only the ones below.

**Required permissions:**

| Permission | Why |
|---|---|
| `asset.read` | Search for random photos and read metadata (date, location, EXIF) |
| `asset.view` | Download photo thumbnails for display |
| `person.read` | Show people's names on the photo overlay |

These three permissions are all the frame needs to function.

**Optional permissions for future features:**

If you'd like to future-proof your key for richer metadata display, you can also enable these read-only permissions:

| Permission | What it unlocks |
|---|---|
| `album.read` | Album names a photo belongs to |
| `tag.read` | Tags assigned to photos |
| `memory.read` | "On this day" memories and groupings |
| `map.read` | Additional GPS/map data beyond EXIF |

::: tip Principle of least privilege
You can always create a new API key later with additional permissions. Start with just the three required ones and expand if needed.
:::

### Slideshow

| Setting | Default | Description |
|---|---|---|
| **Slideshow Interval** | 15s | Time between photos (5–300 seconds) |

### Clock

| Setting | Default | Description |
|---|---|---|
| **Show Clock** | On | Toggle the clock overlay on the slideshow screen |
| **Clock Format** | 24 Hour | `24 Hour` or `12 Hour` |
| **Timezone** | Europe/London | Select from a list of common timezones |

## Compile-Time Options

These are set in your `esphome.yaml` as substitutions before flashing. Most users won't need to change these.

```yaml
substitutions:
  name: "immich-frame"
  friendly_name: "Immich Frame"
  # Optional: bake in defaults so you skip the setup screen
  immich_base_url: "http://192.168.1.30:2283"
  immich_api_key: !secret immich_api_key
```

| Substitution | Default | Description |
|---|---|---|
| `name` | — | ESPHome device name (used for hostname and AP name) |
| `friendly_name` | — | Human-readable name shown in the web UI |
| `immich_base_url` | *(empty)* | Pre-fill the Immich URL so the setup screen is skipped on first boot |
| `immich_api_key` | *(empty)* | Pre-fill the API key so the setup screen is skipped on first boot |
| `immich_slide_interval_seconds` | `15` | Default slideshow interval in seconds |
| `immich_verify_ssl` | `false` | Set to `true` to enforce TLS certificate verification (defaults to `false` for self-signed certs) |

## Secrets

Sensitive values go in `secrets.yaml` alongside your `esphome.yaml`:

```yaml
wifi_ssid: "YourWiFiName"
wifi_password: "YourWiFiPassword"
immich_api_key: "your-immich-api-key-here"
```

Reference them in `esphome.yaml` with `!secret`:

```yaml
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
```
