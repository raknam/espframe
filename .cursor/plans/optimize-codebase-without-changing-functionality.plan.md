---
name: ""
overview: ""
todos: []
isProject: false
---

# Plan: Optimize codebase without changing functionality

**Status:** Phase 1, Phase 2, and Phase 3 are **completed**. The items below are kept for reference.

## Scope

- **In scope:** [components/gsl3680/touchscreen.py](components/gsl3680/touchscreen.py), [components/online_image/**init**.py](components/online_image/__init__.py), [docs/public/webserver/app.js](docs/public/webserver/app.js), [docs/.vitepress/theme/components/EspInstallButton.vue](docs/.vitepress/theme/components/EspInstallButton.vue).
- **Phase 3 (done):** Immich asset parsing is in [components/espframe/espframe_helpers.h](components/espframe/espframe_helpers.h) as `parse_immich_asset_and_fill_slot`, used from [immich_api.yaml](guition-esp32-p4-jc8012p4a1/addon/immich_api.yaml).

---

## Phase 1: Low-effort, high-clarity changes — DONE

### 1. GSL3680 touchscreen (Python) — DONE

**File:** [components/gsl3680/touchscreen.py](components/gsl3680/touchscreen.py)

- In `to_code` (lines 37–38), use `config[CONF_INTERRUPT_PIN]` and `config[CONF_RESET_PIN]` (both are `cv.Required` in the schema). Already done.

### 2. Online image component (Python) — DONE

**File:** [components/online_image/**init**.py](components/online_image/__init__.py)

- Move `shutil` and `from esphome.core import CORE` to the top of the file with other imports. Already done.

### 3. EspInstallButton Vue component — DONE

**File:** [docs/.vitepress/theme/components/EspInstallButton.vue](docs/.vitepress/theme/components/EspInstallButton.vue)

- Initialize `supported` as `ref(false)` and set `supported.value = 'serial' in navigator` in `onMounted` so the unsupported message does not flash after the button.
- Add a second ref for load failure, e.g. `loadError` (string or boolean). Template: if `!supported` → unsupported message; else if `loadError` → show “Failed to load installer” (and optionally `loadError` text); else → show install button.
- In `onMounted`, wrap the dynamic import in try/catch; on failure set `loadError`. Already done.

**Verify Phase 1:** Run `esphome compile` for the device config; run the docs dev server and use the install button; complete wizard and open settings; confirm no console errors.

---

## Phase 2: Webserver app.js refactors — DONE

**File:** [docs/public/webserver/app.js](docs/public/webserver/app.js)

Implementation order: do **2a → 2b → 2c → 2d → 2e** so duplication is removed first and the “single updater” pattern is established before the select and state refactors.

### 2a. setStatus — DONE (removed or never present)

### 2b. Single sun-info and network-info updaters — DONE

**Sun info**

- Add a helper near the other helpers (~813), e.g. `function updateSunInfoElement(el)`: if `el` is missing, return; else set `el.style.display` from `S.sunrise`/`S.sunset` and set `el.innerHTML` from the same logic as today (Sunrise: … / Sunset: …).
- Replace the inline sun-info block in `handleLiveEvent` for **both** sunrise and sunset (lines ~1088–1104) with one call: `updateSunInfoElement(document.getElementById("sun-info"))` after updating `S.sunrise` or `S.sunset`.
- In the Screen Brightness card, keep the local `updateSunInfo()` (lines ~723–731) but have it call `updateSunInfoElement(fSunInfo)` so one implementation owns the format.

**Network info**

- Add `function updateNetworkInfoElement(netEl)` that builds the network status HTML from `S.online`, `S.ip_address`, `S.wifi_strength`, `S.wifi_signal_db`, `S.uptime` (same logic as current `updateNetworkInfo()` at ~582–595 and the block in `handleLiveEvent` at ~766–786).
- In the Network card, call `updateNetworkInfoElement(netDetails)` instead of inlining the logic in `updateNetworkInfo()`.
- In `handleLiveEvent`, call `updateNetworkInfoElement(document.getElementById("network-info"))` where applicable. (Network info may not be in settings UI; sun info uses `updateSunInfoElement`.)

### 2c. Select helper — DONE

- **Generalize existing helper:** [app.js](docs/public/webserver/app.js) already has `timezoneSelect(options, current, onChange)` at ~801–816. Generalize it to e.g. `selectFromOptions(options, current, onChange, optionDisplayFn)` where `optionDisplayFn` is optional (default: identity; for timezone use `function(o) { return o.replace(/_/g, " "); }`). Use this for:
  - Clock Format in wizard step 2 (~~436–448) and in settings (~~616–628)
  - Slideshow Interval (~489–501)
  - Photo Source (~461–472)
  - Update Frequency (~738–750)
- **Schedule On/Off:** Keep existing loop with `formatHour()` or add `hourSelect`; do not force into generic string-option helper.

### 2d. Single “apply entity to state” path — DONE

- Introduce a mapping from entity `id` (e.g. `"text/Connection: Server URL"`) to which `S` fields and options to set, and one function that applies a single `d` (with `id`, `value`, `state`, `option`) to `S`. Use it in both `collectState(d)` and in the `fetchDeviceSettingsState().then(...)` block (~262–284).
- **Important:** Initial fetch uses `INITIAL_FETCH_KEYS`; `KEY_TO_ENTITY_ID` is now derived from `ENTITY_STATE_MAP` so adding a new entity is a single-place change.

### 2e. Minor cleanups — DONE

- **Log listener:** Guarded with `logListenerAttached`; listener attached once in `initSSE()`.
- **post():** Uses `URLSearchParams`. Done.
- **Inline styles:** Repeated margin styles moved to CSS classes (`.mb-8`, `.mb-12`, `.mt-12`) in [style.css](docs/public/webserver/style.css).
- **esc():** Left as-is.

**Verify Phase 2:** Same as Phase 1; toggle a setting (e.g. clock format) and confirm the UI updates via SSE; open “Device Logs” and confirm lines append; after refactors, confirm sun and network sections update when relevant entities change.

---

## Phase 3: Immich API YAML — C++ helper — DONE

**Goal:** Remove the duplicated “parse asset JSON and fill slot meta + exif/portrait/zoom” logic. Achieved via `parse_immich_asset_and_fill_slot` in [components/espframe/espframe_helpers.h](components/espframe/espframe_helpers.h), used from both fetch paths in [immich_api.yaml](guition-esp32-p4-jc8012p4a1/addon/immich_api.yaml).

**Steps (completed):**

1. Add a new ESPHome custom component (e.g. `components/immich_parser` or under [components/espframe](components/espframe)) that exposes a C++ function callable from YAML lambdas, e.g. `parse_immich_asset_and_fill_slot(const std::string& body, int slot)`.
2. Implement that function to parse the JSON, compute exif/portrait/zoom, fill the slot meta (asset_id, image_url, date, location, etc.) by writing to the existing globals (e.g. `id(slot0)` / `slot1` / `slot2`), and set the image URL on the correct `immich_img`_*. Mirror the logic of the current inline lambdas so behavior is unchanged.
3. In [immich_api.yaml](guition-esp32-p4-jc8012p4a1/addon/immich_api.yaml), in both `immich_fetch_memory_asset` and `immich_fetch_into_slot` `on_response` blocks, replace the long lambda with a short one that calls this helper (e.g. `parse_immich_asset_and_fill_slot(body, id(target_slot));`).
4. Note: ESPHome lambdas can only call C++ that is exposed via a custom component (or global), so the helper must live in a component and be registered appropriately.

**Verify Phase 3:** Flash the device; run slideshow with “All Photos” and “Memories”; confirm photos and metadata (date, location, portrait pairing) match previous behavior.

---

## Implementation order summary


| Step | Task                                                                                     | Files                           |
| ---- | ---------------------------------------------------------------------------------------- | ------------------------------- |
| 1    | GSL3680 use required config keys                                                         | touchscreen.py                  |
| 2    | Online image top-level imports                                                           | online_image/**init**.py        |
| 3    | EspInstallButton: supported init + loadError + catch                                     | EspInstallButton.vue            |
| 4    | setStatus: remove or implement                                                           | app.js                          |
| 5    | updateSunInfoElement + use everywhere                                                    | app.js                          |
| 6    | updateNetworkInfoElement + use everywhere                                                | app.js                          |
| 7    | selectFromOptions (generalize timezoneSelect) + use for format/interval/source/frequency | app.js                          |
| 8    | Optional: hourSelect or keep schedule dropdowns as-is                                    | app.js                          |
| 9    | Optional: single apply-entity-to-state + derive initial fetch list                       | app.js                          |
| 10   | Log listener: attach once or guard with flag                                             | app.js                          |
| 11   | Optional: URLSearchParams, CSS classes                                                   | app.js                          |
| 12   | Immich API C++ helper (Phase 3) — DONE                                                    | espframe_helpers.h + immich_api.yaml |

All phases completed. For future changes: add new settings only to `INITIAL_FETCH_KEYS` and `ENTITY_STATE_MAP` (and `endpoints`/`S` as needed); use CSS classes for spacing where applicable.