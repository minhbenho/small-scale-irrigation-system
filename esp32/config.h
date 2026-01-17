#pragma once

struct IrrigationConfig{
  int dryThreshold;
  int wetThreshold;
  unsigned long minWaterTime;
  unsigned long maxWaterTime;
};

extern IrrigationConfig currentConfig;
extern IrrigationConfig incomingConfig;
extern bool hasIncomingConfig;
extern const IrrigationConfig defaultConfig;

bool validateConfig(const IrrigationConfig& cfg);
extern const char* WIFI_SSID;
extern const char* WIFI_PASS;
extern const char* deviceId;