// ======================
// Dastlabki ma'lumotlar
// ======================
const DEFAULT_STATE = {
  language: "uz",
  theme: "dark",
  filters: { fuels: [], tags: [], status: "" },
  favorites: [],
  cars: [],
  selectedRegion: "Toshkent viloyati",
  selectedDistrict: "",
  stations: [
    { id: 1, name: "UNG Petro", fuels: ["Metan", "Benzin"], status: "open", region: "Toshkent viloyati", district: "Yunusobod", tags: ["24/7"], openTime: "24/7", lat: 41.3275, lng: 69.2817 },
    { id: 2, name: "Real Gas", fuels: ["Metan"], status: "open", region: "Toshkent viloyati", district: "Chilonzor", tags: ["WC"], openTime: "08:00–23:00", lat: 41.32, lng: 69.295 },
    { id: 3, name: "Neo Oil", fuels: ["Benzin", "Dizel"], status: "closed", region: "Toshkent viloyati", district: "Mirzo Ulug'bek", tags: ["Kafe"], openTime: "24/7", lat: 41.329, lng: 69.27 }
  ]
};

const LS_KEY = "gaznav-state-v1";

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    const merged = { ...structuredClone(DEFAULT_STATE), ...parsed };
    if (!merged.filters.status) merged.filters.status = "";
    if (parsed.city && !parsed.selectedRegion) {
      merged.selectedRegion = parsed.city.includes("viloyati") ? parsed.city : parsed.city + " viloyati";
    }
    return merged;
  } catch { return structuredClone(DEFAULT_STATE); }
}

function saveState() { localStorage.setItem(LS_KEY, JSON.stringify(state)); }
let state = loadState();

const I18N = {
  uz: {
    subtitle: "Taxi style navigator", cityLabel: "Shahar", regionLabel: "Viloyat",
    headline: "Qayerga boramiz?", headlineSub: "Eng yaqin zapravkalar ro'yxati",
    searchPlaceholder: "Zapravka yoki manzil qidiring", panelTitle: "Zapravkani tanlang",
    badgeHint: "Filtr va qidiruv orqali tanlang", cabinetTitle: "Kabinet",
    cabinetSub: "Profil, filtrlar, sevimlilar va admin panel", filtersTitle: "Tez filtrlar",
    favTitle: "Sevimli zapravkalar", addCar: "Avtomobil qo'shish",
    addCarPrompt: "Avtomobil (masalan: Malibu 2)?", addCarQuality: "Sifat (Econom/Comfort/Business)?",
    adminPanel: "Admin panel", open: "Ochilgan", closed: "Yopiq", online: "Onlayn",
    favEmpty: "Hozircha sevimli zapravka yo'q.", noMatch: "Mos zapravka topilmadi",
    nearestFinding: "Eng yaqin zapravka topilmoqda…", nearest: "Eng yaqin",
    status: "Status", fuel: "Yonilg'i", time: "Vaqt", coords: "Koordinata",
    locationUnknown: "Lokatsiya kiritilmagan", geoDetecting: "Joylashuv aniqlanmoqda...",
    geoNear: "Sizga yaqin hudud", geoUnavailable: "Geolokatsiya mavjud emas",
    geoDisabled: "Geolokatsiya yoqilmagan. Masofa taxminiy.",
    filterAll: "Barchasi", statusOpen: "Ochiq", adminRegion: "Viloyat", adminDistrict: "Tuman"
  },
  ru: {
    subtitle: "Навигатор для АЗС", cityLabel: "Город", regionLabel: "Область",
    headline: "Куда едем?", headlineSub: "Список ближайших заправок",
    searchPlaceholder: "Поиск заправки или адреса", panelTitle: "Выберите заправку",
    badgeHint: "Выберите по фильтрам и поиску", cabinetTitle: "Кабинет",
    cabinetSub: "Профиль, фильтры, избранное и админка", filtersTitle: "Быстрые фильтры",
    favTitle: "Избранные АЗС", addCar: "Добавить автомобиль",
    addCarPrompt: "Автомобиль (например: Malibu 2)?", addCarQuality: "Класс (Econom/Comfort/Business)?",
    adminPanel: "Админ-панель", open: "Открыто", closed: "Закрыто", online: "Онлайн",
    favEmpty: "Избранных заправок пока нет.", noMatch: "Подходящие заправки не найдены",
    nearestFinding: "Поиск ближайшей заправки…", nearest: "Ближайшая",
    status: "Статус", fuel: "Топливо", time: "Время", coords: "Координаты",
    locationUnknown: "Локация не указана", geoDetecting: "Определение местоположения...",
    geoNear: "Ваш район", geoUnavailable: "Геолокация недоступна",
    geoDisabled: "Геолокация отключена. Расстояние приблизительное.",
    filterAll: "Все", statusOpen: "Открытые", adminRegion: "Область", adminDistrict: "Район"
  }
};

// DOM
const body = document.body;
const toastContainer = document.getElementById("toastContainer");
const searchInput = document.getElementById("searchInput");
const nearestLabel = document.getElementById("nearestLabel");
const userLocationLabel = document.getElementById("userLocationLabel");
const stationListEl = document.getElementById("stationList");
const topCardsEl = document.getElementById("topCards");
const panel = document.getElementById("orderPanel");
const dragHandle = document.getElementById("panelDrag");
const toggleBtn = document.getElementById("panelToggle");
const hideBtn = document.getElementById("panelHide");
const cabinet = document.getElementById("cabinetPanel");
const cabinetToggle = document.getElementById("cabinetToggle");
const cabinetBackdrop = document.getElementById("cabinetBackdrop");
const cabinetClose = document.getElementById("cabinetClose");
const langToggle = document.getElementById("langToggle");
const langLabel = document.getElementById("langLabel");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const regionValueEl = document.getElementById("regionValue");
const regionButton = document.getElementById("regionButton");
const regionPanel = document.getElementById("regionPanel");
const regionSelect = document.getElementById("regionSelect");
const districtSelect = document.getElementById("districtSelect");
const favoritesContainer = document.getElementById("favoritesContainer");
const filterChips = Array.from(document.querySelectorAll("#filtersContainer .chip"));
const addCarBtn = document.getElementById("addCarBtn");
const carsListEl = document.getElementById("carsList");
const stationModal = document.getElementById("stationModal");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalClose = document.getElementById("modalClose");
const modalBody = document.getElementById("modalBody");
const notifyBtn = document.getElementById("notifyBtn");
const panelFilterChips = Array.from(document.querySelectorAll(".panel-filter-chip[data-filter-fuel], .panel-filter-chip[data-filter-tag], .panel-filter-chip[data-filter-status]"));
const filterAllBtn = document.getElementById("filterAll");

// ======================
// Toast
// ======================
function showToast(message, type) {
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<span class="toast__dot"></span><span>${message}</span>`;
  toastContainer.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transform = "translateY(-6px)"; setTimeout(() => el.remove(), 200); }, 3000);
}

// ======================
// Yandex Taxi uslubida ovozlar
// ======================
function _playTones(notes, vol) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    notes.forEach(([freq, delay, dur]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.value = 0.0001;
      o.connect(g);
      g.connect(ctx.destination);
      const t = ctx.currentTime + delay;
      o.start(t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.stop(t + dur + 0.01);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch (_) {}
}

// Filtr bosish - kichik "tick"
function playFilterSound() { _playTones([[660, 0, 0.1]], 0.07); }

// Zapravka tanlash - Yandex Taxi ding-dong
function playSelectSound() { _playTones([[880, 0, 0.2], [1109, 0.15, 0.2]], 0.13); }

// Zapravka ochildi - 3 nota yuksaluvchi xursandchilik
function playOpenSound() { _playTones([[659, 0, 0.25], [783, 0.12, 0.25], [987, 0.24, 0.35]], 0.16); }

// ======================
// I18N va Tema
// ======================
function applyI18n() {
  const dict = I18N[state.language];
  document.querySelectorAll("[data-i18n]").forEach(n => { const k = n.getAttribute("data-i18n"); if (dict[k]) n.textContent = dict[k]; });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(n => { const k = n.getAttribute("data-i18n-placeholder"); if (dict[k]) n.placeholder = dict[k]; });
  langLabel.textContent = state.language.toUpperCase();
}

function applyTheme() {
  if (state.theme === "light") { body.classList.add("theme-light"); themeIcon.textContent = "🌙"; }
  else { body.classList.remove("theme-light"); themeIcon.textContent = "☀"; }
}

langToggle.addEventListener("click", () => { state.language = state.language === "uz" ? "ru" : "uz"; saveState(); applyI18n(); renderRegionDropdown(); renderAll(); });
themeToggle.addEventListener("click", () => { state.theme = state.theme === "dark" ? "light" : "dark"; saveState(); applyTheme(); });

// ======================
// Kabinet
// ======================
cabinetToggle.addEventListener("click", () => cabinet.classList.add("cabinet--open"));
cabinetClose.addEventListener("click", () => cabinet.classList.remove("cabinet--open"));
cabinetBackdrop.addEventListener("click", () => cabinet.classList.remove("cabinet--open"));

// ======================
// Kabinet filtr chiplar
// ======================
function syncFilterChipsUI() {
  filterChips.forEach(chip => {
    const fuel = chip.getAttribute("data-filter-fuel");
    const tag = chip.getAttribute("data-filter-tag");
    chip.classList.toggle("chip--on", fuel ? state.filters.fuels.includes(fuel) : tag ? state.filters.tags.includes(tag) : false);
  });
  syncPanelFilterChipsUI();
}

filterChips.forEach(chip => {
  chip.addEventListener("click", () => {
    const fuel = chip.getAttribute("data-filter-fuel");
    const tag = chip.getAttribute("data-filter-tag");
    if (fuel) { const i = state.filters.fuels.indexOf(fuel); i === -1 ? state.filters.fuels.push(fuel) : state.filters.fuels.splice(i, 1); }
    if (tag) { const i = state.filters.tags.indexOf(tag); i === -1 ? state.filters.tags.push(tag) : state.filters.tags.splice(i, 1); }
    saveState(); syncFilterChipsUI(); playFilterSound(); renderAll(); updateMapMarkers();
  });
});

// ======================
// PASTKI PANEL FILTRLAR (Drizo / Yandex Taxi uslubida)
// ======================
function syncPanelFilterChipsUI() {
  const hasAny = state.filters.fuels.length > 0 || state.filters.tags.length > 0 || state.filters.status !== "";
  if (filterAllBtn) filterAllBtn.classList.toggle("panel-filter-chip--active", !hasAny);
  panelFilterChips.forEach(chip => {
    const fuel = chip.getAttribute("data-filter-fuel");
    const tag = chip.getAttribute("data-filter-tag");
    const status = chip.getAttribute("data-filter-status");
    let on = false;
    if (fuel) on = state.filters.fuels.includes(fuel);
    if (tag) on = state.filters.tags.includes(tag);
    if (status) on = state.filters.status === status;
    chip.classList.toggle("panel-filter-chip--active", on);
  });
}

if (filterAllBtn) {
  filterAllBtn.addEventListener("click", () => {
    state.filters.fuels = []; state.filters.tags = []; state.filters.status = "";
    saveState(); syncFilterChipsUI(); playFilterSound(); renderAll(); updateMapMarkers();
  });
}

panelFilterChips.forEach(chip => {
  chip.addEventListener("click", () => {
    const fuel = chip.getAttribute("data-filter-fuel");
    const tag = chip.getAttribute("data-filter-tag");
    const status = chip.getAttribute("data-filter-status");
    if (fuel) { const i = state.filters.fuels.indexOf(fuel); i === -1 ? state.filters.fuels.push(fuel) : state.filters.fuels.splice(i, 1); }
    if (tag) { const i = state.filters.tags.indexOf(tag); i === -1 ? state.filters.tags.push(tag) : state.filters.tags.splice(i, 1); }
    if (status) state.filters.status = state.filters.status === status ? "" : status;
    saveState(); syncFilterChipsUI(); playFilterSound(); renderAll(); updateMapMarkers();
  });
});

// ======================
// Region / District
// ======================
function ensureRegions() {
  if (!Array.isArray(state.locations)) state.locations = [];
  for (const s of state.stations || []) {
    const region = s.region || "Toshkent viloyati";
    const district = s.district || "";
    let loc = state.locations.find(l => (l.region || l.city) === region);
    if (!loc) { loc = { region, city: region, districts: [] }; state.locations.push(loc); }
    if (district && !loc.districts.includes(district)) loc.districts.push(district);
  }
  state.locations.sort((a, b) => (a.region || a.city || "").localeCompare(b.region || b.city || ""));
  state.locations.forEach(l => (l.districts || []).sort((a, b) => a.localeCompare(b)));
}

function getDistrictsForRegion(region) {
  const loc = (state.locations || []).find(l => (l.region || l.city) === region);
  return (loc && loc.districts) || [];
}

function renderRegionDropdown() {
  if (!regionSelect || !districtSelect || !regionValueEl) return;
  ensureRegions();
  regionSelect.innerHTML = "";
  const oe = document.createElement("option"); oe.value = ""; oe.textContent = state.language === "ru" ? "Все области" : "Barcha viloyatlar"; regionSelect.appendChild(oe);
  for (const r of (state.locations || [])) { const o = document.createElement("option"); o.value = r.region || r.city; o.textContent = r.region || r.city; regionSelect.appendChild(o); }
  regionSelect.value = state.selectedRegion || "";
  districtSelect.innerHTML = "";
  const od = document.createElement("option"); od.value = ""; od.textContent = state.language === "ru" ? "Все районы" : "Barcha tumanlar"; districtSelect.appendChild(od);
  const districts = getDistrictsForRegion(state.selectedRegion || "");
  for (const d of districts) { const o = document.createElement("option"); o.value = d; o.textContent = d; districtSelect.appendChild(o); }
  districtSelect.value = state.selectedDistrict || "";
  const reg = state.selectedRegion || ""; const d = state.selectedDistrict || (districts[0] || "");
  regionValueEl.textContent = reg ? (d ? `${reg} · ${d}` : reg) : (state.language === "ru" ? "Область" : "Viloyat");
}

// ======================
// Filtr + Sort
// ======================
function getFilteredStations() {
  const q = (searchInput.value || "").trim().toLowerCase();
  return state.stations.map(s => ({ ...s })).filter(st => {
    if (state.selectedRegion && st.region !== state.selectedRegion) return false;
    if (state.selectedDistrict && st.district !== state.selectedDistrict) return false;
    if (q && !st.name.toLowerCase().startsWith(q)) return false;
    if (state.filters.fuels.length && !state.filters.fuels.some(f => st.fuels.includes(f))) return false;
    if (state.filters.tags.length && (!st.tags || !state.filters.tags.some(t => st.tags.includes(t)))) return false;
    if (state.filters.status && st.status !== state.filters.status) return false;
    return true;
  }).sort((a, b) => {
    const fA = state.favorites.includes(a.id), fB = state.favorites.includes(b.id);
    if (fA !== fB) return fA ? -1 : 1;
    if (a.status !== b.status) return a.status === "open" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

// ======================
// Favorites
// ======================
function toggleFavorite(id) {
  const i = state.favorites.indexOf(id);
  i === -1 ? state.favorites.push(id) : state.favorites.splice(i, 1);
  saveState(); renderAll();
}

function renderFavorites() {
  const favs = state.stations.filter(s => state.favorites.includes(s.id));
  if (!favs.length) { favoritesContainer.className = "cabinet__card cabinet__card--empty"; favoritesContainer.textContent = I18N[state.language].favEmpty; return; }
  favoritesContainer.className = "cabinet__card cabinet__card-list"; favoritesContainer.innerHTML = "";
  favs.forEach(s => { const d = document.createElement("div"); d.className = "cabinet__fav-item"; d.textContent = `${s.name} · ${s.openTime}`; d.addEventListener("click", () => openStationModal(s.id)); favoritesContainer.appendChild(d); });
}

// ======================
// Top kartalar
// ======================
function renderTopCards(list) {
  topCardsEl.innerHTML = "";
  list.slice(0, 2).forEach(s => {
    const c = document.createElement("article");
    c.className = "station-card";
    c.innerHTML = `<div class="station-header"><div class="station-title">${s.name}</div><div class="station-icon">⛽</div></div><div class="station-types">${s.fuels.map(f => `<span class="type-pill">${f}</span>`).join("")}<span class="status-dot"><span></span>${s.status === "open" ? I18N[state.language].online : I18N[state.language].closed}</span></div>`;
    c.addEventListener("click", () => { playSelectSound(); openStationModal(s.id); });
    topCardsEl.appendChild(c);
  });
}

// ======================
// Pastki list
// ======================
function renderStationsList(list) {
  stationListEl.innerHTML = "";
  list.forEach((st, idx) => {
    const isFav = state.favorites.includes(st.id);
    const el = document.createElement("div");
    el.className = "order-item" + (idx === 0 ? " order-item--nearest" : "");
    el.setAttribute("data-id", st.id);
    el.innerHTML = `
      <div class="order-item__icon"><span>⛽</span></div>
      <div class="order-item__main">
        <div class="order-item__title-row">
          <div class="order-item__name">${st.name}</div>
          <div class="order-item__distance">${st.distance != null ? st.distance.toFixed(1) + " km" : ""}</div>
          <button class="order-item__fav ${isFav ? "order-item__fav--on" : ""}" type="button">★</button>
        </div>
        <div class="order-item__meta">
          ${st.fuels.map(f => `<span class="order-pill">${f}</span>`).join("")}
          <span class="order-status"><span class="order-status__dot ${st.status !== "open" ? "order-status__dot--closed" : ""}"></span><span>${st.status === "open" ? I18N[state.language].open : I18N[state.language].closed}</span></span>
          <span class="order-pill">${st.openTime}</span>
        </div>
      </div>`;
    el.querySelector(".order-item__fav").addEventListener("click", e => { e.stopPropagation(); toggleFavorite(st.id); });
    el.addEventListener("click", () => { playSelectSound(); openStationModal(st.id); });
    stationListEl.appendChild(el);
  });
  nearestLabel.textContent = list.length > 0 ? `${I18N[state.language].nearest}: ${list[0].name}` : I18N[state.language].noMatch;
}

// ======================
// Modal
// ======================
function setModalOpen(open) {
  stationModal.classList.toggle("modal--open", open);
  stationModal.setAttribute("aria-hidden", String(!open));
}

function openStationModal(id) {
  const st = state.stations.find(s => s.id === Number(id));
  if (!st) return;
  const loc = `${st.region || ""}${st.region ? " · " : ""}${st.district || ""}`.trim();
  const coords = typeof st.lat === "number" ? `${st.lat.toFixed(5)}, ${st.lng.toFixed(5)}` : "-";
  modalBody.innerHTML = `
    <div class="modal-station">
      <div class="modal-station__header">
        <div class="modal-station__icon">⛽</div>
        <div>
          <div class="modal-station__title">${st.name}</div>
          <div style="color:var(--text-muted);font-size:12px;margin-top:2px;">${loc || I18N[state.language].locationUnknown}</div>
        </div>
      </div>
      <div class="modal-station__meta">
        <div class="modal-station__row"><span class="modal-station__label">${I18N[state.language].status}</span><span class="modal-station__value" style="color:${st.status==="open"?"var(--accent)":"var(--text-muted)"}">${st.status==="open"?I18N[state.language].open:I18N[state.language].closed}</span></div>
        <div class="modal-station__row"><span class="modal-station__label">${I18N[state.language].fuel}</span><span class="modal-station__value">${(st.fuels||[]).join(", ")||"-"}</span></div>
        <div class="modal-station__row"><span class="modal-station__label">${I18N[state.language].time}</span><span class="modal-station__value">${st.openTime||"-"}</span></div>
        <div class="modal-station__row"><span class="modal-station__label">${I18N[state.language].coords}</span><span class="modal-station__value">${coords}</span></div>
      </div>
      <div class="modal-station__map" id="modalMapContainer"></div>
    </div>`;
  setModalOpen(true);
  // Modal Yandex mini xarita
  if (typeof ymaps !== "undefined" && typeof st.lat === "number") {
    setTimeout(() => {
      const el = document.getElementById("modalMapContainer");
      if (!el || !el.offsetParent) return;
      if (el._yMap) try { el._yMap.destroy(); } catch(_){}
      ymaps.ready(() => {
        const m = new ymaps.Map("modalMapContainer", { center: [st.lat, st.lng], zoom: 16, controls: [] });
        m.geoObjects.add(new ymaps.Placemark([st.lat, st.lng], { hintContent: st.name }, { preset: getMarkerPreset(st) }));
        el._yMap = m;
      });
    }, 100);
  }
}

modalBackdrop.addEventListener("click", () => setModalOpen(false));
modalClose.addEventListener("click", () => setModalOpen(false));
document.addEventListener("keydown", e => { if (e.key === "Escape") setModalOpen(false); });

// ======================
// Avtomobil
// ======================
function renderCars() {
  if (!carsListEl) return;
  carsListEl.innerHTML = "";
  (state.cars || []).forEach(car => {
    const row = document.createElement("div");
    row.className = "cabinet__car-item";
    row.innerHTML = `<div class="cabinet__car-info"><span>🚗</span><span>${car.name}</span><span class="cabinet__car-quality">${car.quality}</span></div><button type="button" class="order-item__fav order-item__fav--on">✕</button>`;
    row.querySelector("button").addEventListener("click", () => { state.cars = (state.cars||[]).filter(c => c.id !== car.id); saveState(); renderCars(); });
    carsListEl.appendChild(row);
  });
}

if (addCarBtn) {
  addCarBtn.addEventListener("click", () => {
    const name = prompt(I18N[state.language].addCarPrompt); if (!name) return;
    const quality = prompt(I18N[state.language].addCarQuality, "Comfort") || "Comfort";
    state.cars = state.cars || []; state.cars.push({ id: Date.now(), name: name.trim(), quality: quality.trim() });
    saveState(); renderCars();
  });
}

// ======================
// YANDEX XARITA (asosiy)
// ======================
let mainMap = null;
let mapMarkers = [];

function getMarkerPreset(s) {
  if (s.status !== "open") return "islands#grayFuelStationIcon";
  if (s.fuels.includes("Metan")) return "islands#greenFuelStationIcon";
  if (s.fuels.includes("Benzin")) return "islands#orangeFuelStationIcon";
  if (s.fuels.includes("Dizel")) return "islands#yellowFuelStationIcon";
  return "islands#blueFuelStationIcon";
}

function updateMapMarkers() {
  if (!mainMap) return;
  mapMarkers.forEach(m => mainMap.geoObjects.remove(m));
  mapMarkers = [];
  const filteredIds = new Set(getFilteredStations().map(s => s.id));
  state.stations.forEach(s => {
    if (typeof s.lat !== "number" || typeof s.lng !== "number") return;
    const isFiltered = filteredIds.has(s.id);
    const pm = new ymaps.Placemark([s.lat, s.lng], {
      hintContent: s.name,
      balloonContent: `<div style="min-width:160px"><b style="font-size:14px">${s.name}</b><div style="color:#666;font-size:12px;margin-top:3px">${(s.fuels||[]).join(", ")}</div><div style="font-size:11px;margin-top:4px">${s.status==="open"?"✅ Ochiq":"🔴 Yopiq"} · ${s.openTime}</div></div>`
    }, { preset: isFiltered ? getMarkerPreset(s) : "islands#grayFuelStationIcon", opacity: isFiltered ? 1 : 0.3 });
    pm.events.add("click", () => { playSelectSound(); openStationModal(s.id); openPanel(); });
    mainMap.geoObjects.add(pm);
    mapMarkers.push(pm);
  });
}

function initMainMap() {
  const mapEl = document.getElementById("mainMap");
  if (!mapEl || typeof ymaps === "undefined") return;
  if (mainMap) { try { mainMap.destroy(); } catch(_){} mainMap = null; }
  const center = state.userPosition || { lat: 41.3275, lng: 69.2817 };
  mainMap = new ymaps.Map("mainMap", {
    center: [center.lat, center.lng],
    zoom: 12,
    controls: ["zoomControl", "geolocationControl"]
  }, { suppressMapOpenBlock: true });
  // Yandex copyright logosini yashirish
  try {
    const cp = mainMap.copyrights;
    if (cp && cp.togglePromo) cp.togglePromo(false);
  } catch(_){}
  updateMapMarkers();
}

// ======================
// Bildirishnomalar
// ======================
if (notifyBtn) {
  notifyBtn.addEventListener("click", async () => {
    if (!("Notification" in window)) { showToast("Brauzer qo'llab-quvvatlamaydi"); return; }
    const p = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    showToast(p === "granted" ? "Bildirishnomalar yoqildi ✓" : "Ruxsat berilmadi");
  });
}

// Storage event
let lastSnapshot = structuredClone(state);
window.addEventListener("storage", e => {
  if (e.key === "lastNotification" && e.newValue) {
    try { const n = JSON.parse(e.newValue); showToast(`${n.name}: ${n.status}`); } catch(_){}
    return;
  }
  if (e.key !== LS_KEY || !e.newValue) return;
  try {
    const next = JSON.parse(e.newValue);
    for (const ns of (next.stations || [])) {
      const ps = (lastSnapshot.stations||[]).find(s => s.id === ns.id);
      if (ps && ps.status !== "open" && ns.status === "open") {
        const msg = state.language === "ru" ? `${ns.name} открыта` : `${ns.name} ochildi`;
        showToast(msg); playOpenSound();
        if ("Notification" in window && Notification.permission === "granted") new Notification("GazNav", { body: msg });
      }
    }
    state = { ...structuredClone(DEFAULT_STATE), ...next };
    lastSnapshot = structuredClone(state);
    applyI18n(); applyTheme(); syncFilterChipsUI(); renderRegionDropdown(); renderAll(); renderCars(); updateMapMarkers();
  } catch(_){}
});

// ======================
// Geolokatsiya
// ======================
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371, toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  return R * 2 * Math.atan2(Math.sqrt(Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2), Math.sqrt(1 - Math.sin(dLat/2)**2 - Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2));
}

function applyDistancesAndRender(lat, lng) {
  renderAll(state.stations.map(s => ({ ...s, distance: distanceKm(lat, lng, s.lat, s.lng) })).sort((a, b) => a.distance - b.distance));
}

function initGeolocation() {
  const usePos = (lat, lng) => {
    state.userPosition = { lat, lng };
    userLocationLabel.textContent = `${I18N[state.language].geoNear}: ${lat.toFixed(3)}, ${lng.toFixed(3)}`;
    try { localStorage.setItem("gaznav-geo-cache", JSON.stringify({ lat, lng, timestamp: Date.now() })); } catch(_){}
    applyDistancesAndRender(lat, lng);
    if (mainMap) mainMap.setCenter([lat, lng], 13);
  };
  try {
    const c = JSON.parse(localStorage.getItem("gaznav-geo-cache") || "{}");
    if (c.lat != null && (Date.now() - (c.timestamp||0)) < 86400000) { usePos(c.lat, c.lng); navigator.geolocation && navigator.geolocation.getCurrentPosition(p => usePos(p.coords.latitude, p.coords.longitude), ()=>{}, {timeout:3000}); return; }
  } catch(_){}
  if (!navigator.geolocation) { userLocationLabel.textContent = I18N[state.language].geoUnavailable; renderAll(); return; }
  navigator.geolocation.getCurrentPosition(
    p => usePos(p.coords.latitude, p.coords.longitude),
    () => { userLocationLabel.textContent = I18N[state.language].geoDisabled; renderAll(); },
    { enableHighAccuracy: true, timeout: 5000 }
  );
}

// ======================
// Pastki panel drag
// ======================
let currentOffset = 0, collapsedOffset = 220, hiddenOffset = 320, isDragging = false, startY = 0, startOffset = 0;

function recalcOffsets() {
  const ph = panel.getBoundingClientRect().height;
  collapsedOffset = Math.min(ph * 0.55, window.innerHeight * 0.45);
  hiddenOffset = Math.max(ph - 22, collapsedOffset + 40);
  if (currentOffset === 0) setPanelOffset(0, false);
  else if (currentOffset >= hiddenOffset) setPanelOffset(hiddenOffset, false);
  else setPanelOffset(collapsedOffset, false);
}

function setPanelOffset(px, anim = true) {
  currentOffset = Math.max(0, Math.min(hiddenOffset, px));
  panel.classList.toggle("order-panel--dragging", !anim);
  panel.style.setProperty("--panel-translate", `${currentOffset}px`);
}

function openPanel() { setPanelOffset(0, true); toggleBtn.textContent = "▾"; }
function collapsePanel() { setPanelOffset(collapsedOffset, true); toggleBtn.textContent = "▴"; }
function hidePanel() { setPanelOffset(hiddenOffset, true); toggleBtn.textContent = "▴"; }

toggleBtn.addEventListener("click", () => currentOffset === 0 ? collapsePanel() : openPanel());
hideBtn.addEventListener("click", hidePanel);

function onDragStart(y) { isDragging = true; startY = y; startOffset = currentOffset; panel.classList.add("order-panel--dragging"); }
function onDragMove(y) { if (isDragging) setPanelOffset(startOffset + y - startY, false); }
function onDragEnd() {
  if (!isDragging) return;
  isDragging = false; panel.classList.remove("order-panel--dragging");
  const d = [Math.abs(currentOffset), Math.abs(currentOffset-collapsedOffset), Math.abs(currentOffset-hiddenOffset)];
  const m = Math.min(...d);
  if (m === d[0]) openPanel(); else if (m === d[1]) collapsePanel(); else hidePanel();
}

dragHandle.addEventListener("mousedown", e => { e.preventDefault(); onDragStart(e.clientY); window.addEventListener("mousemove", mm); window.addEventListener("mouseup", mu); });
function mm(e) { onDragMove(e.clientY); }
function mu() { onDragEnd(); window.removeEventListener("mousemove", mm); window.removeEventListener("mouseup", mu); }
dragHandle.addEventListener("touchstart", e => onDragStart(e.touches[0].clientY), { passive: true });
dragHandle.addEventListener("touchmove", e => onDragMove(e.touches[0].clientY), { passive: true });
dragHandle.addEventListener("touchend", onDragEnd);

// ======================
// Render
// ======================
function renderAll(withDist) {
  const all = withDist || state.stations;
  const filtered = getFilteredStations().map(s => { const wd = all.find(x => x.id === s.id); return wd?.distance != null ? { ...s, distance: wd.distance } : s; });
  renderTopCards(filtered); renderStationsList(filtered); renderFavorites();
}

searchInput.addEventListener("input", () => { renderAll(); updateMapMarkers(); });

if (regionButton && regionPanel) {
  regionButton.addEventListener("click", e => { e.stopPropagation(); regionPanel.classList.toggle("region-dropdown__panel--open"); });
  regionPanel.addEventListener("click", e => e.stopPropagation());
  document.addEventListener("click", () => regionPanel.classList.remove("region-dropdown__panel--open"));
}
if (regionSelect) {
  regionSelect.addEventListener("change", () => { state.selectedRegion = regionSelect.value || ""; state.selectedDistrict = ""; const d = getDistrictsForRegion(state.selectedRegion); if (d.length) state.selectedDistrict = d[0]; saveState(); renderRegionDropdown(); renderAll(); updateMapMarkers(); });
}
if (districtSelect) {
  districtSelect.addEventListener("change", () => { state.selectedDistrict = districtSelect.value || ""; saveState(); renderRegionDropdown(); renderAll(); updateMapMarkers(); });
}

// ======================
// Init
// ======================
window.addEventListener("load", () => {
  applyI18n(); applyTheme(); syncFilterChipsUI(); ensureRegions(); renderRegionDropdown();
  recalcOffsets(); openPanel(); initGeolocation(); renderCars(); renderAll();
  if (typeof ymaps !== "undefined") ymaps.ready(initMainMap);
  else setTimeout(() => { if (typeof ymaps !== "undefined") ymaps.ready(initMainMap); }, 3000);
});

window.addEventListener("resize", recalcOffsets);