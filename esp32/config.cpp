#include "config.h"

const IrrigationConfig defaultConfig{
  1400,
  1800,
  2000,
  3500
};

IrrigationConfig currentConfig = defaultConfig;
IrrigationConfig incomingConfig = defaultConfig;

bool hasIncomingConfig = false;

const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASS = "";
const char* deviceId  = "minh_esp32";
bool validateConfig(const IrrigationConfig& cfg) {
  return 
  cfg.dryThreshold < cfg.wetThreshold 
  && cfg.minWaterTime <= cfg.maxWaterTime
  && cfg.dryThreshold > 0
  && cfg.wetThreshold > 0;
}