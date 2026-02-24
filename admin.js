// GazNav Admin CRUD (localStorage orqali)
// Viloyat -> Tuman ierarxiyasi

const LS_KEY = "gaznav-state-v1";

const ADMIN_I18N = {
  uz: {
    adminBack: "← Orqaga",
    adminTitle: "Admin Panel",
    adminRegionsTitle: "Viloyat va Tumanlar",
    adminStationsTitle: "Zapravkalar",
    adminRegion: "Viloyat",
    adminDistrict: "Tuman",
    adminAdd: "Qo'shish",
    adminSelectStation: "Zapravkani tanlang",
    adminName: "Nomi",
    adminFuels: "Yonilg'i turlari (vergul bilan)",
    adminOpenTime: "Ochilish vaqti",
    adminStatus: "Status",
    adminSave: "Saqlash",
    adminAddNew: "Yangi zapravka qo'shish",
    adminDelete: "O'chirish",
    statusOpen: "Ochilgan",
    statusClosed: "Yopiq"
  },
  ru: {
    adminBack: "← Назад",
    adminTitle: "Админ-панель",
    adminRegionsTitle: "Области и районы",
    adminStationsTitle: "Заправки",
    adminRegion: "Область",
    adminDistrict: "Район",
    adminAdd: "Добавить",
    adminSelectStation: "Выберите заправку",
    adminName: "Название",
    adminFuels: "Типы топлива (через запятую)",
    adminOpenTime: "Время работы",
    adminStatus: "Статус",
    adminSave: "Сохранить",
    adminAddNew: "Добавить новую АЗС",
    adminDelete: "Удалить",
    statusOpen: "Открыто",
    statusClosed: "Закрыто"
  }
};

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { stations: [], locations: [], theme: "dark", language: "uz" };
    const parsed = JSON.parse(raw);
    return { language: "uz", ...parsed };
  } catch {
    return { stations: [], locations: [], theme: "dark", language: "uz" };
  }
}

function saveState(nextState) {
  localStorage.setItem(LS_KEY, JSON.stringify(nextState));
}

let state = loadState();
if (!state.language) state.language = "uz";

function applyAdminI18n() {
  const dict = ADMIN_I18N[state.language] || ADMIN_I18N.uz;
  document.querySelectorAll("[data-i18n]").forEach(node => {
    const key = node.getAttribute("data-i18n");
    if (dict[key]) node.textContent = dict[key];
  });
}

// Theme sync (index bilan bir xil ko'rinish uchun)
if (state.theme === "light") document.body.classList.add("theme-light");

// Elements
const adminCityName = document.getElementById("adminCityName");
const adminDistrictName = document.getElementById("adminDistrictName");
const adminAddLocation = document.getElementById("adminAddLocation");
const locationsList = document.getElementById("locationsList");

const adminStationSelect = document.getElementById("adminStationSelect");
const adminName = document.getElementById("adminName");
const adminCity = document.getElementById("adminCity");
const adminDistrict = document.getElementById("adminDistrict");
const adminFuels = document.getElementById("adminFuels");
const adminTags = document.getElementById("adminTags");
const adminOpenTime = document.getElementById("adminOpenTime");
const adminStatus = document.getElementById("adminStatus");
const adminLat = document.getElementById("adminLat");
const adminLng = document.getElementById("adminLng");

const adminSaveBtn = document.getElementById("adminSave");
const adminAddNewBtn = document.getElementById("adminAddNew");
const adminDeleteBtn = document.getElementById("adminDelete");
const stationsList = document.getElementById("stationsList");

function ensureLocations() {
  if (!Array.isArray(state.locations)) state.locations = [];
  for (const s of state.stations || []) {
    const region = s.region || "Toshkent viloyati";
    const district = s.district || "";
    let loc = state.locations.find(l => (l.region || l.city) === region);
    if (!loc) {
      loc = { region, city: region, districts: [] };
      state.locations.push(loc);
    }
    if (district && !loc.districts.includes(district)) loc.districts.push(district);
  }
  state.locations.sort((a, b) => (a.region || a.city || "").localeCompare(b.region || b.city || ""));
  state.locations.forEach(l => (l.districts || []).sort((a, b) => a.localeCompare(b)));
}

function renderLocations() {
  ensureLocations();
  if (locationsList) {
    locationsList.innerHTML = "";
    for (const loc of state.locations) {
      const el = document.createElement("div");
      el.className = "admin-list-item";
      el.innerHTML = `<span>${loc.city}</span><span style="color: var(--text-muted); font-size: 12px;">${(loc.districts || []).join(", ")}</span>`;
      locationsList.appendChild(el);
    }
  }

  adminCity.innerHTML = "";
  for (const loc of state.locations) {
    const opt = document.createElement("option");
    const val = loc.region || loc.city;
    opt.value = val;
    opt.textContent = val;
    adminCity.appendChild(opt);
  }
}

function renderDistrictSelect(selectedCity) {
  const city = selectedCity || adminCity.value;
  const loc = (state.locations || []).find(l => (l.region || l.city) === city);
  const districts = (loc && loc.districts) || [];
  adminDistrict.innerHTML = "";
  for (const d of districts) {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    adminDistrict.appendChild(opt);
  }
}

function renderStationsSelect(currentId) {
  adminStationSelect.innerHTML = "";
  for (const s of state.stations || []) {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.name || `Zapravka #${s.id}`;
    adminStationSelect.appendChild(opt);
  }
  if (currentId != null) adminStationSelect.value = currentId;
}

function renderStationsList() {
  if (!stationsList) return;
  stationsList.innerHTML = "";
  for (const s of state.stations || []) {
    const el = document.createElement("div");
    el.className = "admin-list-item";
    el.innerHTML = `
      <div>
        <span style="font-weight: 600;">${s.name}</span>
        <span style="color: var(--text-muted); font-size: 12px; margin-left: 8px;">
          ${s.region || ""}${s.region && s.district ? " · " : ""}${s.district || ""}
        </span>
      </div>
      <span style="color: ${s.status === "open" ? "var(--accent)" : "var(--text-muted)"}; font-size: 12px;">
        ${s.status === "open" ? "Ochilgan" : "Yopiq"}
      </span>
    `;
    el.addEventListener("click", () => {
      adminStationSelect.value = s.id;
      fillForm(s.id);
    });
    stationsList.appendChild(el);
  }
}

function fillForm(stationId) {
  const s = (state.stations || []).find(st => st.id === Number(stationId));
  if (!s) {
    adminName.value = "";
    adminCity.value = "";
    adminDistrict.value = "";
    adminFuels.value = "";
    adminTags.value = "";
    adminOpenTime.value = "";
    adminStatus.value = "closed";
    adminLat.value = "";
    adminLng.value = "";
    return;
  }
  adminName.value = s.name || "";
  adminCity.value = s.region || "";
  renderDistrictSelect(s.region);
  adminDistrict.value = s.district || "";
  adminFuels.value = (s.fuels || []).join(",");
  adminTags.value = (s.tags || []).join(",");
  adminOpenTime.value = s.openTime || "";
  adminStatus.value = s.status === "open" ? "open" : "closed";
  adminLat.value = typeof s.lat === "number" ? s.lat : "";
  adminLng.value = typeof s.lng === "number" ? s.lng : "";
}

let currentStationId = null;

adminStationSelect.addEventListener("change", () => {
  currentStationId = Number(adminStationSelect.value);
  fillForm(currentStationId);
});

adminCity.addEventListener("change", () => {
  renderDistrictSelect();
});

adminAddLocation.addEventListener("click", () => {
  const region = (adminCityName.value || "").trim();
  const district = (adminDistrictName.value || "").trim();
  if (!region) {
    alert(state.language === "ru" ? "Введите название области!" : "Viloyat nomini kiriting!");
    return;
  }
  ensureLocations();
  let loc = state.locations.find(l => (l.region || l.city) === region);
  if (!loc) {
    loc = { region, city: region, districts: [] };
    state.locations.push(loc);
  }
  if (district && !loc.districts.includes(district)) loc.districts.push(district);
  state.locations.sort((a, b) => (a.region || a.city || "").localeCompare(b.region || b.city || ""));
  loc.districts.sort((a, b) => a.localeCompare(b));
  saveState(state);
  renderLocations();
  adminCityName.value = "";
  adminDistrictName.value = "";
});

adminSaveBtn.addEventListener("click", () => {
  if (!currentStationId) {
    alert("Avval zapravkani tanlang yoki 'Yangi qo'shish' tugmasini bosing!");
    return;
  }
  const s = (state.stations || []).find(st => st.id === currentStationId);
  if (!s) {
    alert("Zapravka topilmadi!");
    return;
  }
  const oldStatus = s.status;
  s.name = (adminName.value || "").trim() || s.name;
  s.region = adminCity.value || "";
  s.district = adminDistrict.value || "";
  s.fuels = (adminFuels.value || "")
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);
  s.tags = (adminTags.value || "")
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);
  s.openTime = (adminOpenTime.value || "").trim() || "24/7";
  s.status = adminStatus.value === "open" ? "open" : "closed";
  const lat = parseFloat(adminLat.value);
  const lng = parseFloat(adminLng.value);
  if (!isNaN(lat)) s.lat = lat;
  if (!isNaN(lng)) s.lng = lng;
  ensureLocations();
  saveState(state);
  renderLocations();
  renderStationsSelect(currentStationId);
  renderStationsList();
  fillForm(currentStationId);
  if (oldStatus !== "open" && s.status === "open") {
    localStorage.setItem(
      "lastNotification",
      JSON.stringify({ name: s.name, status: "ochildi", time: new Date().toISOString() })
    );
  }
  alert("Saqlandi!");
});

adminAddNewBtn.addEventListener("click", () => {
  const newId = ((state.stations || []).reduce((max, s) => Math.max(max, s.id || 0), 0)) + 1;
  const newStation = {
    id: newId,
    name: "Yangi zapravka",
    fuels: ["Metan"],
    tags: [],
    status: "closed",
    region: "",
    district: "",
    openTime: "24/7",
    lat: 41.33,
    lng: 69.29
  };
  state.stations = Array.isArray(state.stations) ? state.stations : [];
  state.stations.push(newStation);
  currentStationId = newId;
  saveState(state);
  renderStationsSelect(newId);
  renderStationsList();
  fillForm(newId);
});

adminDeleteBtn.addEventListener("click", () => {
  if (!currentStationId) {
    alert("Avval zapravkani tanlang!");
    return;
  }
  if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
  state.stations = (state.stations || []).filter(s => s.id !== currentStationId);
  currentStationId = null;
  saveState(state);
  renderStationsSelect(null);
  renderStationsList();
  fillForm(null);
});

const adminLangToggle = document.getElementById("adminLangToggle");
if (adminLangToggle) {
  adminLangToggle.addEventListener("click", () => {
    state.language = state.language === "uz" ? "ru" : "uz";
    saveState(state);
    applyAdminI18n();
  });
}

// Init
window.addEventListener("load", () => {
  applyAdminI18n();
  ensureLocations();
  renderLocations();
  renderStationsSelect(null);
  renderStationsList();
  if (state.stations && state.stations.length > 0) {
    currentStationId = state.stations[0].id;
    adminStationSelect.value = currentStationId;
    fillForm(currentStationId);
  }
});