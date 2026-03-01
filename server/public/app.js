const tokenKey = "irrigation_access_token";
const userKey = "irrigation_user";

const state = {
  token: localStorage.getItem(tokenKey),
  user: readUser(),
  devices: [],
  selectedDeviceId: null,
  refreshTimer: null,
};

const authView = document.getElementById("auth-view");
const dashboardView = document.getElementById("dashboard-view");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");
const authMessage = document.getElementById("auth-message");

const welcomeEl = document.getElementById("welcome");
const logoutBtn = document.getElementById("logout-btn");
const refreshBtn = document.getElementById("refresh-btn");
const deviceSelect = document.getElementById("device-select");
const deviceStatus = document.getElementById("device-status");
const dashboardMessage = document.getElementById("dashboard-message");

const addDeviceForm = document.getElementById("add-device-form");
const addDeviceMessage = document.getElementById("add-device-message");
const deleteDeviceBtn = document.getElementById("delete-device-btn");
const configForm = document.getElementById("config-form");
const pumpForm = document.getElementById("pump-form");
const pumpOffBtn = document.getElementById("pump-off-btn");
const irrigationList = document.getElementById("irrigation-list");
const commandList = document.getElementById("command-list");

tabLogin.addEventListener("click", () => switchAuthTab("login"));
tabRegister.addEventListener("click", () => switchAuthTab("register"));
loginForm.addEventListener("submit", onLogin);
registerForm.addEventListener("submit", onRegister);
logoutBtn.addEventListener("click", onLogout);
refreshBtn.addEventListener("click", () => refreshDashboard(true));
deviceSelect.addEventListener("change", onChangeDevice);
addDeviceForm.addEventListener("submit", onAddDevice);
deleteDeviceBtn.addEventListener("click", onDeleteDevice);
configForm.addEventListener("submit", onSaveConfig);
pumpForm.addEventListener("submit", onPumpOn);
pumpOffBtn.addEventListener("click", onPumpOff);

init();

function readUser() {
  const raw = localStorage.getItem(userKey);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function init() {
  if (state.token) {
    setAuthedView();
    refreshDashboard(true);
    return;
  }
  setAuthView();
}

function switchAuthTab(tab) {
  const isLogin = tab === "login";
  tabLogin.classList.toggle("active", isLogin);
  tabRegister.classList.toggle("active", !isLogin);
  loginForm.classList.toggle("hidden", !isLogin);
  registerForm.classList.toggle("hidden", isLogin);
  setMessage(authMessage, "");
}

function setAuthView() {
  clearInterval(state.refreshTimer);
  state.refreshTimer = null;
  authView.classList.remove("hidden");
  dashboardView.classList.add("hidden");
}

function setAuthedView() {
  authView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
  welcomeEl.textContent = state.user
    ? `Xin chào ${state.user.name || state.user.email}`
    : "Đã đăng nhập";
  if (!state.refreshTimer) {
    state.refreshTimer = setInterval(() => {
      refreshDashboard(false);
    }, 5000);
  }
}

async function onLogin(event) {
  event.preventDefault();
  const form = new FormData(loginForm);
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");

  try {
    setMessage(authMessage, "Đang đăng nhập...");
    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    saveSession(data.accessToken, data.user);
    setMessage(authMessage, "Đăng nhập thành công");
    setAuthedView();
    await refreshDashboard(true);
  } catch (error) {
    setMessage(authMessage, normalizeError(error));
  }
}

async function onRegister(event) {
  event.preventDefault();
  const form = new FormData(registerForm);
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");

  try {
    setMessage(authMessage, "Đang tạo tài khoản...");
    await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    setMessage(authMessage, "Đăng ký thành công, vui lòng đăng nhập");
    registerForm.reset();
    switchAuthTab("login");
  } catch (error) {
    setMessage(authMessage, normalizeError(error));
  }
}

function onLogout() {
  clearSession();
  setAuthView();
  setMessage(dashboardMessage, "");
  setMessage(authMessage, "Đã đăng xuất");
}

async function refreshDashboard(showMessage) {
  if (!state.token) {
    return;
  }

  try {
    const devices = await api("/api/devices");
    state.devices = Array.isArray(devices) ? devices : [];
    ensureSelectedDevice();
    renderDeviceSelect();

    if (!state.selectedDeviceId) {
      renderNoDevice();
      if (showMessage) {
        setMessage(dashboardMessage, "Chưa có thiết bị nào cho tài khoản này");
      }
      return;
    }

    await Promise.all([loadIrrigations(), loadCommands()]);
    renderSelectedDeviceInfo();
    if (showMessage) {
      setMessage(dashboardMessage, "Đã cập nhật dữ liệu");
    }
  } catch (error) {
    if (isUnauthorized(error)) {
      onLogout();
      setMessage(authMessage, "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại");
      return;
    }
    setMessage(dashboardMessage, normalizeError(error));
  }
}

function ensureSelectedDevice() {
  if (state.devices.length === 0) {
    state.selectedDeviceId = null;
    return;
  }

  const stillExists = state.devices.some((d) => d.id === state.selectedDeviceId);
  if (!stillExists) {
    state.selectedDeviceId = state.devices[0].id;
  }
}

function renderDeviceSelect() {
  deviceSelect.innerHTML = "";
  for (const device of state.devices) {
    const option = document.createElement("option");
    option.value = device.id;
    option.textContent = `${device.displayName} (${device.deviceCode})`;
    if (device.id === state.selectedDeviceId) {
      option.selected = true;
    }
    deviceSelect.append(option);
  }
  deviceSelect.disabled = state.devices.length === 0;
}

function renderSelectedDeviceInfo() {
  const device = getSelectedDevice();
  if (!device) {
    renderNoDevice();
    return;
  }

  const modeField = configForm.elements.namedItem("mode");
  const thresholdField = configForm.elements.namedItem("thresholdMoisture");
  modeField.value = device.mode || "AUTO";
  thresholdField.value = Number.isFinite(Number(device.thresholdMoisture))
    ? Number(device.thresholdMoisture)
    : 45;

  const onlineLabel = device.online ? "Online" : "Offline";
  const lastSeenText = device.lastSeenAt
    ? new Date(device.lastSeenAt).toLocaleString("vi-VN")
    : "-";
  deviceStatus.textContent = `Trạng thái: ${onlineLabel} • Last seen: ${lastSeenText}`;
}

function renderNoDevice() {
  deviceStatus.textContent = "Không có thiết bị";
  irrigationList.innerHTML = "<li>Không có dữ liệu</li>";
  commandList.innerHTML = "<li>Không có dữ liệu</li>";
}

function onChangeDevice() {
  state.selectedDeviceId = deviceSelect.value || null;
  refreshDashboard(true);
}

async function onAddDevice(event) {
  event.preventDefault();
  const form = new FormData(addDeviceForm);
  const deviceCode = String(form.get("deviceCode") || "").trim();
  const displayName = String(form.get("displayName") || "").trim();
  const deviceSecret = String(form.get("deviceSecret") || "").trim();

  try {
    setMessage(addDeviceMessage, "Đang thêm thiết bị...");
    await api("/api/devices", {
      method: "POST",
      body: JSON.stringify({ deviceCode, displayName, deviceSecret }),
    });
    addDeviceForm.reset();
    setMessage(addDeviceMessage, "✅ Đã thêm thiết bị thành công");
    await refreshDashboard(true);
  } catch (error) {
    setMessage(addDeviceMessage, normalizeError(error));
  }
}

async function onDeleteDevice() {
  const deviceId = state.selectedDeviceId;
  if (!deviceId) {
    setMessage(dashboardMessage, "Vui lòng chọn thiết bị để xóa");
    return;
  }

  const device = getSelectedDevice();
  const confirmMsg = `Bạn chắc chắn muốn xóa thiết bị "${device.displayName}"? Hành động này không thể hoàn tác.`;
  
  if (!window.confirm(confirmMsg)) {
    return;
  }

  try {
    setMessage(dashboardMessage, "Đang xóa thiết bị...");
    await api(`/api/devices/${deviceId}`, {
      method: "DELETE",
    });
    setMessage(dashboardMessage, "✅ Đã xóa thiết bị thành công");
    await refreshDashboard(true);
  } catch (error) {
    setMessage(dashboardMessage, normalizeError(error));
  }
}

async function onSaveConfig(event) {
  event.preventDefault();
  const deviceId = state.selectedDeviceId;
  if (!deviceId) {
    return;
  }

  const form = new FormData(configForm);
  const displayName = String(form.get("displayName") || "").trim();
  const mode = String(form.get("mode") || "AUTO");
  const thresholdMoisture = Number(form.get("thresholdMoisture"));

  try {
    setMessage(dashboardMessage, "Đang lưu cấu hình...");
    await api(`/api/devices/${deviceId}`, {
      method: "PATCH",
      body: JSON.stringify({ displayName, mode, thresholdMoisture }),
    });
    setMessage(dashboardMessage, "✅ Đã lưu cấu hình");
    await refreshDashboard(false);
  } catch (error) {
    setMessage(dashboardMessage, normalizeError(error));
  }
}

async function onPumpOn(event) {
  event.preventDefault();
  const deviceId = state.selectedDeviceId;
  if (!deviceId) {
    return;
  }

  const form = new FormData(pumpForm);
  const durationSec = Number(form.get("durationSec"));

  try {
    await api(`/api/devices/${deviceId}/commands`, {
      method: "POST",
      body: JSON.stringify({ type: "PUMP_ON", durationSec }),
    });
    setMessage(dashboardMessage, "Đã gửi lệnh bật bơm");
    await loadCommands();
  } catch (error) {
    setMessage(dashboardMessage, normalizeError(error));
  }
}

async function onPumpOff() {
  const deviceId = state.selectedDeviceId;
  if (!deviceId) {
    return;
  }

  try {
    await api(`/api/devices/${deviceId}/commands`, {
      method: "POST",
      body: JSON.stringify({ type: "PUMP_OFF" }),
    });
    setMessage(dashboardMessage, "Đã gửi lệnh tắt bơm");
    await loadCommands();
  } catch (error) {
    setMessage(dashboardMessage, normalizeError(error));
  }
}

async function loadIrrigations() {
  const deviceId = state.selectedDeviceId;
  if (!deviceId) {
    irrigationList.innerHTML = "<li>Không có dữ liệu</li>";
    return;
  }

  const data = await api(`/api/devices/${deviceId}/irrigations?limit=5&offset=0`);
  const items = data?.items || [];

  if (items.length === 0) {
    irrigationList.innerHTML = "<li>Chưa có lịch sử tưới</li>";
    return;
  }

  irrigationList.innerHTML = "";
  for (const item of items) {
    const li = document.createElement("li");
    const startedAt = new Date(item.startedAt).toLocaleString("vi-VN");
    li.textContent = `${startedAt} • ${item.durationSec}s • ${item.reason || "AUTO"}`;
    irrigationList.append(li);
  }
}

async function loadCommands() {
  const deviceId = state.selectedDeviceId;
  if (!deviceId) {
    commandList.innerHTML = "<li>Không có dữ liệu</li>";
    return;
  }

  const items = await api(`/api/devices/${deviceId}/commands`);
  const top = Array.isArray(items) ? items.slice(0, 5) : [];

  if (top.length === 0) {
    commandList.innerHTML = "<li>Chưa có lệnh</li>";
    return;
  }

  commandList.innerHTML = "";
  for (const item of top) {
    const li = document.createElement("li");
    const issuedAt = new Date(item.issuedAt).toLocaleString("vi-VN");
    const duration = item.durationSec ? ` ${item.durationSec}s` : "";
    li.textContent = `${issuedAt} • ${item.type}${duration} • ${item.status}`;
    commandList.append(li);
  }
}

function saveSession(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem(tokenKey, token);
  localStorage.setItem(userKey, JSON.stringify(user));
}

function clearSession() {
  state.token = null;
  state.user = null;
  state.devices = [];
  state.selectedDeviceId = null;
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
}

function getSelectedDevice() {
  return state.devices.find((d) => d.id === state.selectedDeviceId) || null;
}

function setMessage(element, text) {
  element.textContent = text;
}

function normalizeError(error) {
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error.message === "string") {
    return error.message;
  }
  return "Có lỗi xảy ra";
}

function isUnauthorized(error) {
  return error && (error.status === 401 || error.status === 403);
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const error = {
      status: response.status,
      message:
        data?.message || data?.error || `Request failed (${response.status})`,
    };
    throw error;
  }

  return data;
}