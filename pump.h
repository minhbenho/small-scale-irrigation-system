// pump.h
#pragma once
#include "config.h"

enum SystemState{
  IDLE,
  WATERING
};

void pumpInit();
void pumpProcess(unsigned long now, int soilValue);
SystemState getPumpState();
