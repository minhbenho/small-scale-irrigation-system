# 🚀 Mock API Contract - Small-Scale Irrigation System

Base URL: `http://localhost:3000`

## Status Codes
- **201**: Created  
- **200**: OK  
- **400**: Bad Request (missing/invalid fields)
- **401**: Unauthorized  
- **404**: Not Found  

---

## 1️⃣ AUTH ENDPOINTS

### POST /api/auth/register
**Description**: Register a new user

**Request**:
```json
{
  "email": "minh@example.com",
  "password": "123456",
  "name": "Minh"
}
```

**Response** *(201)*:
```json
{
  "user": {
    "id": "user-1772250131979",
    "email": "minh@example.com",
    "name": "Minh"
  }
}
```

---

### POST /api/auth/login
**Description**: Login user, returns JWT token

**Request**:
```json
{
  "email": "minh@example.com",
  "password": "123456"
}
```

**Response** *(200)*:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItMTIzIn0.abc123",
  "user": {
    "id": "user-123",
    "email": "minh@example.com"
  }
}
```

**Note**: Use `Authorization: Bearer <accessToken>` header for all subsequent API calls.

---

## 2️⃣ DEVICES ENDPOINTS

All devices endpoints require:
```
Headers: {
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

### GET /api/devices
**Description**: List all devices for current user

**Response** *(200)*:
```json
[
  {
    "id": "dev-001",
    "userId": "user-123",
    "deviceCode": "esp32-01",
    "displayName": "Chậu lan",
    "thresholdMoisture": 40,
    "online": true,
    "lastSeenAt": "2026-02-28T08:30:00Z",
    "isActive": true,
    "createdAt": "2026-02-20T10:00:00Z"
  }
]
```

---

### POST /api/devices
**Description**: Add new device

**Request**:
```json
{
  "deviceCode": "esp32-01",
  "displayName": "Chậu lan",
  "deviceSecret": "abc123secure",
  "thresholdMoisture": 40
}
```

**Response** *(201)*:
```json
{
  "id": "dev-1772250131979",
  "deviceCode": "esp32-01"
}
```

---

### PATCH /api/devices/:deviceId
**Description**: Update device settings

**Request**:
```json
{
  "displayName": "Chậu lan ban công",
  "thresholdMoisture": 45,
  "isActive": true
}
```

**Response** *(200)*:
```json
{
  "id": "dev-001",
  "deviceCode": "esp32-01",
  "displayName": "Chậu lan ban công",
  "thresholdMoisture": 45,
  "isActive": true
}
```

---

### DELETE /api/devices/:deviceId
**Description**: Delete a device

**Response** *(200)*:
```json
{
  "message": "Device deleted successfully"
}
```

---

## 3️⃣ IRRIGATION HISTORY ENDPOINTS

### GET /api/devices/:deviceId/irrigations
**Description**: Get irrigation logs (with pagination)

**Query Parameters**:
- `limit`: Number of records (default: 50)
- `offset`: Pagination offset (default: 0)

**Example**: `GET /api/devices/dev-001/irrigations?limit=50&offset=0`

**Response** *(200)*:
```json
{
  "items": [
    {
      "id": 123,
      "startedAt": "2026-02-28T01:10:00Z",
      "endedAt": "2026-02-28T01:12:00Z",
      "durationSec": 120,
      "moistureBefore": 32,
      "moistureAfter": 48,
      "reason": "AUTO"
    },
    {
      "id": 122,
      "startedAt": "2026-02-27T06:00:00Z",
      "endedAt": "2026-02-27T06:02:30Z",
      "durationSec": 150,
      "moistureBefore": 28,
      "moistureAfter": 52,
      "reason": "AUTO"
    }
  ],
  "total": 2
}
```

---

## 4️⃣ STATISTICS / ANALYTICS ENDPOINTS

### GET /api/devices/:deviceId/stats
**Description**: Get irrigation statistics for charting

**Query Parameters**:
- `range`: `day` | `week` | `month` (default: `week`)
- `metric`: `duration` | `count` (default: `duration`)

**Example**: `GET /api/devices/dev-001/stats?range=week&metric=duration`

**Response** *(200)* - Duration Metric:
```json
{
  "range": "week",
  "metric": "duration",
  "unit": "minutes",
  "series": [
    {
      "bucket": "2026-02-22",
      "value": 12.5
    },
    {
      "bucket": "2026-02-23",
      "value": 0
    },
    {
      "bucket": "2026-02-24",
      "value": 8.0
    },
    {
      "bucket": "2026-02-25",
      "value": 15.3
    },
    {
      "bucket": "2026-02-26",
      "value": 10.0
    },
    {
      "bucket": "2026-02-27",
      "value": 9.5
    },
    {
      "bucket": "2026-02-28",
      "value": 2.0
    }
  ]
}
```

**Response** *(200)* - Count Metric:
```json
{
  "range": "week",
  "metric": "count",
  "unit": "count",
  "series": [
    {
      "bucket": "2026-02-22",
      "value": 3
    },
    {
      "bucket": "2026-02-23",
      "value": 0
    }
  ]
}
```

---

## 5️⃣ COMMANDS / PUMP CONTROL ENDPOINTS

### POST /api/devices/:deviceId/commands
**Description**: Send command to device (e.g., turn pump on)

**Request**:
```json
{
  "type": "PUMP_ON",
  "durationSec": 60
}
```

**Response** *(201)*:
```json
{
  "commandId": "cmd-1772250132100",
  "status": "QUEUED"
}
```

---

### GET /api/devices/:deviceId/commands
**Description**: Get commands for a device

**Query Parameters**:
- `status`: Filter by status (`QUEUED`, `COMPLETED`, `FAILED`)

**Example**: `GET /api/devices/dev-001/commands?status=QUEUED`

**Response** *(200)*:
```json
[
  {
    "id": "cmd-001",
    "type": "PUMP_ON",
    "durationSec": 60,
    "status": "COMPLETED",
    "createdAt": "2026-02-28T07:00:00Z",
    "completedAt": "2026-02-28T07:01:00Z"
  },
  {
    "id": "cmd-002",
    "type": "PUMP_ON",
    "durationSec": 120,
    "status": "QUEUED",
    "createdAt": "2026-02-28T08:00:00Z"
  }
]
```

---

## ❌ ERROR RESPONSES

### 400 Bad Request
```json
{
  "message": "email and password are required",
  "code": "INVALID_REQUEST"
}
```

### 404 Not Found  
```json
{
  "message": "Device not found",
  "code": "NOT_FOUND"
}
```

---

## 🔐 Authentication Flow

1. **Register**: `POST /api/auth/register`
2. **Login**: `POST /api/auth/login` → Get `accessToken`
3. **Use Token**: Add header `Authorization: Bearer <accessToken>` to all subsequent requests
4. **Access Devices**: `GET /api/devices`, `POST /api/devices/:deviceId/commands`, etc.

---

## 📝 Notes for Frontend/Testing

- All timestamps are in ISO 8601 format (`YYYY-MM-DDTHH:mm:ssZ`)
- Field names use `camelCase`
- IDs are strings (device IDs start with `dev-`, user IDs start with `user-`, command IDs start with `cmd-`)
- Pagination uses `limit` and `offset` pattern
- Stats use date buckets in `YYYY-MM-DD` format
- For testing without real JWT, mock middleware provides default user: `user-123`
