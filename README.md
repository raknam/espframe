# espframe — raknam's custom build

This is a personal fork of [espframe](https://github.com/jtenniswood/espframe) by [@jtenniswood](https://github.com/jtenniswood), a digital photo frame firmware for Guition ESP32-P4 touchscreens displaying [Immich](https://immich.app/) photo libraries via ESPHome.

> **License notice:** The upstream repository carries no license. This fork exists for personal use. All intellectual property rights remain with the original author. If you want to use espframe, please refer to the [original project](https://github.com/jtenniswood/espframe).

## What's different in this fork

- French date format in the clock overlay (1er Janv. 2025, etc.)
- Web UI embedded directly in the firmware (no external dependency on the author's GitHub Pages)
- Removed "Buy Me a Coffee" button from the web UI

## Hardware

| Device | Display |
|--------|---------|
| Guition ESP32-P4 `JC8012P4A1` | 10" |
| Guition ESP32-P4 `JC1060P470` | 7" |

## Local build

```bash
docker run --rm -v "${PWD}:/config" ghcr.io/esphome/esphome:2026.4.2 compile /config/builds/guition-esp32-p4-jc8012p4a1.factory.yaml
```

See the [original project documentation](https://github.com/jtenniswood/espframe) for full setup and configuration instructions.
