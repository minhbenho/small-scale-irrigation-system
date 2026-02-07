// pump.h

#pragma once
#include "config.h"
#include "system_state.h"


void pumpInit();
void pumpProcess(unsigned long now, int soilValue);
SystemState getPumpState();
