#include "http.h"
#include "wifi.h"
#include "pump.h"
#include "message.h"
#include "config.h"
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ===== PROTOTYPE (QUAN TRỌNG) =====
void configProcess(const String& payload);
bool parseConfigJson(const String& payload, IrrigationConfig& out);

// ===== ENDPOINT =====
static const char* mainEndpoint = "https://reproduce-cowboy-jul-exhaust.trycloudflare.com";
static const char* POST_PATH   = "/sensor-data";
static const char* GET_PATH    = "/config";

// ===== TIME =====
static const unsigned long TIMEOUT = 2000;
static const unsigned long postInterval = 2000;
static const unsigned long getInterval  = 5000;

static unsigned long lastPost = 0;
static unsigned long lastGet  = 0;

// ===== POST SENSOR =====
void postF(unsigned long now, int soilValue) {
  if (now - lastPost < postInterval) return;
  lastPost = now;

  HTTPClient http;
  http.setTimeout(TIMEOUT);

  String url = String(mainEndpoint) + POST_PATH;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  String payload = "{";
  payload += "\"deviceId\":\"" + String(deviceId) + "\",";
  payload += "\"soilMoisture\":" + String(soilValue) + ",";
  payload += "\"pumpState\":\"" + String(getPumpState() == WATERING ? "WATERING" : "IDLE") + "\"";
  payload += "}";

  int code = http.POST(payload);
  if (code == 200) Serial.println(POST_MES);
  else Serial.println(SERVER_CONNECT_FAIL);

  http.end();
}

// ===== GET CONFIG =====
void getConfig(unsigned long now) {
  if (now - lastGet < getInterval) return;
  lastGet = now;

  HTTPClient http;
  http.setTimeout(TIMEOUT);

  String url = String(mainEndpoint) + GET_PATH + "?deviceId=" + deviceId;
  http.begin(url);

  int code = http.GET();
  if (code == 200) {
    String payload = http.getString();
    Serial.println(GET_MES);
    configProcess(payload);
  } else {
    Serial.println(SERVER_CONNECT_FAIL);
  }

  http.end();
}

// ===== PARSE CONFIG =====
bool parseConfigJson(const String& payload, IrrigationConfig& out) {
  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, payload);

  if (err) {
    Serial.print("❌ JSON parse error: ");
    Serial.println(err.c_str());
    return false;
  }

  if (!doc.containsKey("thresholdDry") ||
      !doc.containsKey("thresholdWet") ||
      !doc.containsKey("minWaterTime") ||
      !doc.containsKey("maxWaterTime") ||
      !doc.containsKey("cooldownMs")) {
    Serial.println(MISSING_CONFIG_FIELDS);
    return false;
  }

  out.dryThreshold = doc["thresholdDry"];
  out.wetThreshold = doc["thresholdWet"];
  out.minWaterTime = doc["minWaterTime"];
  out.maxWaterTime  = doc["maxWaterTime"];
  out.cooldownTime  = doc["cooldownMs"];

  return true;
}

// ===== APPLY CONFIG =====
void configProcess(const String& payload) {
  IrrigationConfig newConfig;

  if (!parseConfigJson(payload, newConfig)) {
    Serial.println(CONFIG_PARSE_FAILED);
    return;
  }

  if (!validateConfig(newConfig)) {
    Serial.println(CONFIG_VALIDATION_FAILED);
    return;
  }

  incomingConfig = newConfig;
  hasIncomingConfig = true;

  Serial.println(CONFIG_APPLIED);
}

// ===== MAIN PROCESS =====
void httpProcess(unsigned long now, int soilValue) {
  if (!wifiConnected()) return;
  postF(now, soilValue);
  getConfig(now);
}
