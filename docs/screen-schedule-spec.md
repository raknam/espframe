---
title: Screen Schedule Feature Spec
description: Product and implementation spec for recreating Espframe's screen schedule experience in another project.
---

# Screen Schedule Feature Spec

This spec describes Espframe's screen schedule feature so the same experience can be recreated in another project.

The feature has one main job: let the frame behave like an always-available photo frame during the hours the user cares about, then go physically dark and quiet outside those hours.

## User Goals

- Turn the screen off automatically overnight or during unused hours.
- Keep the photo frame simple: one schedule toggle, one on time, and one off time.
- Save power and reduce unnecessary screen use when the frame is asleep.
- Pause photo fetching while the screen is off, then resume cleanly when it wakes.
- Allow manual wake and sleep from the touchscreen without changing the saved schedule.
- Keep brightness comfortable by using separate daytime and nighttime brightness levels.

## User Interface

The Settings screen contains a collapsible card titled **Screen schedule**.

The card shows:

| Control | Type | Default | Behavior |
| --- | --- | --- | --- |
| Enable Schedule | Toggle | Off | Enables or disables automatic screen on/off. |
| On Time | Hour dropdown | 6:00 AM | First hour when the screen should be on. Hidden when the schedule is disabled. |
| Off Time | Hour dropdown | 11:00 PM | First hour when the screen should be off. Hidden when the schedule is disabled. |

The hour dropdowns contain 24 choices from `12:00 AM` through `11:00 PM`. Internally they are stored as whole hours from `0` to `23`.

When the schedule toggle is on, the card shows an active badge. When the toggle is off, the on/off time controls are hidden and the frame only uses the normal brightness rules.

## Related Brightness Controls

Screen scheduling works alongside the **Screen Brightness** controls:

| Control | Type | Default | Range |
| --- | --- | --- | --- |
| Daytime Brightness | Slider or number control | 100% | 10% to 100%, step 5% |
| Nighttime Brightness | Slider or number control | 75% | 10% to 100%, step 5% |

Daytime and nighttime brightness are separate from the on/off schedule.

- If the screen is awake, brightness is set from the day or night value.
- If the screen is asleep, brightness is ignored because the backlight is off.
- Day/night is calculated from sunrise and sunset for the selected timezone.
- If sunrise/sunset cannot be calculated yet, use daytime brightness as the fallback.

## Saved Settings

The feature needs these user-facing settings:

| Setting | Type | Default | Notes |
| --- | --- | --- | --- |
| `schedule_enabled` | Boolean | `false` | Whether automatic on/off is active. |
| `schedule_on_hour` | Integer | `6` | Whole hour, 0-23. |
| `schedule_off_hour` | Integer | `23` | Whole hour, 0-23. |
| `brightness_day` | Integer | `100` | Percent, 10-100. |
| `brightness_night` | Integer | `75` | Percent, 10-100. |
| `timezone` | String | Project default | Used for local time and sunrise/sunset. |

Backup and restore should include the screen settings in this shape:

```json
{
  "screen": {
    "brightness_day": 100,
    "brightness_night": 75,
    "schedule_enabled": false,
    "schedule_on_hour": 6,
    "schedule_off_hour": 23
  }
}
```

## Internal State

The implementation should keep these internal state values. These do not need to be shown to the user.

| State | Meaning |
| --- | --- |
| `backlight_paused` | The frame is asleep and the backlight should be off. |
| `backlight_manual_off` | The user intentionally put the screen to sleep with a long press. |
| `manual_wake_ms` | The time when the user manually woke the frame. Used for the short grace period outside schedule hours. |
| `sunrise_time` / `sunset_time` | Today's calculated sunrise and sunset for brightness selection. |
| `sunrise_sunset_valid` | Whether sunrise/sunset calculation is available. |
| `last_is_daytime` | The last day/night state, so brightness can update when crossing sunrise or sunset. |

## Schedule Window Rules

The schedule is based on local time and whole hours.

The on hour is inclusive. The off hour is exclusive.

Example: with On Time `6` and Off Time `23`, the screen is on from `6:00 AM` until just before `11:00 PM`. It turns off at `11:00 PM`.

Use these rules:

```text
If on_hour < off_hour:
  on when current_hour >= on_hour and current_hour < off_hour

If on_hour > off_hour:
  on when current_hour >= on_hour or current_hour < off_hour
  This supports overnight schedules, such as 8:00 PM to 7:00 AM.

If on_hour == off_hour:
  always on
```

Only check the schedule when local time is valid. If the device does not know the current time yet, do not force the screen on or off.

## Screen Sleep Behavior

When the frame goes to sleep:

- Set `backlight_paused` to `true`.
- Clear `backlight_manual_off` if the sleep was caused by the schedule.
- Fade the backlight off.
- Pause the display rendering layer if the platform supports it.
- Make a second immediate backlight-off call after the fade, so the panel is physically dark.
- Pause photo prefetching and downloads.

The current implementation allows the display layer to keep its anti-burn-in buffer running while the physical backlight is off. In another project, the important part is the visible result: asleep means physically dark.

## Screen Wake Behavior

When the frame wakes because it is back inside the schedule window:

- Only wake automatically if `backlight_manual_off` is `false`.
- Set `backlight_paused` to `false`.
- Apply the correct day or night brightness.
- Resume the display rendering layer.
- Resume photo prefetching.
- Reset the slideshow timer so the frame does not immediately advance unexpectedly.

When the user taps to wake:

- Clear `backlight_manual_off`.
- Clear `backlight_paused`.
- Record `manual_wake_ms`.
- Apply brightness and resume photo fetching.

If the user wakes the frame outside the schedule window, keep it awake for about 2 minutes. After that, the schedule may put it back to sleep again.

## Touch Gestures

The slideshow screen supports three gestures:

| Gesture | Result |
| --- | --- |
| Tap while screen is off | Wake the screen. |
| Press and hold for 3 seconds | Put the screen to sleep manually. |
| Double-tap while screen is on | Advance to the next photo. |

Manual sleep is intentionally stronger than the schedule. If the user long-presses to sleep during scheduled-on hours, the schedule should not immediately wake the frame again. The next tap wakes it.

## Download And Prefetch Behavior

When `backlight_paused` is `true`, photo fetching should stop.

This matters because the user cannot see new photos while the screen is off, and continuing to download can waste power, memory, and network activity.

Rules:

- Do not start a new photo prefetch while paused.
- If a photo fetch is about to start and the frame is paused, cancel it.
- When the frame wakes, start the prefetch chain again.
- Log or report this as a normal paused state, not as an error.

## Time And Sunrise/Sunset Behavior

The project needs a trusted local time source. Espframe uses SNTP plus a selected timezone.

On time sync:

- Update the on-screen clock.
- Recalculate today's sunrise and sunset.
- Check the screen schedule.

Every 60 seconds:

- Update the clock.
- Check whether the schedule should change the screen state.
- Check whether sunrise or sunset has been crossed, and update brightness if needed.

At midnight:

- Recalculate sunrise and sunset for the new date.

If the timezone changes:

- Update the local time rules.
- Recalculate sunrise and sunset.
- Apply brightness again if the screen is awake.

## Reference Logic

This pseudocode is the core behavior to reproduce.

```text
function isInScheduleWindow(current_hour, on_hour, off_hour):
  if on_hour < off_hour:
    return current_hour >= on_hour and current_hour < off_hour

  if on_hour > off_hour:
    return current_hour >= on_hour or current_hour < off_hour

  return true


function checkSchedule():
  if schedule_enabled is false:
    return

  if local time is not valid:
    return

  in_window = isInScheduleWindow(current_hour, schedule_on_hour, schedule_off_hour)

  if in_window and backlight_paused and not backlight_manual_off:
    backlight_paused = false
    resetSlideshowTimer()
    applyBrightness()
    resumePhotoPrefetch()
    return

  if not in_window and not backlight_paused:
    if manual_wake_ms is set and now - manual_wake_ms < 2 minutes:
      return

    manual_wake_ms = 0
    backlight_paused = true
    backlight_manual_off = false
    applyBrightness()
```

```text
function applyBrightness():
  if backlight_paused:
    fadeBacklightOff()
    pauseDisplayRendering()
    forceBacklightOff()
    return

  resumeDisplayRendering()

  if sunrise_sunset_valid and local time is valid:
    percent = isDaytime(local time, sunrise, sunset)
      ? brightness_day
      : brightness_night
  else:
    percent = brightness_day

  turnBacklightOn(percent)
```

```text
function wakeFromTouch():
  backlight_manual_off = false
  backlight_paused = false
  manual_wake_ms = now
  resetSlideshowTimer()
  applyBrightness()
  resumePhotoPrefetch()


function sleepFromLongPress():
  backlight_manual_off = true
  backlight_paused = true
  applyBrightness()
```

## Home Assistant Or External API Mapping

If the target project exposes entities to another system, use clear names matching the UI:

| Name | Type |
| --- | --- |
| Screen: Backlight | Light, with on/off and brightness |
| Screen: Schedule | Switch |
| Screen: Schedule On | Number, 0-23 |
| Screen: Schedule Off | Number, 0-23 |
| Screen: Daytime Brightness | Number, 10-100 |
| Screen: Nighttime Brightness | Number, 10-100 |
| Screen: Sunrise | Read-only text |
| Screen: Sunset | Read-only text |

The web UI can call these through whatever API the platform provides. In Espframe's built-in web UI, setting changes are applied immediately.

## Edge Cases

- **Schedule disabled:** do not run automatic on/off. Day/night brightness still works when the screen is on.
- **Current time unknown:** do nothing until valid local time is available.
- **On hour equals off hour:** treat as always on.
- **Overnight schedule:** support windows that cross midnight, such as on at `20` and off at `7`.
- **Manual sleep during scheduled-on hours:** stay asleep until the user taps to wake.
- **Manual wake during scheduled-off hours:** wake for about 2 minutes, then allow the schedule to sleep again.
- **Brightness changed while asleep:** save the new value, but do not light the screen. Apply it next time the frame wakes.
- **Sunrise/sunset unavailable:** use daytime brightness.
- **Backlight state drift:** if the frame believes it is paused but the backlight is on, force it off during the periodic check.

## Acceptance Criteria

- The settings screen has a **Screen schedule** card with an enable toggle and two hour dropdowns.
- The hour dropdowns are hidden while the schedule is disabled.
- The default schedule settings are disabled, on at `6:00 AM`, and off at `11:00 PM`.
- A normal daytime window turns on at the on hour and turns off at the off hour.
- An overnight window works correctly across midnight.
- Equal on/off hours mean the schedule is effectively always on.
- The display goes physically dark when scheduled off.
- Photo downloads and prefetching pause while the display is asleep.
- Photo downloads and prefetching resume when the display wakes.
- Daytime and nighttime brightness are applied only while the display is awake.
- A long press manually sleeps the screen and prevents immediate schedule wake.
- A tap wakes the screen.
- A manual wake outside scheduled hours lasts for about 2 minutes before the schedule can sleep again.
- Settings survive reboot and are included in backup/restore.
