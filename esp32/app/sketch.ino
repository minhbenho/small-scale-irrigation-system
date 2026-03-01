//sketch.ino

#include "pump.h"
#include "wifi.h"
#include "http.h"
#include "system_state.h"
#include "config.h"
#define SENSOR_PIN 34

void setup(){
  Serial.begin(115200);
  pumpInit();
  wifiInit();
}

void loop(){
  unsigned long now = millis();
  int soilValue = analogRead(SENSOR_PIN);
  if (hasIncomingConfig) {
    currentConfig = incomingConfig;
    hasIncomingConfig = false;
    Serial.println("CONFIG SWITCHED");
  }
  pumpProcess(now, soilValue);
  wifiProcess(now);
  httpProcess(now, soilValue);
}
