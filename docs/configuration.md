# Configuration

## Substitutions

Substitutions provided by the user in `esphome.yaml`:

| Substitution | Example | Description |
|---|---|---|
| `name` | `immich-frame-10inch` | ESPHome device name |
| `friendly_name` | `Immich Frame 10inch` | Human-readable name |
| `immich_base_url` | `http://192.168.1.30:2283` | Immich server URL (used as initial default for runtime config) |
| `immich_api_key` | `!secret immich_api_key` | Immich API key (used as initial default for runtime config) |

## Secrets

Secrets in `secrets.yaml`:

| Secret | Description |
|---|---|
| `wifi_ssid` | WiFi network name |
| `wifi_password` | WiFi password |
| `immich_api_key` | Immich API key |

## Tunable Defaults

| Substitution | Default | Defined in | Description |
|---|---|---|---|
| `package_ref` | `main` | `device/device.yaml` | Git ref for external components (must match `ref:` in user's packages config) |
| `immich_slide_interval_seconds` | `15` | `addon/screen_slideshow.yaml` | Default slideshow interval in seconds (runtime-adjustable via HA) |
| `immich_verify_ssl` | `false` | `addon/connectivity.yaml` | TLS certificate verification |

## Runtime Configuration

The Immich URL and API key are **runtime-configurable** via the built-in web server UI at `http://<device-ip>/`. They are defined as ESPHome `text` (template) components in `addon/immich_config.yaml`:

| Component ID | Name | Mode | Description |
|---|---|---|---|
| `immich_url` | Immich URL | `text` | Immich server base URL (e.g. `http://192.168.1.30:2283`) |
| `immich_api_key_text` | Immich API Key | `password` | Immich API key (masked in web UI) |

Both use `restore_value: true` to persist values in NVS flash across reboots. The `initial_value` for each is sourced from the corresponding compile-time substitution (`immich_base_url` / `immich_api_key`), so existing users get their configured values as defaults on first boot. After that, any changes made via the web UI take precedence.

All API calls and image downloads reference these text components at runtime via `!lambda` expressions (e.g. `id(immich_url).state`), rather than using compile-time substitutions directly.
