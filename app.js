// ═══════════════════════════════════════════
// GazNav v3.0 — Asosiy dastur
// ═══════════════════════════════════════════
const DEFAULT_STATE = {
  language: "uz", theme: "dark",
  filters: { fuel:"", tag:"", status:"" },
  favorites: [], cars: [],
  selectedRegion: "Toshkent viloyati", selectedDistrict: "",
  profile: { name: "", phone: "" },
  settings: { notifications: false, sound: true },
  recentViewed: [],
  stations: [
    { id:1, name:"UNG Petro",  fuels:["Metan","Benzin"], status:"open",   region:"Toshkent viloyati", district:"Yunusobod",      tags:["24/7"], openTime:"24/7",       lat:41.3275, lng:69.2817 },
    { id:2, name:"Real Gas",   fuels:["Metan"],           status:"open",   region:"Toshkent viloyati", district:"Chilonzor",      tags:["WC"],   openTime:"08:00–23:00", lat:41.32,   lng:69.295  },
    { id:3, name:"Neo Oil",    fuels:["Benzin","Dizel"],  status:"closed", region:"Toshkent viloyati", district:"Mirzo Ulug'bek", tags:["Kafe"], openTime:"24/7",       lat:41.329,  lng:69.27   }
  ]
};
const LS_KEY = "gaznav-state-v1";
const USERS_KEY = "gaznav-users";

// Unikal foydalanuvchi ID
function getUserId() {
  let uid = localStorage.getItem("gaznav-uid");
  if (!uid) { uid = "u_" + Date.now() + "_" + Math.random().toString(36).slice(2,8); localStorage.setItem("gaznav-uid", uid); }
  return uid;
}

// Foydalanuvchi ma'lumotlarini umumiy ro'yxatga saqlash
function syncUserToRegistry() {
  try {
    const uid = getUserId();
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
    const geo = JSON.parse(localStorage.getItem("gaznav-geo-cache") || "{}");
    users[uid] = {
      id: uid,
      profile: state.profile || {},
      cars: state.cars || [],
      favorites: state.favorites || [],
      recentViewed: (state.recentViewed || []).slice(0, 15),
      settings: {
        language: state.language,
        theme: state.theme,
        notifications: state.settings?.notifications || false,
        sound: state.settings?.sound !== false,
        filterFuel: state.filters?.fuel || "",
        filterTag: state.filters?.tag || "",
        selectedRegion: state.selectedRegion || "",
        selectedDistrict: state.selectedDistrict || ""
      },
      geo: geo.lat != null ? { lat: geo.lat, lng: geo.lng, timestamp: geo.timestamp } : null,
      lastActive: Date.now(),
      registeredAt: users[uid]?.registeredAt || Date.now()
    };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch(_) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const p = JSON.parse(raw);
    const m = { ...structuredClone(DEFAULT_STATE), ...p };
    if (Array.isArray(m.filters?.fuels)) m.filters = { fuel: m.filters.fuels[0]||"", tag:"", status:"" };
    if (!m.filters) m.filters = { fuel:"", tag:"", status:"" };
    return m;
  } catch { return structuredClone(DEFAULT_STATE); }
}
function saveState() { localStorage.setItem(LS_KEY, JSON.stringify(state)); syncUserToRegistry(); }
let state = loadState();

// ── I18N ────────────────────────────────────
const I18N = {
  uz: {
    subtitle:"Taxi style navigator", regionLabel:"Viloyat",
    headline:"Qayerga boramiz?", headlineSub:"Eng yaqin zapravkalar ro'yxati",
    searchPlaceholder:"Zapravka yoki manzil qidiring", panelTitle:"Zapravkani tanlang",
    badgeHint:"Filtr va qidiruv orqali tanlang", cabinetTitle:"Kabinet",
    cabinetSub:"Profil, filtrlar, sevimlilar va admin panel",
    filtersTitle:"Tez filtrlar", favTitle:"Sevimli zapravkalar",
    addCar:"Qo'shish", addCarPrompt:"Avtomobil nomi?", addCarQuality:"Sifat (Econom/Comfort/Business)?",
    adminPanel:"Admin panel", open:"Ochiq", closed:"Yopiq", online:"Onlayn",
    favEmpty:"Sevimli zapravkalar yo'q.", noMatch:"Mos zapravka topilmadi",
    nearestFinding:"Eng yaqin zapravka topilmoqda…", nearest:"Eng yaqin",
    status:"Status", fuel:"Yonilg'i", time:"Vaqt", coords:"Koordinata",
    distance:"Masofa", navigate:"Navigatsiya",
    locationUnknown:"Manzil kiritilmagan", geoDetecting:"Joylashuv aniqlanmoqda...",
    geoNear:"Sizga yaqin hudud", geoUnavailable:"Geolokatsiya mavjud emas",
    geoDisabled:"Geolokatsiya yoqilmagan. Masofa taxminiy.",
    filterAll:"Barchasi", statusOpen:"Ochiq", adminRegion:"Viloyat", adminDistrict:"Tuman", km:"km",
    profileOnline:"Onlayn", profileNameLabel:"Ism", profilePhoneLabel:"Telefon",
    profileNamePlaceholder:"Ismingizni kiriting", profileSave:"Saqlash",
    statTotal:"Jami zapravka", statFavCount:"Sevimlilar", statCarsCount:"Avtolar",
    carsTitle:"Avtomobillarim", carsEmpty:"Avtomobil qo'shilmagan",
    recentTitle:"Oxirgi ko'rilganlar", recentEmpty:"Hali hech nima ko'rilmagan",
    settingsTitle:"Sozlamalar", settingDarkMode:"Tungi rejim",
    settingNotify:"Bildirishnomalar", settingSound:"Ovozli bildirishnoma",
    settingLang:"Til", clearFavs:"Tozalash", resetData:"Ma'lumotlarni tozalash",
    resetConfirm:"Barcha ma'lumotlar o'chirilsinmi?", profileSaved:"Profil saqlandi ✓",
    recentJustNow:"hozirgina", recentMinAgo:"min oldin"
  },
  ru: {
    subtitle:"Навигатор АЗС", regionLabel:"Область",
    headline:"Куда едем?", headlineSub:"Ближайшие заправки",
    searchPlaceholder:"Поиск АЗС или адреса", panelTitle:"Выберите заправку",
    badgeHint:"Фильтры и поиск", cabinetTitle:"Кабинет",
    cabinetSub:"Профиль, фильтры, избранное и админка",
    filtersTitle:"Быстрые фильтры", favTitle:"Избранные АЗС",
    addCar:"Добавить", addCarPrompt:"Название авто?", addCarQuality:"Класс (Эконом/Комфорт/Бизнес)?",
    adminPanel:"Админ-панель", open:"Открыто", closed:"Закрыто", online:"Онлайн",
    favEmpty:"Избранных нет.", noMatch:"Ничего не найдено",
    nearestFinding:"Поиск ближайшей…", nearest:"Ближайшая",
    status:"Статус", fuel:"Топливо", time:"Время", coords:"Координаты",
    distance:"Расстояние", navigate:"Навигация",
    locationUnknown:"Адрес не указан", geoDetecting:"Определение местоположения...",
    geoNear:"Ваш район", geoUnavailable:"Геолокация недоступна",
    geoDisabled:"Геолокация отключена.",
    filterAll:"Все", statusOpen:"Открытые", adminRegion:"Область", adminDistrict:"Район", km:"км",
    profileOnline:"Онлайн", profileNameLabel:"Имя", profilePhoneLabel:"Телефон",
    profileNamePlaceholder:"Введите имя", profileSave:"Сохранить",
    statTotal:"Всего АЗС", statFavCount:"Избранные", statCarsCount:"Авто",
    carsTitle:"Мои автомобили", carsEmpty:"Авто не добавлены",
    recentTitle:"Недавно просмотренные", recentEmpty:"Пока ничего не просмотрено",
    settingsTitle:"Настройки", settingDarkMode:"Тёмная тема",
    settingNotify:"Уведомления", settingSound:"Звук уведомлений",
    settingLang:"Язык", clearFavs:"Очистить", resetData:"Сбросить данные",
    resetConfirm:"Удалить все данные?", profileSaved:"Профиль сохранён ✓",
    recentJustNow:"только что", recentMinAgo:"мин назад"
  }
};

// ── DOM REFS ────────────────────────────────
const body             = document.body;
const toastContainer   = document.getElementById("toastContainer");
const searchInput      = document.getElementById("searchInput");
const nearestLabel     = document.getElementById("nearestLabel");
const userLocationLabel= document.getElementById("userLocationLabel");
const stationListEl    = document.getElementById("stationList");
const topCardsEl       = document.getElementById("topCards");
const panel            = document.getElementById("orderPanel");
const dragHandle       = document.getElementById("panelDrag");
const toggleBtn        = document.getElementById("panelToggle");
const hideBtn          = document.getElementById("panelHide");
const cabinet          = document.getElementById("cabinetPanel");
const cabinetToggle    = document.getElementById("cabinetToggle");
const cabinetBackdrop  = document.getElementById("cabinetBackdrop");
const cabinetClose     = document.getElementById("cabinetClose");
const langToggle       = document.getElementById("langToggle");
const langLabel        = document.getElementById("langLabel");
const themeToggle      = document.getElementById("themeToggle");
const themeIcon        = document.getElementById("themeIcon");
const regionValueEl    = document.getElementById("regionValue");
const regionButton     = document.getElementById("regionButton");
const regionPanel      = document.getElementById("regionPanel");
const regionSelect     = document.getElementById("regionSelect");
const districtSelect   = document.getElementById("districtSelect");
const favoritesContainer= document.getElementById("favoritesContainer");
const filterChips      = Array.from(document.querySelectorAll("#filtersContainer .chip"));
const addCarBtn        = document.getElementById("addCarBtn");
const carsListEl       = document.getElementById("carsList");
const stationModal     = document.getElementById("stationModal");
const modalBackdrop    = document.getElementById("modalBackdrop");
const modalClose       = document.getElementById("modalClose");
const modalBody        = document.getElementById("modalBody");
const notifyBtn        = document.getElementById("notifyBtn");
const filterAllBtn     = document.getElementById("filterAll");
const mapZoomIn        = document.getElementById("mapZoomIn");
const mapZoomOut       = document.getElementById("mapZoomOut");
const mapZoomLevel     = document.getElementById("mapZoomLevel");
const distancePanelLabel= document.getElementById("distancePanelLabel");
const distancePanelName = document.getElementById("distancePanelName");
const distancePanelValue= document.getElementById("distancePanelValue");
const adminPanelBtn    = document.getElementById("adminPanelBtn");
const adminPassModal   = document.getElementById("adminPassModal");
const adminPassBackdrop= document.getElementById("adminPassBackdrop");
const adminPassInput   = document.getElementById("adminPassInput");
const adminPassSubmit  = document.getElementById("adminPassSubmit");
const adminPassCancel  = document.getElementById("adminPassCancel");
const adminPassError   = document.getElementById("adminPassError");
const panelFilterChips = Array.from(document.querySelectorAll(".panel-filter-chip[data-filter-fuel],.panel-filter-chip[data-filter-tag],.panel-filter-chip[data-filter-status]"));

// Cabinet new refs
const cabProfileName   = document.getElementById("cabProfileName");
const cabProfileSub    = document.getElementById("cabProfileSub");
const cabNameInput     = document.getElementById("cabNameInput");
const cabPhoneInput    = document.getElementById("cabPhoneInput");
const cabProfileSave   = document.getElementById("cabProfileSave");
const cabStatTotal     = document.getElementById("cabStatTotal");
const cabStatFav       = document.getElementById("cabStatFav");
const cabStatCars      = document.getElementById("cabStatCars");
const carsEmptyHint    = document.getElementById("carsEmptyHint");
const clearFavsBtn     = document.getElementById("clearFavsBtn");
const recentContainer  = document.getElementById("recentContainer");
const cabThemeSwitch   = document.getElementById("cabThemeSwitch");
const cabNotifySwitch  = document.getElementById("cabNotifySwitch");
const cabSoundSwitch   = document.getElementById("cabSoundSwitch");
const cabLangSwitch    = document.getElementById("cabLangSwitch");
const cabLangLabel     = document.getElementById("cabLangLabel");
const cabResetBtn      = document.getElementById("cabResetBtn");

// ── TOAST ───────────────────────────────────
function showToast(msg, type="") {
  const el = document.createElement("div");
  el.className = "toast" + (type?" toast--"+type:"");
  el.innerHTML = `<span class="toast__dot"></span><span>${msg}</span>`;
  toastContainer.appendChild(el);
  setTimeout(() => { el.style.opacity="0"; el.style.transform="translateY(-6px)"; setTimeout(()=>el.remove(),200); }, 3200);
}

// ── AUDIO ───────────────────────────────────
function _playTones(notes,vol) {
  try {
    if(state.settings && state.settings.sound === false) return;
    const Ctx=window.AudioContext||window.webkitAudioContext; if(!Ctx) return;
    const ctx=new Ctx();
    notes.forEach(([freq,delay,dur])=>{
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.type="sine"; o.frequency.value=freq; g.gain.value=0.0001;
      o.connect(g); g.connect(ctx.destination);
      const t=ctx.currentTime+delay;
      o.start(t); g.gain.setValueAtTime(0.0001,t);
      g.gain.exponentialRampToValueAtTime(vol,t+.015);
      g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
      o.stop(t+dur+.01);
    });
    setTimeout(()=>ctx.close(),1500);
  } catch(_){}
}
function playFilterSound() { _playTones([[660,0,.1]],.07); }
function playSelectSound() { _playTones([[880,0,.2],[1109,.15,.2]],.13); }
function playOpenSound()   { _playTones([[659,0,.25],[783,.12,.25],[987,.24,.35]],.16); }

// ── I18N & THEME ────────────────────────────
function applyI18n() {
  const d = I18N[state.language];
  document.querySelectorAll("[data-i18n]").forEach(n=>{ const k=n.getAttribute("data-i18n"); if(d[k]) n.textContent=d[k]; });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(n=>{ const k=n.getAttribute("data-i18n-placeholder"); if(d[k]) n.placeholder=d[k]; });
  langLabel.textContent = state.language.toUpperCase();
}
function applyTheme() {
  if (state.theme==="light") { body.classList.add("theme-light"); themeIcon.textContent="🌙"; }
  else { body.classList.remove("theme-light"); themeIcon.textContent="☀"; }
}
langToggle.addEventListener("click", ()=>{ state.language=state.language==="uz"?"ru":"uz"; saveState(); applyI18n(); renderRegionDropdown(); renderAll(); });
themeToggle.addEventListener("click", ()=>{ state.theme=state.theme==="dark"?"light":"dark"; saveState(); applyTheme(); });

// ── KABINET ─────────────────────────────────
cabinetToggle.addEventListener("click",  ()=>{ cabinet.classList.add("cabinet--open"); syncCabinetUI(); });
cabinetClose.addEventListener("click",   ()=>cabinet.classList.remove("cabinet--open"));
cabinetBackdrop.addEventListener("click",()=>cabinet.classList.remove("cabinet--open"));

// Kabinet UI sinxronlash
function syncCabinetUI() {
  // Profil
  const prof = state.profile || {};
  if(cabProfileName) cabProfileName.textContent = prof.name || (state.language==="ru"?"Пользователь":"Foydalanuvchi");
  if(cabNameInput) cabNameInput.value = prof.name || "";
  if(cabPhoneInput) cabPhoneInput.value = prof.phone || "";
  // Stats
  if(cabStatTotal) cabStatTotal.textContent = (state.stations||[]).length;
  if(cabStatFav)   cabStatFav.textContent = (state.favorites||[]).length;
  if(cabStatCars)  cabStatCars.textContent = (state.cars||[]).length;
  // Settings switches
  if(cabThemeSwitch)  cabThemeSwitch.checked = state.theme==="dark";
  if(cabNotifySwitch) cabNotifySwitch.checked = state.settings?.notifications || false;
  if(cabSoundSwitch)  cabSoundSwitch.checked = state.settings?.sound !== false;
  if(cabLangLabel) cabLangLabel.textContent = state.language.toUpperCase();
  // Cars empty hint
  if(carsEmptyHint) carsEmptyHint.style.display = (state.cars||[]).length ? "none" : "block";
  // Clear favs btn
  if(clearFavsBtn) clearFavsBtn.style.display = (state.favorites||[]).length ? "inline-flex" : "none";
  // Recent
  renderRecent();
}

// Profil saqlash
if(cabProfileSave) cabProfileSave.addEventListener("click", ()=>{
  state.profile = state.profile || {};
  state.profile.name = (cabNameInput?.value||"").trim();
  state.profile.phone = (cabPhoneInput?.value||"").trim();
  saveState();
  syncCabinetUI();
  showToast(I18N[state.language].profileSaved, "ok");
});

// Settings: Theme switch
if(cabThemeSwitch) cabThemeSwitch.addEventListener("change", ()=>{
  state.theme = cabThemeSwitch.checked ? "dark" : "light";
  saveState(); applyTheme();
});

// Settings: Notifications
if(cabNotifySwitch) cabNotifySwitch.addEventListener("change", async()=>{
  state.settings = state.settings || {};
  if(cabNotifySwitch.checked) {
    if("Notification"in window) {
      const p = Notification.permission==="granted" ? "granted" : await Notification.requestPermission();
      state.settings.notifications = p==="granted";
      cabNotifySwitch.checked = p==="granted";
      showToast(p==="granted"?"Bildirishnomalar yoqildi ✓":"Ruxsat berilmadi");
    }
  } else {
    state.settings.notifications = false;
  }
  saveState();
});

// Settings: Sound
if(cabSoundSwitch) cabSoundSwitch.addEventListener("change", ()=>{
  state.settings = state.settings || {};
  state.settings.sound = cabSoundSwitch.checked;
  saveState();
  if(cabSoundSwitch.checked) playFilterSound();
});

// Settings: Language
if(cabLangSwitch) cabLangSwitch.addEventListener("click", ()=>{
  state.language = state.language==="uz" ? "ru" : "uz";
  saveState(); applyI18n(); renderRegionDropdown(); renderAll(); syncCabinetUI();
});

// Clear favorites
if(clearFavsBtn) clearFavsBtn.addEventListener("click", ()=>{
  state.favorites = [];
  saveState(); renderAll(); syncCabinetUI();
  showToast(state.language==="ru"?"Избранные очищены":"Sevimlilar tozalandi","ok");
});

// Reset data
if(cabResetBtn) cabResetBtn.addEventListener("click", ()=>{
  if(!confirm(I18N[state.language].resetConfirm)) return;
  localStorage.removeItem(LS_KEY);
  localStorage.removeItem("gaznav-geo-cache");
  state = structuredClone(DEFAULT_STATE);
  saveState();
  applyI18n(); applyTheme(); syncFilterUI(); renderRegionDropdown(); renderAll(); renderCars(); syncCabinetUI();
  showToast(state.language==="ru"?"Данные сброшены":"Ma'lumotlar tozalandi","ok");
});

// Oxirgi ko'rilganlarni saqlash
function addToRecent(stationId) {
  state.recentViewed = state.recentViewed || [];
  state.recentViewed = state.recentViewed.filter(r => r.id !== stationId);
  state.recentViewed.unshift({ id: stationId, time: Date.now() });
  if(state.recentViewed.length > 10) state.recentViewed = state.recentViewed.slice(0, 10);
  saveState();
}

function renderRecent() {
  if(!recentContainer) return;
  const recent = (state.recentViewed || []).slice(0, 5);
  if(!recent.length) {
    recentContainer.className = "cabinet__card cabinet__card--empty";
    recentContainer.textContent = I18N[state.language].recentEmpty;
    return;
  }
  recentContainer.className = "cabinet__card cabinet__card-list";
  recentContainer.innerHTML = "";
  recent.forEach((r, i) => {
    const st = (state.stations||[]).find(s => s.id === r.id);
    if(!st) return;
    const mins = Math.floor((Date.now() - r.time) / 60000);
    const timeStr = mins < 1 ? I18N[state.language].recentJustNow : `${mins} ${I18N[state.language].recentMinAgo}`;
    const el = document.createElement("div");
    el.className = "cab-recent-item";
    el.innerHTML = `<span class="cab-recent-num">${i+1}</span><span class="cab-recent-name">${st.name}</span><span class="cab-recent-time">${timeStr}</span>`;
    el.addEventListener("click", () => openStationModal(st.id));
    recentContainer.appendChild(el);
  });
}

// ── ADMIN PAROL ─────────────────────────────
const ADMIN_PASSWORD = "20072007";
if (adminPanelBtn) {
  adminPanelBtn.addEventListener("click",()=>{
    adminPassModal.classList.add("modal--open");
    adminPassInput.value=""; adminPassError.textContent="";
    setTimeout(()=>adminPassInput.focus(),100);
  });
}
function checkAdminPass() {
  if (adminPassInput.value===ADMIN_PASSWORD) {
    sessionStorage.setItem("gaznav-admin-auth","ok");
    adminPassModal.classList.remove("modal--open");
    window.location.href="admin.html";
  } else {
    adminPassError.textContent = state.language==="ru"?"Неверный пароль!":"Parol noto'g'ri!";
    adminPassInput.value=""; adminPassInput.focus();
  }
}
if (adminPassSubmit) adminPassSubmit.addEventListener("click", checkAdminPass);
if (adminPassInput)  adminPassInput.addEventListener("keydown", e=>{ if(e.key==="Enter") checkAdminPass(); });
if (adminPassCancel) adminPassCancel.addEventListener("click",  ()=>adminPassModal.classList.remove("modal--open"));
if (adminPassBackdrop) adminPassBackdrop.addEventListener("click",()=>adminPassModal.classList.remove("modal--open"));

// ── FILTERS — RADIO ─────────────────────────
function syncFilterUI() {
  filterChips.forEach(chip=>{
    const fuel=chip.getAttribute("data-filter-fuel"), tag=chip.getAttribute("data-filter-tag");
    chip.classList.toggle("chip--on", fuel?state.filters.fuel===fuel : tag?state.filters.tag===tag:false);
  });
  const hasAny=state.filters.fuel||state.filters.tag||state.filters.status;
  if(filterAllBtn) filterAllBtn.classList.toggle("panel-filter-chip--active",!hasAny);
  panelFilterChips.forEach(chip=>{
    const fuel=chip.getAttribute("data-filter-fuel"), tag=chip.getAttribute("data-filter-tag"), st=chip.getAttribute("data-filter-status");
    chip.classList.toggle("panel-filter-chip--active", fuel?state.filters.fuel===fuel:tag?state.filters.tag===tag:st?state.filters.status===st:false);
  });
}
filterChips.forEach(chip=>{
  chip.addEventListener("click",()=>{
    const fuel=chip.getAttribute("data-filter-fuel"), tag=chip.getAttribute("data-filter-tag");
    if(fuel){ state.filters.fuel=state.filters.fuel===fuel?"":fuel; state.filters.tag=""; }
    if(tag){  state.filters.tag=state.filters.tag===tag?"":tag;    state.filters.fuel=""; }
    saveState(); syncFilterUI(); playFilterSound(); renderAll(); updateMapMarkers();
  });
});
if(filterAllBtn) {
  filterAllBtn.addEventListener("click",()=>{ state.filters={fuel:"",tag:"",status:""}; saveState(); syncFilterUI(); playFilterSound(); renderAll(); updateMapMarkers(); });
}
panelFilterChips.forEach(chip=>{
  chip.addEventListener("click",()=>{
    const fuel=chip.getAttribute("data-filter-fuel"),tag=chip.getAttribute("data-filter-tag"),st=chip.getAttribute("data-filter-status");
    if(fuel){ state.filters.fuel=state.filters.fuel===fuel?"":fuel; state.filters.tag=""; state.filters.status=""; }
    if(tag){  state.filters.tag=state.filters.tag===tag?"":tag;    state.filters.fuel=""; state.filters.status=""; }
    if(st){   state.filters.status=state.filters.status===st?"":st; state.filters.fuel=""; state.filters.tag=""; }
    saveState(); syncFilterUI(); playFilterSound(); renderAll(); updateMapMarkers();
  });
});

// ── REGION/DISTRICT ─────────────────────────
function ensureRegions() {
  if (!Array.isArray(state.locations)) state.locations=[];
  for(const s of state.stations||[]){
    const region=s.region||"Toshkent viloyati", district=s.district||"";
    let loc=state.locations.find(l=>(l.region||l.city)===region);
    if(!loc){ loc={region,city:region,districts:[]}; state.locations.push(loc); }
    if(district && !loc.districts.includes(district)) loc.districts.push(district);
  }
  state.locations.sort((a,b)=>(a.region||a.city||"").localeCompare(b.region||b.city||""));
  state.locations.forEach(l=>(l.districts||[]).sort());
}
function getDistrictsForRegion(region) {
  const loc=(state.locations||[]).find(l=>(l.region||l.city)===region);
  return (loc?.districts)||[];
}
function renderRegionDropdown() {
  if(!regionSelect||!districtSelect||!regionValueEl) return;
  ensureRegions();
  regionSelect.innerHTML="";
  const oe=document.createElement("option"); oe.value=""; oe.textContent=state.language==="ru"?"Все области":"Barcha viloyatlar"; regionSelect.appendChild(oe);
  for(const r of state.locations||[]){ const o=document.createElement("option"); o.value=r.region||r.city; o.textContent=r.region||r.city; regionSelect.appendChild(o); }
  regionSelect.value=state.selectedRegion||"";
  districtSelect.innerHTML="";
  const od=document.createElement("option"); od.value=""; od.textContent=state.language==="ru"?"Все районы":"Barcha tumanlar"; districtSelect.appendChild(od);
  const dists=getDistrictsForRegion(state.selectedRegion||"");
  for(const d of dists){ const o=document.createElement("option"); o.value=d; o.textContent=d; districtSelect.appendChild(o); }
  districtSelect.value=state.selectedDistrict||"";
  const reg=state.selectedRegion||"", d=state.selectedDistrict||(dists[0]||"");
  regionValueEl.textContent=reg?(d?`${reg} · ${d}`:reg):(state.language==="ru"?"Область":"Viloyat");
}

// ── FILTER+SORT ─────────────────────────────
function getFilteredStations() {
  const q=(searchInput.value||"").trim().toLowerCase();
  return (state.stations||[]).map(s=>({...s})).filter(st=>{
    if(state.selectedRegion  && st.region!==state.selectedRegion)   return false;
    if(state.selectedDistrict&& st.district!==state.selectedDistrict) return false;
    if(q && !st.name.toLowerCase().includes(q)) return false;
    if(state.filters.fuel   && !(st.fuels||[]).includes(state.filters.fuel)) return false;
    if(state.filters.tag    && !(st.tags||[]).includes(state.filters.tag))   return false;
    if(state.filters.status && st.status!==state.filters.status)             return false;
    return true;
  }).sort((a,b)=>{
    const fA=state.favorites.includes(a.id),fB=state.favorites.includes(b.id);
    if(fA!==fB) return fA?-1:1;
    if(a.status!==b.status) return a.status==="open"?-1:1;
    if(a.distance!=null&&b.distance!=null) return a.distance-b.distance;
    return a.name.localeCompare(b.name);
  });
}

// ── FAVORITES ───────────────────────────────
function toggleFavorite(id) {
  const i=state.favorites.indexOf(id); i===-1?state.favorites.push(id):state.favorites.splice(i,1);
  saveState(); renderAll();
}
function renderFavorites() {
  const favs=state.stations.filter(s=>state.favorites.includes(s.id));
  if(clearFavsBtn) clearFavsBtn.style.display = favs.length ? "inline-flex" : "none";
  if(!favs.length){ favoritesContainer.className="cabinet__card cabinet__card--empty"; favoritesContainer.textContent=I18N[state.language].favEmpty; return; }
  favoritesContainer.className="cabinet__card cabinet__card-list"; favoritesContainer.innerHTML="";
  favs.forEach(s=>{
    const d=document.createElement("div"); d.className="cabinet__fav-item";
    d.innerHTML=`
      <div class="cab-fav-icon"><span>⛽</span></div>
      <div class="cab-fav-info">
        <div class="cab-fav-name">${s.name}</div>
        <div class="cab-fav-meta">
          <span class="cab-fav-status ${s.status==="open"?"cab-fav-status--open":"cab-fav-status--closed"}"></span>
          <span>${s.status==="open"?I18N[state.language].open:I18N[state.language].closed}</span>
          <span>· ${s.openTime}</span>
        </div>
      </div>
      <button class="cab-fav-remove" type="button" title="O'chirish">✕</button>`;
    d.querySelector(".cab-fav-remove").addEventListener("click", e => { e.stopPropagation(); toggleFavorite(s.id); syncCabinetUI(); });
    d.addEventListener("click",()=>openStationModal(s.id));
    favoritesContainer.appendChild(d);
  });
}

// ── DISTANCE PANEL ─────────────────────────
function updateDistancePanel(list) {
  const d=I18N[state.language]; const nearest=list.find(s=>s.distance!=null);
  if(nearest){ distancePanelLabel.textContent=d.nearest+":"; distancePanelName.textContent=nearest.name; distancePanelValue.textContent=nearest.distance.toFixed(1)+" "+d.km; }
  else { distancePanelLabel.textContent=d.nearest; distancePanelName.textContent=list[0]?.name||"–"; distancePanelValue.textContent="–"; }
}

// ── TOP CARDS ───────────────────────────────
function fuelEmoji(f){ return f==="Metan"?"🔵":f==="Benzin"?"🔴":f==="Dizel"?"🟡":"⚪"; }
function renderTopCards(list) {
  topCardsEl.innerHTML="";
  list.slice(0,3).forEach((s,i)=>{
    const c=document.createElement("article"); c.className="station-card"+(i===0?" station-card--nearest":"");
    const distStr=s.distance!=null?`<span class="card-dist">📍 ${s.distance.toFixed(1)} ${I18N[state.language].km}</span>`:"";
    const isFav=state.favorites.includes(s.id);
    c.innerHTML=`
      <div class="station-header">
        <div class="station-title">${s.name}</div>
        <button class="card-fav-btn ${isFav?"on":""}" data-id="${s.id}">★</button>
      </div>
      <div class="station-types">
        ${(s.fuels||[]).map(f=>`<span class="type-pill">${fuelEmoji(f)} ${f}</span>`).join("")}
      </div>
      <div class="station-footer">
        <span class="status-dot ${s.status==="open"?"":"status-dot--closed"}"><span></span>${s.status==="open"?I18N[state.language].online:I18N[state.language].closed}</span>
        <span class="card-time">🕐 ${s.openTime||"24/7"}</span>
        ${distStr}
      </div>`;
    c.querySelector(".card-fav-btn").addEventListener("click", e=>{ e.stopPropagation(); toggleFavorite(s.id); });
    c.addEventListener("click",()=>{ playSelectSound(); openStationModal(s.id); });
    topCardsEl.appendChild(c);
  });
}

// ── STATION LIST ────────────────────────────
function renderStationsList(list) {
  stationListEl.innerHTML="";
  if(!list.length){ stationListEl.innerHTML=`<div class="list-empty">${I18N[state.language].noMatch}</div>`; }
  list.forEach((st,idx)=>{
    const isFav=state.favorites.includes(st.id);
    const el=document.createElement("div");
    el.className="order-item"+(idx===0?" order-item--nearest":"");
    el.setAttribute("data-id",st.id);
    const distStr=st.distance!=null?`${st.distance.toFixed(1)} ${I18N[state.language].km}`:"";
    el.innerHTML=`
      <div class="order-item__icon ${st.status==="open"?"order-item__icon--open":""}"><span>⛽</span></div>
      <div class="order-item__main">
        <div class="order-item__title-row">
          <div class="order-item__name">${st.name}</div>
          <div class="order-item__distance">${distStr}</div>
          <button class="order-item__fav ${isFav?"order-item__fav--on":""}" type="button">★</button>
        </div>
        <div class="order-item__meta">
          ${(st.fuels||[]).map(f=>`<span class="order-pill">${fuelEmoji(f)} ${f}</span>`).join("")}
          ${(st.tags||[]).map(t=>`<span class="order-pill order-pill--tag">${t}</span>`).join("")}
          <span class="order-status">
            <span class="order-status__dot ${st.status!=="open"?"order-status__dot--closed":""}"></span>
            <span>${st.status==="open"?I18N[state.language].open:I18N[state.language].closed}</span>
          </span>
          <span class="order-pill">🕐 ${st.openTime}</span>
        </div>
      </div>`;
    el.querySelector(".order-item__fav").addEventListener("click", e=>{ e.stopPropagation(); toggleFavorite(st.id); });
    el.addEventListener("click",()=>{ playSelectSound(); openStationModal(st.id); });
    stationListEl.appendChild(el);
  });
  nearestLabel.textContent=list.length>0?`${I18N[state.language].nearest}: ${list[0].name}`:I18N[state.language].noMatch;
}

// ── MODAL ───────────────────────────────────
function setModalOpen(open) { stationModal.classList.toggle("modal--open",open); }

// Store distances for modal
let _lastDistList = [];

function openStationModal(id) {
  const st=state.stations.find(s=>s.id===Number(id)); if(!st) return;
  addToRecent(st.id);
  const loc=`${st.region||""}${st.region?" · ":""}${st.district||""}`.trim();
  const coords=typeof st.lat==="number"?`${st.lat.toFixed(5)}, ${st.lng.toFixed(5)}`:"-";
  const distData=_lastDistList.find(x=>x.id===st.id);
  const distStr=distData?.distance!=null?`<div class="modal-station__row"><span class="modal-station__label">${I18N[state.language].distance}</span><span class="modal-station__value" style="color:var(--accent)">${distData.distance.toFixed(2)} ${I18N[state.language].km}</span></div>`:"";
  const navUrl=`https://yandex.com/maps/?rtext=~${st.lat},${st.lng}&rtt=auto`;
  modalBody.innerHTML=`
    <div class="modal-station">
      <div class="modal-station__header">
        <div class="modal-station__icon">⛽</div>
        <div>
          <div class="modal-station__title">${st.name}</div>
          <div style="color:var(--text-muted);font-size:12px;margin-top:2px;">${loc||I18N[state.language].locationUnknown}</div>
        </div>
      </div>
      <div class="modal-station__meta">
        <div class="modal-station__row"><span class="modal-station__label">${I18N[state.language].status}</span><span class="modal-station__value" style="color:${st.status==="open"?"var(--accent)":"var(--text-muted)"}">${st.status==="open"?I18N[state.language].open:I18N[state.language].closed}</span></div>
        <div class="modal-station__row"><span class="modal-station__label">${I18N[state.language].fuel}</span><span class="modal-station__value">${(st.fuels||[]).map(f=>fuelEmoji(f)+" "+f).join(", ")||"-"}</span></div>
        <div class="modal-station__row"><span class="modal-station__label">${I18N[state.language].time}</span><span class="modal-station__value">${st.openTime||"-"}</span></div>
        <div class="modal-station__row"><span class="modal-station__label">${I18N[state.language].coords}</span><span class="modal-station__value">${coords}</span></div>
        ${distStr}
      </div>
      <a href="${navUrl}" target="_blank" rel="noopener" class="modal-nav-btn">🗺️ ${I18N[state.language].navigate||"Navigatsiya"}</a>
      <div class="modal-station__map" id="modalMapContainer"></div>
    </div>`;
  setModalOpen(true);
  if(typeof ymaps!=="undefined"&&typeof st.lat==="number") {
    setTimeout(()=>{
      const el=document.getElementById("modalMapContainer"); if(!el) return;
      if(el._yMap) try{el._yMap.destroy();}catch(_){}
      ymaps.ready(()=>{
        const m=new ymaps.Map("modalMapContainer",{center:[st.lat,st.lng],zoom:15,controls:[]});
        m.geoObjects.add(new ymaps.Placemark([st.lat,st.lng],{hintContent:st.name},{preset:getMarkerPreset(st)}));
        el._yMap=m;
      });
    },100);
  }
}
modalBackdrop.addEventListener("click",()=>setModalOpen(false));
modalClose.addEventListener("click",()=>setModalOpen(false));
document.addEventListener("keydown",e=>{ if(e.key==="Escape"){ setModalOpen(false); if(adminPassModal) adminPassModal.classList.remove("modal--open"); } });

// ── CARS ────────────────────────────────────
function renderCars() {
  if(!carsListEl) return;
  carsListEl.innerHTML="";
  if(carsEmptyHint) carsEmptyHint.style.display = (state.cars||[]).length ? "none" : "block";
  (state.cars||[]).forEach(car=>{
    const row=document.createElement("div"); row.className="cabinet__car-item";
    row.innerHTML=`<div class="cabinet__car-info"><span>🚗</span><span>${car.name}</span><span class="cabinet__car-quality">${car.quality}</span></div><button type="button" class="cabinet__car-del-btn" title="O'chirish">✕</button>`;
    row.querySelector("button").addEventListener("click",()=>{ state.cars=(state.cars||[]).filter(c=>c.id!==car.id); saveState(); renderCars(); syncCabinetUI(); });
    carsListEl.appendChild(row);
  });
}
if(addCarBtn) addCarBtn.addEventListener("click",()=>{
  const name=prompt(I18N[state.language].addCarPrompt); if(!name) return;
  const quality=prompt(I18N[state.language].addCarQuality,"Comfort")||"Comfort";
  state.cars=state.cars||[]; state.cars.push({id:Date.now(),name:name.trim(),quality:quality.trim()});
  saveState(); renderCars(); syncCabinetUI();
});

// ── YANDEX MAP ──────────────────────────────
let mainMap=null, mapMarkers=[];

function getMarkerPreset(s) {
  if(s.status!=="open") return "islands#grayFuelStationIcon";
  if((s.fuels||[]).includes("Metan"))  return "islands#greenFuelStationIcon";
  if((s.fuels||[]).includes("Benzin")) return "islands#orangeFuelStationIcon";
  if((s.fuels||[]).includes("Dizel"))  return "islands#yellowFuelStationIcon";
  return "islands#blueFuelStationIcon";
}

function updateMapMarkers() {
  if(!mainMap) return;
  mapMarkers.forEach(m=>mainMap.geoObjects.remove(m)); mapMarkers=[];
  const filteredIds=new Set(getFilteredStations().map(s=>s.id));
  (state.stations||[]).forEach(s=>{
    if(typeof s.lat!=="number"||typeof s.lng!=="number") return;
    const isF=filteredIds.has(s.id);
    const pm=new ymaps.Placemark([s.lat,s.lng],{
      hintContent:s.name,
      balloonContent:`<div style="min-width:160px"><b style="font-size:14px">${s.name}</b><div style="color:#666;font-size:12px;margin-top:3px">${(s.fuels||[]).join(", ")}</div><div style="font-size:11px;margin-top:4px">${s.status==="open"?"✅ Ochiq":"🔴 Yopiq"} · ${s.openTime}</div></div>`
    },{preset:isF?getMarkerPreset(s):"islands#grayFuelStationIcon",opacity:isF?1:.25});
    pm.events.add("click",()=>{ playSelectSound(); openStationModal(s.id); openPanel(); });
    mainMap.geoObjects.add(pm); mapMarkers.push(pm);
  });
}

function syncZoomLevel() { if(mainMap&&mapZoomLevel) mapZoomLevel.textContent=mainMap.getZoom(); }

function initMainMap() {
  const mapEl=document.getElementById("mainMap"); if(!mapEl||typeof ymaps==="undefined") return;
  if(mainMap){ try{mainMap.destroy();}catch(_){} mainMap=null; }
  const center=state.userPosition||{lat:41.3275,lng:69.2817};
  mainMap=new ymaps.Map("mainMap",{center:[center.lat,center.lng],zoom:12,controls:["geolocationControl"]},{suppressMapOpenBlock:true});
  try{const cp=mainMap.copyrights; if(cp?.togglePromo) cp.togglePromo(false);}catch(_){}
  mainMap.events.add("boundschange",syncZoomLevel);
  syncZoomLevel(); updateMapMarkers();
}

if(mapZoomIn)  mapZoomIn.addEventListener("click",()=>{ if(mainMap) mainMap.setZoom(mainMap.getZoom()+1,{smooth:true}); });
if(mapZoomOut) mapZoomOut.addEventListener("click",()=>{ if(mainMap) mainMap.setZoom(mainMap.getZoom()-1,{smooth:true}); });

// ── NOTIFICATIONS ───────────────────────────
if(notifyBtn) notifyBtn.addEventListener("click",async()=>{
  if(!("Notification"in window)){ showToast("Brauzer qo'llab-quvvatlamaydi"); return; }
  const p=Notification.permission==="granted"?"granted":await Notification.requestPermission();
  showToast(p==="granted"?"Bildirishnomalar yoqildi ✓":"Ruxsat berilmadi");
});

// Storage sync
let lastSnapshot=structuredClone(state);
window.addEventListener("storage",e=>{
  if(e.key==="lastNotification"&&e.newValue){ try{const n=JSON.parse(e.newValue); showToast(`${n.name}: ${n.status}`);}catch(_){} return; }
  if(e.key!==LS_KEY||!e.newValue) return;
  try {
    const next=JSON.parse(e.newValue);
    for(const ns of next.stations||[]){
      const ps=(lastSnapshot.stations||[]).find(s=>s.id===ns.id);
      if(ps&&ps.status!=="open"&&ns.status==="open"){
        const msg=state.language==="ru"?`${ns.name} открыта`:`${ns.name} ochildi`;
        showToast(msg); playOpenSound();
        if("Notification"in window&&Notification.permission==="granted") new Notification("GazNav",{body:msg});
      }
    }
    state={...structuredClone(DEFAULT_STATE),...next};
    lastSnapshot=structuredClone(state);
    applyI18n(); applyTheme(); syncFilterUI(); renderRegionDropdown(); renderAll(); renderCars(); updateMapMarkers();
  }catch(_){}
});

// ── GEO ─────────────────────────────────────
function distanceKm(lat1,lon1,lat2,lon2){
  const R=6371,r=d=>d*Math.PI/180;
  const dL=r(lat2-lat1),dO=r(lon2-lon1);
  return R*2*Math.atan2(Math.sqrt(Math.sin(dL/2)**2+Math.cos(r(lat1))*Math.cos(r(lat2))*Math.sin(dO/2)**2),Math.sqrt(1-Math.sin(dL/2)**2-Math.cos(r(lat1))*Math.cos(r(lat2))*Math.sin(dO/2)**2));
}

function applyDistances(lat,lng) {
  _lastDistList = (state.stations||[]).map(s=>({...s, distance:distanceKm(lat,lng,s.lat||0,s.lng||0)})).sort((a,b)=>a.distance-b.distance);
  renderAll(_lastDistList);
}

// Real-time geo watch
let geoWatchId=null;
function initGeolocation() {
  const usePos=(lat,lng)=>{
    state.userPosition={lat,lng};
    userLocationLabel.textContent=`${I18N[state.language].geoNear}: ${lat.toFixed(3)}, ${lng.toFixed(3)}`;
    try{localStorage.setItem("gaznav-geo-cache",JSON.stringify({lat,lng,timestamp:Date.now()}));}catch(_){}
    applyDistances(lat,lng);
    if(mainMap) mainMap.setCenter([lat,lng],13);
  };
  // Try cache first
  try{
    const c=JSON.parse(localStorage.getItem("gaznav-geo-cache")||"{}");
    if(c.lat!=null&&(Date.now()-(c.timestamp||0))<86400000) usePos(c.lat,c.lng);
  }catch(_){}
  if(!navigator.geolocation){ userLocationLabel.textContent=I18N[state.language].geoUnavailable; renderAll(); return; }
  // Watch position for real-time updates
  geoWatchId=navigator.geolocation.watchPosition(
    p=>usePos(p.coords.latitude,p.coords.longitude),
    ()=>{ userLocationLabel.textContent=I18N[state.language].geoDisabled; renderAll(); },
    {enableHighAccuracy:true,timeout:8000,maximumAge:5000}
  );
}

// ── PANEL DRAG ──────────────────────────────
let currentOffset=0,collapsedOffset=220,hiddenOffset=320,isDragging=false,startY=0,startOffset=0;
function recalcOffsets(){
  const ph=panel.getBoundingClientRect().height;
  collapsedOffset=Math.min(ph*.55,window.innerHeight*.45);
  hiddenOffset=Math.max(ph-22,collapsedOffset+40);
  if(currentOffset===0) setPanelOffset(0,false);
  else if(currentOffset>=hiddenOffset) setPanelOffset(hiddenOffset,false);
  else setPanelOffset(collapsedOffset,false);
}
function setPanelOffset(px,anim=true){
  currentOffset=Math.max(0,Math.min(hiddenOffset,px));
  panel.classList.toggle("order-panel--dragging",!anim);
  panel.style.setProperty("--panel-translate",`${currentOffset}px`);
}
function openPanel()    { setPanelOffset(0,true); toggleBtn.textContent="▾"; }
function collapsePanel(){ setPanelOffset(collapsedOffset,true); toggleBtn.textContent="▴"; }
function hidePanel()    { setPanelOffset(hiddenOffset,true); toggleBtn.textContent="▴"; }
toggleBtn.addEventListener("click",()=>currentOffset===0?collapsePanel():openPanel());
hideBtn.addEventListener("click",hidePanel);
function onDragStart(y){ isDragging=true; startY=y; startOffset=currentOffset; panel.classList.add("order-panel--dragging"); }
function onDragMove(y) { if(isDragging) setPanelOffset(startOffset+y-startY,false); }
function onDragEnd()   {
  if(!isDragging) return; isDragging=false; panel.classList.remove("order-panel--dragging");
  const d=[Math.abs(currentOffset),Math.abs(currentOffset-collapsedOffset),Math.abs(currentOffset-hiddenOffset)];
  const m=Math.min(...d);
  if(m===d[0]) openPanel(); else if(m===d[1]) collapsePanel(); else hidePanel();
}
dragHandle.addEventListener("mousedown",e=>{ e.preventDefault(); onDragStart(e.clientY); window.addEventListener("mousemove",mm); window.addEventListener("mouseup",mu); });
function mm(e){onDragMove(e.clientY);}
function mu(){onDragEnd(); window.removeEventListener("mousemove",mm); window.removeEventListener("mouseup",mu);}
dragHandle.addEventListener("touchstart",e=>onDragStart(e.touches[0].clientY),{passive:true});
dragHandle.addEventListener("touchmove", e=>onDragMove(e.touches[0].clientY),{passive:true});
dragHandle.addEventListener("touchend",onDragEnd);

// ── RENDER ──────────────────────────────────
function renderAll(withDist) {
  const all=withDist||state.stations;
  const filtered=getFilteredStations().map(s=>{ const wd=all.find(x=>x.id===s.id); return wd?.distance!=null?{...s,distance:wd.distance}:s; });
  updateDistancePanel(filtered);
  renderTopCards(filtered);
  renderStationsList(filtered);
  renderFavorites();
}

// Debounced search
let searchTimer;
searchInput.addEventListener("input",()=>{
  clearTimeout(searchTimer);
  searchTimer=setTimeout(()=>{ renderAll(); updateMapMarkers(); },180);
});

// Keyboard shortcut: "/" to focus search
document.addEventListener("keydown",e=>{
  if(e.key==="/" && document.activeElement!==searchInput && !e.ctrlKey && !e.metaKey && !e.altKey){
    e.preventDefault(); searchInput.focus();
  }
  if(e.key==="Escape" && document.activeElement===searchInput) searchInput.blur();
});

if(regionButton&&regionPanel){
  regionButton.addEventListener("click",e=>{ e.stopPropagation(); regionPanel.classList.toggle("region-dropdown__panel--open"); });
  regionPanel.addEventListener("click",e=>e.stopPropagation());
  document.addEventListener("click",()=>regionPanel.classList.remove("region-dropdown__panel--open"));
}
if(regionSelect) regionSelect.addEventListener("change",()=>{
  state.selectedRegion=regionSelect.value||""; state.selectedDistrict="";
  const d=getDistrictsForRegion(state.selectedRegion); if(d.length) state.selectedDistrict=d[0];
  saveState(); renderRegionDropdown(); renderAll(); updateMapMarkers();
});
if(districtSelect) districtSelect.addEventListener("change",()=>{
  state.selectedDistrict=districtSelect.value||""; saveState(); renderRegionDropdown(); renderAll(); updateMapMarkers();
});

// ── INIT ────────────────────────────────────
window.addEventListener("load",()=>{
  applyI18n(); applyTheme(); syncFilterUI(); ensureRegions(); renderRegionDropdown();
  recalcOffsets(); openPanel(); initGeolocation(); renderCars(); renderAll(); syncCabinetUI();
  syncUserToRegistry();
  if(typeof ymaps!=="undefined") ymaps.ready(initMainMap);
  else setTimeout(()=>{ if(typeof ymaps!=="undefined") ymaps.ready(initMainMap); },3000);
});
window.addEventListener("resize",recalcOffsets);
