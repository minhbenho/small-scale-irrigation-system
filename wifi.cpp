// wifi.cpp
#include "wifi.h"
#include "config.h"
#include <WiFi.h>

enum WiFiState{
  WIFI_IDLE,
  WIFI_CONNECTING,
  WIFI_CONNECTED
};

static WiFiState wifiState = WIFI_IDLE;
static unsigned long wifiStartTime = 0;

void wifiInit(){
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
}

bool wifiProcess(unsigned long now){
  if(wifiState == WIFI_CONNECTED) return true;

  if(wifiState == WIFI_IDLE){
    WiFi.begin(WIFI_SSID,WIFI_PASS);
    wifiStartTime = now;
    wifiState = WIFI_CONNECTING;
  } else {
    if(WiFi.status() == WL_CONNECTED){
      wifiState = WIFI_CONNECTED;
      return true;
    }
    if(now - wifiStartTime > 15000){
      wifiState = WIFI_IDLE;
    }
  }
  return false;
}

bool wifiConnected(){
  return wifiState == WIFI_CONNECTED;
}
