-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create devices table (with mode and pump timing)
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  device_secret_hash TEXT NOT NULL,
  threshold_moisture INTEGER NOT NULL DEFAULT 45,
  mode TEXT NOT NULL DEFAULT 'AUTO',
  min_pump_off_sec INTEGER NOT NULL DEFAULT 300,
  max_pump_on_sec INTEGER NOT NULL DEFAULT 120,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Indexes
  CONSTRAINT devices_mode_check CHECK (mode IN ('AUTO', 'MANUAL'))
);

CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_device_code ON devices(device_code);

-- Create device_status table (online/offline tracking)
CREATE TABLE IF NOT EXISTS device_status (
  device_id UUID PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip INET,
  fw_version TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_status_last_seen ON device_status(last_seen_at);

-- Create irrigation_logs table
CREATE TABLE IF NOT EXISTS irrigation_logs (
  id BIGSERIAL PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_sec INTEGER NOT NULL CHECK (duration_sec >= 0),
  moisture_before INTEGER,
  moisture_after INTEGER,
  reason TEXT NOT NULL DEFAULT 'AUTO',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_irrigation_device_time ON irrigation_logs(device_id, started_at DESC);

-- Create commands table
CREATE TABLE IF NOT EXISTS commands (
  id TEXT PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  duration_sec INTEGER,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  result_at TIMESTAMP WITH TIME ZONE,
  detail TEXT,
  
  CONSTRAINT commands_status_check CHECK (status IN ('QUEUED', 'DELIVERED', 'COMPLETED', 'FAILED', 'DONE', 'SKIPPED'))
);

CREATE INDEX IF NOT EXISTS idx_commands_device_id ON commands(device_id);
CREATE INDEX IF NOT EXISTS idx_commands_status ON commands(status);
