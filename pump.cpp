// pump.cpp
#include "pump.h"
#include "message.h"
#include <Arduino.h>

#define PUMP_PIN 2

static SystemState currentState = IDLE;
static unsigned long waterStartTime = 0;

void pumpInit(){
  pinMode(PUMP_PIN, OUTPUT);
  digitalWrite(PUMP_PIN, LOW);
}

void pumpProcess(unsigned long now, int soilValue){
  switch(currentState){
    case IDLE:
      if(soilValue < config.dryThreshold){
        currentState = WATERING;
        waterStartTime = now;
        Serial.println(START_WATER);
      }
      break;

    case WATERING:
      if((soilValue > config.wetThreshold &&
          now - waterStartTime >= config.minWaterTime) ||
          now - waterStartTime > config.maxWaterTime){
        currentState = IDLE;
        Serial.println(STOP_WATER);
      }
      break;
  }

  digitalWrite(PUMP_PIN, currentState == WATERING ? HIGH : LOW);
}

SystemState getPumpState(){
  return currentState;
}
