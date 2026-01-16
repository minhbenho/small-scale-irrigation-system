// config.h
#pragma once

struct IrrigationConfig{
  int dryThreshold;
  int wetThreshold;
  unsigned long minWaterTime;
  unsigned long maxWaterTime;
};

extern IrrigationConfig config;
extern const char*  WIFI_SSID;
extern const char*  WIFI_PASS;
extern const char*  deviceId;