---
name: "Docs Review and Update"
overview: "Review all documentation against current device capabilities and update for accuracy, completeness, and consistency. Align setting names/defaults with the implementation; omit touch controls (likely to change)."
todos: []
isProject: false
---

# Documentation Review and Improvement Plan

## Current state

Docs are largely accurate and well-structured. The following gaps and fixes will bring them in line with the device and improve usability. Touch/interaction behavior is not documented here as it is likely to change.

---

## 1. Overview ([docs/index.md](docs/index.md))

**Add (optional):**

- **First-run flow** — One line: after boot, loading screen → if no WiFi then WiFi setup (hotspot `immich-frame-10inch`) → if no Immich URL/key then Immich setup (open device IP in browser) → slideshow. This matches the screen flow and [install.md](docs/install.md).

**No change:** Feature list (filtering, portrait pairing, accent fill, clock, backlight schedules, no hub) matches the addons and is correct.

---

## 2. Configuration ([docs/configuration.md](docs/configuration.md))

**Accuracy fixes:**

- **Screen Schedule** — Add a short note: “On Time” and “Off Time” are hour-of-day (e.g. 6 = 6:00 AM, 23 = 11:00 PM). Defaults (6 AM on, 11 PM off) are correct.
- **Slideshow Interval** — List the exact options: 10 s, 15 s, 20 s, 30 s, 45 s, 1 min, 2 min, 3 min, 5 min, 10 min (from [screen_slideshow.yaml](guition-esp32-p4-jc8012p4a1/device/screen_slideshow.yaml)).
- **Screen Tone** — Optional: add a note that in Home Assistant “Turn on until sunrise” appears as **Screen: Warm Tone Override**.

**Clarification:**

- **Screen Schedule** — When “Enable Schedule” is off, the backlight stays on and follows day/night brightness only. When schedule is on and outside the window, backlight turns off and downloads pause (already stated). Optional: one sentence that schedule only applies when “Enable Schedule” is on.

**Defaults check:** All listed defaults match the addons.

---

## 3. Screen Tone ([docs/screen-tone.md](docs/screen-tone.md))

- Add one sentence for HA users: “In Home Assistant, ‘Turn on until sunrise’ appears as **Screen: Warm Tone Override**.”

---

## 4. Photo Sources ([docs/photo-sources.md](docs/photo-sources.md))

- **Person** — If the current UI does not yet show people’s names on the overlay, soften the wording (e.g. “needed for Person source and for showing people’s names when supported”); otherwise leave as is.
- **Memories** — No change.

---

## 5. Install ([docs/install.md](docs/install.md))

- Optional: add that the **on-screen** WiFi setup page appears when the device boots without WiFi (captive-portal instructions).

---

## 6. Home Assistant ([docs/home-assistant.md](docs/home-assistant.md))

- No changes.

---

## 7. API Key ([docs/api-key.md](docs/api-key.md))

- No changes.

---

## 8. Manual Setup ([docs/manual-setup.md](docs/manual-setup.md))

- No changes.

---

## 9. Roadmap ([docs/roadmap.md](docs/roadmap.md))

- No changes.

---

## 10. VitePress config and 404

- No changes.

---

## Summary of edits

| Doc | Action |
|-----|--------|
| **index.md** | Optionally add one line on first-run flow. |
| **configuration.md** | Note schedule on/off are hour-of-day; list exact slideshow interval options; optional HA note for “Turn on until sunrise”; optional sentence that schedule only applies when Enable Schedule is on. |
| **screen-tone.md** | Add one sentence: in HA, “Turn on until sunrise” is **Screen: Warm Tone Override**. |
| **photo-sources.md** | Optional: soften Person overlay wording if names are not yet shown. |
| **install.md** | Optional: mention on-screen WiFi setup page when device has no WiFi. |
| **home-assistant.md** | No changes. |
| **api-key.md** | No changes. |
| **manual-setup.md** | No changes. |
| **roadmap.md** | No changes. |

Touch controls are not documented in this plan as that behavior is likely to change.
