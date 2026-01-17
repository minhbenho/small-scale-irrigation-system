// pump.cpp
#include "pump.h"
#include "message.h"
#include "system_state.h"
#include <Arduino.h>
#include "config.h"

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
      if(soilValue < currentConfig.dryThreshold){
        currentState = WATERING;
        waterStartTime = now;
        Serial.println(START_WATER);
      }
      break;

    case WATERING:
      if((soilValue > currentConfig.wetThreshold &&
          now - waterStartTime >= currentConfig.minWaterTime) ||
          now - waterStartTime > currentConfig.maxWaterTime){
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
