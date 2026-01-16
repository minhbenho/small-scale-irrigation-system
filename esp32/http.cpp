// http.cpp
#include "http.h"
#include "wifi.h"
#include "pump.h"
#include "message.h"
#include "config.h"
#include <HTTPClient.h>

static unsigned long lastReport = 0;
// static const char* SERVER_LINK="https://www.example.com/";
static const char* SERVER_LINK="https://reproduce-cowboy-jul-exhaust.trycloudflare.com/sensor-data";

static const unsigned long TIMEOUT=2000;

void httpProcess(unsigned long now, int soilValue){
  if(!wifiConnected()) return;
  if(now - lastReport < 5000) return;
  lastReport = now;

  HTTPClient http;
  
  http.setTimeout(TIMEOUT);
  http.begin(SERVER_LINK);
  http.addHeader("Content-Type","application/json");

  String payload = "{";
  payload += String("\"deviceId\":\"") + deviceId + "\",";
  payload += String("\"soilMoisture\":") + soilValue + ",";
  payload += String("\"pumpState\":\"") +(getPumpState() == WATERING ? "WATERING" : "IDLE") +"\"";
  payload += "}";

  int code = http.POST(payload);
  Serial.println(code);

  http.end();
}
