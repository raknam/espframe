---
name: ""
overview: ""
todos: []
isProject: false
---

# Plan: Optimize codebase without changing functionality

## Scope

- **In scope:** [components/gsl3680/touchscreen.py](components/gsl3680/touchscreen.py), [components/online_image/**init**.py](components/online_image/__init__.py), [docs/public/webserver/app.js](docs/public/webserver/app.js), [docs/.vitepress/theme/components/EspInstallButton.vue](docs/.vitepress/theme/components/EspInstallButton.vue).
- **Optional (Phase 3):** Factoring [guition-esp32-p4-jc8012p4a1/addon/immich_api.yaml](guition-esp32-p4-jc8012p4a1/addon/immich_api.yaml) duplicate asset-parsing logic into a custom C++ helper — larger change, same behavior.

---

## Phase 1: Low-effort, high-clarity changes

### 1. GSL3680 touchscreen (Python)

**File:** [components/gsl3680/touchscreen.py](components/gsl3680/touchscreen.py)

- In `to_code` (lines 37–38), replace `config.get(CONF_INTERRUPT_PIN)` and `config.get(CONF_RESET_PIN)` with `config[CONF_INTERRUPT_PIN]` and `config[CONF_RESET_PIN]` (both are `cv.Required` in the schema).

### 2. Online image component (Python)

**File:** [components/online_image/**init**.py](components/online_image/__init__.py)

- Move `shutil` and `from esphome.core import CORE` to the top of the file with other imports. Remove them from inside `JPEGFormat.actions()` (lines 75–76). Behavior unchanged; dependencies become explicit.

### 3. EspInstallButton Vue component

**File:** [docs/.vitepress/theme/components/EspInstallButton.vue](docs/.vitepress/theme/components/EspInstallButton.vue)

- Initialize `supported` as `ref(false)` and set `supported.value = 'serial' in navigator` in `onMounted` so the unsupported message does not flash after the button.
- Add a second ref for load failure, e.g. `loadError` (string or boolean). Template: if `!supported` → unsupported message; else if `loadError` → show “Failed to load installer” (and optionally `loadError` text); else → show install button.
- In `onMounted`, wrap the dynamic `import('https://unpkg.com/esp-web-tools@10/...')` in try/catch (or `.catch()`); on failure set `loadError` so the user sees the error state instead of a stuck button.

**Verify Phase 1:** Run `esphome compile` for the device config; run the docs dev server and use the install button; complete wizard and open settings; confirm no console errors.

---

## Phase 2: Webserver app.js refactors

**File:** [docs/public/webserver/app.js](docs/public/webserver/app.js)

Implementation order: do **2a → 2b → 2c → 2d → 2e** so duplication is removed first and the “single updater” pattern is established before the select and state refactors.

### 2a. Remove or implement setStatus

- **Option A (recommended):** Remove the no-op `function setStatus() {}` (line ~~1159) and the two call sites: `setStatus(true)` in `evtSource.onopen` (~~341), `setStatus(false)` in `evtSource.onerror` (~326).
- **Option B:** Implement `setStatus(connected)` to update a small UI indicator (e.g. “Connected” / “Disconnected”) and add that element where appropriate (e.g. in the Connection card).

### 2b. Single sun-info and network-info updaters

**Sun info**

- Add a helper near the other helpers (~813), e.g. `function updateSunInfoElement(el)`: if `el` is missing, return; else set `el.style.display` from `S.sunrise`/`S.sunset` and set `el.innerHTML` from the same logic as today (Sunrise: … / Sunset: …).
- Replace the inline sun-info block in `handleLiveEvent` for **both** sunrise and sunset (lines ~1088–1104) with one call: `updateSunInfoElement(document.getElementById("sun-info"))` after updating `S.sunrise` or `S.sunset`.
- In the Screen Brightness card, keep the local `updateSunInfo()` (lines ~723–731) but have it call `updateSunInfoElement(fSunInfo)` so one implementation owns the format.

**Network info**

- Add `function updateNetworkInfoElement(netEl)` that builds the network status HTML from `S.online`, `S.ip_address`, `S.wifi_strength`, `S.wifi_signal_db`, `S.uptime` (same logic as current `updateNetworkInfo()` at ~582–595 and the block in `handleLiveEvent` at ~766–786).
- In the Network card, call `updateNetworkInfoElement(netDetails)` instead of inlining the logic in `updateNetworkInfo()`.
- In `handleLiveEvent`, for the branch that handles `binary_sensor/Network: Online`, `sensor/Network: Uptime`, etc., after updating `S`, call `updateNetworkInfoElement(document.getElementById("network-info"))` instead of duplicating the HTML construction.

### 2c. Select helper (reuse / generalize timezoneSelect)

- **Generalize existing helper:** [app.js](docs/public/webserver/app.js) already has `timezoneSelect(options, current, onChange)` at ~801–816. Generalize it to e.g. `selectFromOptions(options, current, onChange, optionDisplayFn)` where `optionDisplayFn` is optional (default: identity; for timezone use `function(o) { return o.replace(/_/g, " "); }`). Use this for:
  - Clock Format in wizard step 2 (~~436–448) and in settings (~~616–628)
  - Slideshow Interval (~489–501)
  - Photo Source (~461–472)
  - Update Frequency (~738–750)
- **Schedule On/Off:** These use numeric 0–23 with `formatHour()` (~762–789). Either keep the existing loop or add a small `hourSelect(selectedHour, onChange)` that builds the 24 options and uses `formatHour` for labels. Do not force them into the generic string-option helper.

### 2d. Single “apply entity to state” path (optional)

- Introduce a mapping from entity `id` (e.g. `"text/Connection: Server URL"`) to which `S` fields and options to set, and one function that applies a single `d` (with `id`, `value`, `state`, `option`) to `S`. Use it in both `collectState(d)` and in the `fetchDeviceSettingsState().then(...)` block (~262–284).
- **Important:** Derive the list of endpoints for the initial `Promise.all` in `fetchDeviceSettingsState()` from this same mapping (or from a single ordered list of endpoint keys). That way the initial fetch and SSE stay in sync and adding a new entity requires only one change.

### 2e. Minor cleanups

- **Log listener:** The `evtSource.addEventListener("log", ...)` is added inside `renderSettings()` (~1046–1056). To avoid duplicate listeners if `renderSettings()` is ever called again (e.g. a future “Back to setup” then “Done” flow), either:
  - **Option A:** Attach the log listener once (e.g. in `initSSE()` after creating the EventSource). Have it write to a shared `logLines` array and a shared `logPre` reference that `renderSettings()` assigns when building the log card.
  - **Option B:** Use a module-level flag (e.g. `logListenerAttached`) and only add the listener when the flag is false, then set it true.
- **post():** Optionally build the query string with `new URLSearchParams(params)` and `url + "?" + qs.toString()` for clarity; keep the same POST behavior.
- **Inline styles:** Optionally move repeated strings (e.g. `fwRowStyle`, `"font-size:.9rem"`) into CSS classes in the relevant stylesheet.
- **esc():** Reusing a single div in `esc(s)` is optional and only worth it if profiling shows hot paths; otherwise leave as-is to keep the change set small.

**Verify Phase 2:** Same as Phase 1; toggle a setting (e.g. clock format) and confirm the UI updates via SSE; open “Device Logs” and confirm lines append; after refactors, confirm sun and network sections update when relevant entities change.

---

## Phase 3 (Optional): Immich API YAML — C++ helper

**Goal:** Remove the duplicated “parse asset JSON and fill slot meta + exif/portrait/zoom” logic between `immich_fetch_memory_asset` and `immich_fetch_into_slot` in [guition-esp32-p4-jc8012p4a1/addon/immich_api.yaml](guition-esp32-p4-jc8012p4a1/addon/immich_api.yaml). Same behavior; future parsing changes live in one place.

**Steps:**

1. Add a new ESPHome custom component (e.g. `components/immich_parser` or under [components/espframe](components/espframe)) that exposes a C++ function callable from YAML lambdas, e.g. `parse_immich_asset_and_fill_slot(const std::string& body, int slot)`.
2. Implement that function to parse the JSON, compute exif/portrait/zoom, fill the slot meta (asset_id, image_url, date, location, etc.) by writing to the existing globals (e.g. `id(slot0)` / `slot1` / `slot2`), and set the image URL on the correct `immich_img_`*. Mirror the logic of the current inline lambdas so behavior is unchanged.
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
| 12   | Optional: Immich API C++ helper (Phase 3)                                                | new component + immich_api.yaml |


Phase 1 (steps 1–3) first; then Phase 2 (4–11) in order. Phase 3 (step 12) can be scheduled separately.