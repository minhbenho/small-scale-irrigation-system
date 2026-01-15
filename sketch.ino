#include "pump.h"
#include "wifi.h"
#include "http.h"

#define SENSOR_PIN 34

void setup(){
  Serial.begin(115200);
  pumpInit();
  wifiInit();
}

void loop(){
  unsigned long now = millis();
  int soilValue = analogRead(SENSOR_PIN);
  pumpProcess(now, soilValue);
  wifiProcess(now);
  httpProcess(now, soilValue);
}
