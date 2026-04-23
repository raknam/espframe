#include "wifi_reconfigure.h"

#include "esphome/core/log.h"

#ifdef USE_WIFI
#ifdef USE_WIFI_AP

// ESPHome does not currently expose a public helper for "start fallback AP and
// captive portal now". This translation unit keeps the access hack scoped to a
// single place and gives the YAML a small wrapper to call.
#define private public
#define protected public
#include "esphome/components/captive_portal/captive_portal.h"
#include "esphome/components/wifi/wifi_component.h"
#undef protected
#undef private

namespace esphome {
namespace espframe {

static const char *const TAG = "wifi.reconfig";

void force_wifi_reconfigure_mode() {
  auto *wifi = wifi::global_wifi_component;
  if (wifi == nullptr) {
    ESP_LOGW(TAG, "WiFi component not available; cannot start WiFi setup mode");
    return;
  }

  wifi->clear_sta();
  wifi->setup_ap_config_();

#ifdef USE_CAPTIVE_PORTAL
  auto *portal = captive_portal::global_captive_portal;
  if (portal != nullptr && !portal->is_active()) {
    portal->start();
  }
#endif

  ESP_LOGI(TAG, "WiFi setup mode active");
}

bool is_wifi_reconfigure_portal_active() {
#ifdef USE_CAPTIVE_PORTAL
  auto *portal = captive_portal::global_captive_portal;
  return portal != nullptr && portal->is_active();
#else
  return false;
#endif
}

}  // namespace espframe
}  // namespace esphome

#else

namespace esphome {
namespace espframe {

void force_wifi_reconfigure_mode() {}
bool is_wifi_reconfigure_portal_active() { return false; }

}  // namespace espframe
}  // namespace esphome

#endif
#else

namespace esphome {
namespace espframe {

void force_wifi_reconfigure_mode() {}
bool is_wifi_reconfigure_portal_active() { return false; }

}  // namespace espframe
}  // namespace esphome

#endif
