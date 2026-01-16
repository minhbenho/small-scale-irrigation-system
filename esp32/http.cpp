// http.cpp
#include "http.h"
#include "wifi.h"
#include "pump.h"
#include "message.h"
#include "config.h"
#include <HTTPClient.h>

// static const char* post_endpoint="https://www.example.com/";
static const char* post_endpoint="https://reproduce-cowboy-jul-exhaust.trycloudflare.com/sensor-data";
static const char* get_endpoint="https://reproduce-cowboy-jul-exhaust.trycloudflare.com/config";

static const unsigned long TIMEOUT=2000;
static const unsigned long postInterval =2000;
static const unsigned long getInterval = 5000;

static unsigned long lastReport = 0;
static unsigned long lastGet=0;
static unsigned long lastPost=0;

void postF(unsigned long now, int soilValue){
  if(now-lastPost>=postInterval){
    lastPost=now;
    HTTPClient http;
    http.setTimeout(TIMEOUT);
    http.begin(post_endpoint);
    http.addHeader("Content-Type","application/json");
    String payload="{";
    payload += String("\"deviceId\":\"") + deviceId + "\",";
    payload += String("\"soilMoisture\":") + soilValue + ",";
    payload += String("\"pumpState\":\"") +(getPumpState() == WATERING ? "WATERING" : "IDLE") +"\"";
    payload += "}";
    int code=http.POST(payload);
    if(code==200) Serial.println(POST_MES);
    else{
      Serial.print(code);
      Serial.println(http.getString());
    }
    http.end();
  }
}
void getF(unsigned long now){
    if(now-lastGet>=getInterval){
    lastGet=now;
    HTTPClient http;
    http.setTimeout(TIMEOUT);
    String url=String(get_endpoint)+"?deviceId="+deviceId;
    http.begin(url);
    int code=http.GET();
    String payload=http.getString();
    if(code==200) Serial.println(GET_MES);
    else{
      Serial.print(code);
      Serial.println(FAIL_GET_MES);
    }
    Serial.println(payload);
    http.end();
  }
}
void httpProcess(unsigned long now, int soilValue){
  if(!wifiConnected()) return;
  postF(now, soilValue);
  getF(now);

}