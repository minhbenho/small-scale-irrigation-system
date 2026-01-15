// http.cpp
#include "http.h"
#include "wifi.h"
#include "pump.h"
#include "message.h"
#include <HTTPClient.h>

static unsigned long lastReport = 0;

void httpProcess(unsigned long now, int soilValue){
  if(!wifiConnected()) return;
  if(now - lastReport < 5000) return;
  lastReport = now;

  HTTPClient http;
  http.begin("http://example.com/report");
  http.addHeader("Content-Type","application/json");

  String payload = "{";
  payload += "\"soil\":" + String(soilValue) + ",";
  payload += "\"state\":\"" + String(getPumpState() == WATERING ? "WATERING" : "IDLE") + "\"";
  payload += "}";

  if(http.POST(payload)>0) Serial.println(SERVER_CONNECT_SUCCESS);
  else Serial.println(SERVER_CONNECT_FAIL);
  http.end();
}
