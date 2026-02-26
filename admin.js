// ═══════════════════════════════════════
// GazNav Admin Panel v3.0
// ═══════════════════════════════════════
const LS_KEY      = "gaznav-state-v1";
const AUTH_KEY    = "gaznav-admin-auth";
const ADMIN_PASS  = "20072007";

// ── STATE ────────────────────────────────
const DEFAULT = {
  language: "uz", theme: "dark",
  filters: { fuel:"", tag:"", status:"" },
  favorites: [], cars: [],
  selectedRegion: "Toshkent viloyati", selectedDistrict: "",
  profile: { name: "", phone: "" },
  settings: { notifications: false, sound: true },
  recentViewed: [],
  locations: [],
  tags: ["24/7","WC","Kafe"],
  stations: [
    { id:1, name:"UNG Petro",  fuels:["Metan","Benzin"], status:"open",   region:"Toshkent viloyati", district:"Yunusobod",      tags:["24/7"], openTime:"24/7",       lat:41.3275, lng:69.2817 },
    { id:2, name:"Real Gas",   fuels:["Metan"],           status:"open",   region:"Toshkent viloyati", district:"Chilonzor",      tags:["WC"],   openTime:"08:00–23:00", lat:41.32,   lng:69.295  },
    { id:3, name:"Neo Oil",    fuels:["Benzin","Dizel"],  status:"closed", region:"Toshkent viloyati", district:"Mirzo Ulug'bek", tags:["Kafe"], openTime:"24/7",       lat:41.329,  lng:69.27   }
  ]
};

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return structuredClone(DEFAULT);
    const p = JSON.parse(raw);
    const m = { ...structuredClone(DEFAULT), ...p };
    if (!m.tags) m.tags = ["24/7","WC","Kafe"];
    if (!m.locations) m.locations = [];
    return m;
  } catch { return structuredClone(DEFAULT); }
}

function saveState() {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
  updateTopbarStats();
}

let state = loadState();
let currentId = null;
let editorMap  = null;
let editorMark = null;
let pickMode   = false;

// ── TOAST ────────────────────────────────
function toast(msg, type = "ok") {
  const wrap = document.getElementById("toastWrap");
  const el = document.createElement("div");
  el.className = `a-toast a-toast--${type}`;
  el.innerHTML = `<span>${type==="ok"?"✓":type==="err"?"✕":"ℹ"}</span>${msg}`;
  wrap.appendChild(el);
  setTimeout(() => { el.style.opacity="0"; el.style.transform="translateY(-6px)"; setTimeout(()=>el.remove(),250); }, 2800);
}

// ── CONFIRM MODAL ─────────────────────────
function confirmDialog(title, sub) {
  return new Promise(res => {
    const ov = document.getElementById("confirmOverlay");
    document.getElementById("confirmTitle").textContent = title;
    document.getElementById("confirmSub").textContent   = sub;
    ov.classList.add("open");
    const ok  = document.getElementById("confirmOk");
    const can = document.getElementById("confirmCancel");
    function cleanup(v) { ov.classList.remove("open"); ok.replaceWith(ok.cloneNode(true)); can.replaceWith(can.cloneNode(true)); res(v); }
    document.getElementById("confirmOk").addEventListener("click",    () => cleanup(true));
    document.getElementById("confirmCancel").addEventListener("click", () => cleanup(false));
  });
}

// ── AUTH ──────────────────────────────────
const authScreen = document.getElementById("authScreen");
const appEl      = document.getElementById("app");

document.getElementById("authBtn").addEventListener("click", tryLogin);
document.getElementById("authInput").addEventListener("keydown", e => { if(e.key==="Enter") tryLogin(); });
document.getElementById("tbLogout").addEventListener("click", () => {
  sessionStorage.removeItem(AUTH_KEY);
  authScreen.style.display = "flex";
  appEl.classList.remove("visible");
});

function tryLogin() {
  const v = document.getElementById("authInput").value;
  if (v === ADMIN_PASS) {
    sessionStorage.setItem(AUTH_KEY, "ok");
    authScreen.style.display = "none";
    appEl.classList.add("visible");
    initApp();
  } else {
    const e = document.getElementById("authErr");
    e.textContent = "❌ Parol noto'g'ri!";
    document.getElementById("authInput").value = "";
    document.getElementById("authInput").focus();
    setTimeout(() => e.textContent = "", 2500);
  }
}

// ── INIT ──────────────────────────────────
window.addEventListener("load", () => {
  if (sessionStorage.getItem(AUTH_KEY) === "ok") {
    authScreen.style.display = "none";
    appEl.classList.add("visible");
    initApp();
  } else {
    authScreen.style.display = "flex";
    setTimeout(() => document.getElementById("authInput").focus(), 100);
  }
});

function initApp() {
  state = loadState();
  document.getElementById("dashDate").textContent = new Date().toLocaleDateString("uz-UZ", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
  ensureLocations();
  ensureTags();
  updateTopbarStats();
  renderSidebar();
  renderDashboard();
  showDashboard();

  // lang toggle
  document.getElementById("tbLang").addEventListener("click", () => {
    state.language = state.language === "uz" ? "ru" : "uz";
    saveState();
    toast("Til o'zgartirildi", "info");
  });
}

// ── TOPBAR STATS ─────────────────────────
function updateTopbarStats() {
  document.getElementById("tbTotal").textContent = (state.stations||[]).length;
  document.getElementById("tbOpen").textContent  = (state.stations||[]).filter(s=>s.status==="open").length;
}

// ── ENSURE HELPERS ────────────────────────
function ensureLocations() {
  if (!Array.isArray(state.locations)) state.locations = [];
  for (const s of state.stations||[]) {
    const reg = s.region || "Toshkent viloyati";
    const dis = s.district || "";
    let loc = state.locations.find(l=>(l.region||l.city)===reg);
    if (!loc) { loc={region:reg,city:reg,districts:[]}; state.locations.push(loc); }
    if (dis && !loc.districts.includes(dis)) loc.districts.push(dis);
  }
  state.locations.sort((a,b)=>(a.region||a.city||"").localeCompare(b.region||b.city||""));
  state.locations.forEach(l=>(l.districts||[]).sort());
}

function ensureTags() {
  if (!Array.isArray(state.tags)) state.tags = ["24/7","WC","Kafe"];
  const allT = new Set(state.tags);
  (state.stations||[]).forEach(s=>(s.tags||[]).forEach(t=>allT.add(t)));
  state.tags = [...allT];
}

// ── SIDEBAR ───────────────────────────────
let sFilter = "all";
let sSearch = "";

document.getElementById("sidebarSearch").addEventListener("input", e => {
  sSearch = e.target.value.toLowerCase();
  renderSidebar();
});
document.querySelectorAll(".sfilter").forEach(btn => {
  btn.addEventListener("click", () => {
    sFilter = btn.dataset.f;
    document.querySelectorAll(".sfilter").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    renderSidebar();
  });
});
document.getElementById("addNewBtn").addEventListener("click", addNewStation);

function renderSidebar() {
  const list = document.getElementById("sidebarList");
  let stations = (state.stations||[]).filter(s => {
    if (sFilter==="open"   && s.status!=="open")   return false;
    if (sFilter==="closed" && s.status!=="closed") return false;
    if (sSearch && !s.name.toLowerCase().includes(sSearch)) return false;
    return true;
  });
  list.innerHTML = "";
  if (!stations.length) {
    list.innerHTML = `<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px;">Hech narsa topilmadi</div>`;
    return;
  }
  stations.forEach(s => {
    const el = document.createElement("div");
    el.className = "station-item" + (s.id===currentId?" active":"");
    el.innerHTML = `
      <div class="station-item__dot ${s.status==="open"?"open":""}"></div>
      <div class="station-item__info">
        <div class="station-item__name">${s.name}</div>
        <div class="station-item__meta">${s.district||s.region||"–"} · ${(s.fuels||[]).join(", ")}</div>
      </div>`;
    el.addEventListener("click", () => selectStation(s.id));
    list.appendChild(el);
  });
}

// ── DASHBOARD ────────────────────────────
function showDashboard() {
  document.getElementById("dashboardView").style.display = "flex";
  document.getElementById("editorView").style.display   = "none";
  document.getElementById("topbarSection").textContent  = "Dashboard";
  currentId = null;
  renderSidebar();
}

function renderDashboard() {
  const st = state.stations||[];
  const open = st.filter(s=>s.status==="open").length;
  const locs = (state.locations||[]);

  document.getElementById("ds-total").textContent   = st.length;
  document.getElementById("ds-open").textContent    = open;
  document.getElementById("ds-closed").textContent  = st.length - open;
  document.getElementById("ds-regions").textContent = locs.length;

  // Fuel bars
  const fuelTypes = ["Metan","Benzin","Dizel","Propan"];
  const fuelColors= { Metan:"#3b82f6", Benzin:"#f43f5e", Dizel:"#f59e0b", Propan:"#a855f7" };
  const fuelBar = document.getElementById("ds-fuels");
  fuelBar.innerHTML = "";
  fuelTypes.forEach(f => {
    const cnt = st.filter(s=>(s.fuels||[]).includes(f)).length;
    const pct = st.length ? Math.round(cnt/st.length*100) : 0;
    fuelBar.innerHTML += `
      <div class="fuel-bar">
        <span class="fuel-bar__name">${f}</span>
        <div class="fuel-bar__track"><div class="fuel-bar__fill" style="width:${pct}%;background:${fuelColors[f]||"#22d87a"}"></div></div>
        <span class="fuel-bar__count">${cnt}</span>
      </div>`;
  });

  // Regions list
  const regList = document.getElementById("ds-regions-list");
  regList.innerHTML = "";
  locs.forEach(loc => {
    const name = loc.region||loc.city;
    const cnt  = st.filter(s=>s.region===name).length;
    const row  = document.createElement("div");
    row.className = "region-row";
    row.innerHTML = `
      <div>
        <div class="region-row__name">${name}</div>
        <div class="region-row__meta">${(loc.districts||[]).join(", ")||"Tumanlar yo'q"}</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:12px;color:var(--accent);font-weight:700;">${cnt} ta</span>
        <button class="region-row__del" data-r="${name}">✕</button>
      </div>`;
    row.querySelector(".region-row__del").addEventListener("click", async e => {
      e.stopPropagation();
      const ok = await confirmDialog(`"${name}" viloyatini o'chirish`, "Bu viloyatdagi barcha zapravkalar ham o'chiriladi!");
      if (!ok) return;
      state.stations = state.stations.filter(s=>s.region!==name);
      state.locations = state.locations.filter(l=>(l.region||l.city)!==name);
      saveState(); renderSidebar(); renderDashboard();
      toast(`${name} o'chirildi`, "ok");
    });
    regList.appendChild(row);
  });

  // Tags
  renderTagsOnDashboard();
}

function renderTagsOnDashboard() {
  ensureTags();
  const wrap = document.getElementById("ds-tags");
  wrap.innerHTML = "";
  (state.tags||[]).forEach((tag,i) => {
    const chip = document.createElement("div");
    chip.className = "tag-chip";
    chip.innerHTML = `
      <span>🏷 ${tag}</span>
      <button class="tag-chip__edit" title="O'zgartirish">✏️</button>
      <button class="tag-chip__del" title="O'chirish">✕</button>`;
    chip.querySelector(".tag-chip__edit").addEventListener("click", () => {
      const newName = prompt(`"${tag}" ni o'zgartirish:`, tag);
      if (!newName?.trim() || newName.trim()===tag) return;
      const trimmed = newName.trim();
      (state.stations||[]).forEach(s => {
        if(s.tags) { const ti=s.tags.indexOf(tag); if(ti!==-1) s.tags[ti]=trimmed; }
      });
      state.tags[i] = trimmed;
      saveState(); renderTagsOnDashboard();
      if (currentId) fillEditor(currentId);
      toast(`"${tag}" → "${trimmed}"`, "ok");
    });
    chip.querySelector(".tag-chip__del").addEventListener("click", async () => {
      const ok = await confirmDialog(`"${tag}" tegini o'chirish`, "Bu teg barcha zapravkalardan ham o'chiriladi.");
      if (!ok) return;
      state.tags.splice(i,1);
      (state.stations||[]).forEach(s => { if(s.tags) s.tags=s.tags.filter(t=>t!==tag); });
      saveState(); renderTagsOnDashboard();
      if (currentId) fillEditor(currentId);
      toast(`"${tag}" o'chirildi`);
    });
    wrap.appendChild(chip);
  });
}

// Add tag
document.getElementById("tagAddBtn").addEventListener("click", () => {
  const v = (document.getElementById("tagAddInput").value||"").trim();
  if (!v) return;
  ensureTags();
  if (state.tags.includes(v)) { toast("Bu teg allaqachon mavjud!", "err"); return; }
  state.tags.push(v);
  saveState(); renderTagsOnDashboard();
  document.getElementById("tagAddInput").value = "";
  if (currentId) fillEditor(currentId);
  toast(`"${v}" teqi qo'shildi`, "ok");
});
document.getElementById("tagAddInput").addEventListener("keydown", e => { if(e.key==="Enter") document.getElementById("tagAddBtn").click(); });

// Add region
document.getElementById("addRegionBtn").addEventListener("click", () => {
  const reg = (document.getElementById("newRegionInput").value||"").trim();
  const dis = (document.getElementById("newDistrictInput").value||"").trim();
  if (!reg) { toast("Viloyat nomini kiriting!", "err"); return; }
  ensureLocations();
  let loc = state.locations.find(l=>(l.region||l.city)===reg);
  if (!loc) { loc={region:reg,city:reg,districts:[]}; state.locations.push(loc); }
  if (dis && !loc.districts.includes(dis)) loc.districts.push(dis);
  state.locations.sort((a,b)=>(a.region||a.city||"").localeCompare(b.region||b.city||""));
  loc.districts.sort();
  saveState(); renderDashboard();
  document.getElementById("newRegionInput").value  = "";
  document.getElementById("newDistrictInput").value = "";
  toast(`${reg} qo'shildi`, "ok");
});

// ── STATION EDITOR ────────────────────────
function selectStation(id) {
  currentId = id;
  renderSidebar();
  document.getElementById("dashboardView").style.display = "none";
  document.getElementById("editorView").style.display    = "flex";
  fillEditor(id);
  initEditorMap(id);
  document.getElementById("topbarSection").textContent = "Zapravka tahrirlash";
}

function fillEditor(id) {
  const s = (state.stations||[]).find(x=>x.id===id);
  if (!s) return;

  document.getElementById("editorTitle").textContent = s.name||"—";
  const badge = document.getElementById("editorBadge");
  badge.textContent = s.status==="open" ? "✅ Ochiq" : "🔴 Yopiq";
  badge.className   = "editor-status-badge " + (s.status==="open"?"open":"closed");

  document.getElementById("fName").value     = s.name||"";
  document.getElementById("fOpenTime").value = s.openTime||"";
  document.getElementById("fLat").value      = s.lat||"";
  document.getElementById("fLng").value      = s.lng||"";

  // Status toggle
  const optO = document.getElementById("sOptOpen");
  const optC = document.getElementById("sOptClosed");
  optO.classList.toggle("on", s.status==="open");
  optC.classList.toggle("on", s.status!=="open");

  // Region/District
  const regSel = document.getElementById("fRegion");
  regSel.innerHTML = "";
  (state.locations||[]).forEach(loc => {
    const o = document.createElement("option"); const v=loc.region||loc.city;
    o.value=v; o.textContent=v; regSel.appendChild(o);
  });
  regSel.value = s.region||"";
  fillDistrictSelect(s.region, s.district);

  // Fuels
  document.querySelectorAll(".fuel-chip").forEach(chip => {
    chip.classList.toggle("on", (s.fuels||[]).includes(chip.dataset.fuel));
  });

  // Tags
  const tagsWrap = document.getElementById("tagsChipsEditor");
  tagsWrap.innerHTML = "";
  (state.tags||[]).forEach(tag => {
    const btn = document.createElement("button");
    btn.className = "tag-toggle" + ((s.tags||[]).includes(tag)?" on":"");
    btn.textContent = tag;
    btn.addEventListener("click", () => btn.classList.toggle("on"));
    tagsWrap.appendChild(btn);
  });
}

function fillDistrictSelect(region, selectedDist) {
  const sel = document.getElementById("fDistrict");
  sel.innerHTML = "";
  const loc = (state.locations||[]).find(l=>(l.region||l.city)===region);
  const dists = (loc?.districts)||[];
  dists.forEach(d => { const o=document.createElement("option"); o.value=d; o.textContent=d; sel.appendChild(o); });
  if (selectedDist) sel.value = selectedDist;
}

document.getElementById("fRegion").addEventListener("change", function() {
  fillDistrictSelect(this.value, "");
});

// Status toggle
document.getElementById("sOptOpen").addEventListener("click",   () => {
  document.getElementById("sOptOpen").classList.add("on");
  document.getElementById("sOptClosed").classList.remove("on");
});
document.getElementById("sOptClosed").addEventListener("click", () => {
  document.getElementById("sOptClosed").classList.add("on");
  document.getElementById("sOptOpen").classList.remove("on");
});

// Fuel chips
document.querySelectorAll(".fuel-chip").forEach(chip => {
  chip.addEventListener("click", () => chip.classList.toggle("on"));
});

// ── SAVE ─────────────────────────────────
document.getElementById("eSave").addEventListener("click", () => {
  const s = (state.stations||[]).find(x=>x.id===currentId);
  if (!s) return;
  const oldStatus = s.status;

  s.name     = document.getElementById("fName").value.trim() || s.name;
  s.region   = document.getElementById("fRegion").value;
  s.district = document.getElementById("fDistrict").value;
  s.openTime = document.getElementById("fOpenTime").value.trim() || "24/7";
  s.status   = document.getElementById("sOptOpen").classList.contains("on") ? "open" : "closed";
  s.fuels    = [...document.querySelectorAll(".fuel-chip.on")].map(c=>c.dataset.fuel);
  s.tags     = [...document.querySelectorAll("#tagsChipsEditor .tag-toggle.on")].map(b=>b.textContent);

  const lat = parseFloat(document.getElementById("fLat").value);
  const lng = parseFloat(document.getElementById("fLng").value);
  if (!isNaN(lat)) s.lat = lat;
  if (!isNaN(lng)) s.lng = lng;

  ensureLocations();
  saveState(); renderSidebar(); renderDashboard();
  fillEditor(currentId);

  // Update editor title+badge
  document.getElementById("editorTitle").textContent = s.name;
  const badge = document.getElementById("editorBadge");
  badge.textContent = s.status==="open"?"✅ Ochiq":"🔴 Yopiq";
  badge.className   = "editor-status-badge "+(s.status==="open"?"open":"closed");

  if (oldStatus!=="open" && s.status==="open") {
    localStorage.setItem("lastNotification", JSON.stringify({name:s.name, status:"ochildi", time:new Date().toISOString()}));
  }

  toast(`"${s.name}" saqlandi!`, "ok");
  updateEditorMapMarker(s);
});

// ── DELETE ────────────────────────────────
document.getElementById("eDelete").addEventListener("click", async () => {
  const s = (state.stations||[]).find(x=>x.id===currentId);
  if (!s) return;
  const ok = await confirmDialog(`"${s.name}" ni o'chirish`, "Bu amalni qaytarib bo'lmaydi. Davom etasizmi?");
  if (!ok) return;
  state.stations = state.stations.filter(x=>x.id!==currentId);
  saveState(); renderSidebar(); renderDashboard(); showDashboard();
  toast(`"${s.name}" o'chirildi`,"ok");
});

// ── ADD NEW ───────────────────────────────
function addNewStation() {
  const newId = Math.max(0,...(state.stations||[]).map(s=>s.id||0)) + 1;
  const s = { id:newId, name:"Yangi zapravka #"+newId, fuels:["Metan"], tags:[], status:"closed", region:(state.locations[0]?.region||"Toshkent viloyati"), district:"", openTime:"24/7", lat:41.33, lng:69.29 };
  state.stations.push(s);
  ensureLocations();
  saveState(); renderSidebar();
  selectStation(newId);
  toast("Yangi zapravka yaratildi", "ok");
}

// ── EDITOR MAP ────────────────────────────
function initEditorMap(stationId) {
  if (typeof ymaps === "undefined") return;
  const s = (state.stations||[]).find(x=>x.id===stationId);
  if (!s) return;

  ymaps.ready(() => {
    const el = document.getElementById("editorMap");
    if (editorMap) { try { editorMap.destroy(); } catch(_){} editorMap=null; editorMark=null; }
    editorMap = new ymaps.Map("editorMap", {
      center: [s.lat||41.33, s.lng||69.29],
      zoom: 14,
      controls: ["zoomControl","geolocationControl"]
    }, { suppressMapOpenBlock: true });

    editorMark = new ymaps.Placemark([s.lat||41.33, s.lng||69.29], { hintContent: s.name }, { draggable: true, preset: "islands#greenFuelStationIcon" });
    editorMap.geoObjects.add(editorMark);

    // Drag marker → update coords
    editorMark.events.add("dragend", () => {
      const [lat,lng] = editorMark.geometry.getCoordinates();
      document.getElementById("fLat").value = lat.toFixed(6);
      document.getElementById("fLng").value = lng.toFixed(6);
      toast("Koordinata yangilandi", "info");
    });

    // Click map → set marker
    editorMap.events.add("click", e => {
      if (!pickMode) return;
      const [lat,lng] = e.get("coords");
      editorMark.geometry.setCoordinates([lat,lng]);
      document.getElementById("fLat").value = lat.toFixed(6);
      document.getElementById("fLng").value = lng.toFixed(6);
      setPickMode(false);
      toast("Joylashuv belgilandi ✓", "ok");
    });
  });
}

function updateEditorMapMarker(s) {
  if (!editorMark || !s.lat || !s.lng) return;
  try { editorMark.geometry.setCoordinates([s.lat, s.lng]); } catch(_){}
  try { if(editorMap) editorMap.setCenter([s.lat,s.lng]); } catch(_){}
}

// Pick mode
document.getElementById("coordPickBtn").addEventListener("click", () => setPickMode(!pickMode));

function setPickMode(on) {
  pickMode = on;
  const hint = document.getElementById("mapClickHint");
  const btn  = document.getElementById("coordPickBtn");
  hint.classList.toggle("visible", on);
  btn.style.background = on ? "rgba(59,130,246,.25)" : "";
  btn.style.borderColor = on ? "var(--accent2)" : "";
  document.getElementById("editorMap").style.cursor = on ? "crosshair" : "";
}

// Coord inputs → move marker
function syncMarkerFromInputs() {
  const lat = parseFloat(document.getElementById("fLat").value);
  const lng = parseFloat(document.getElementById("fLng").value);
  if (isNaN(lat)||isNaN(lng)) return;
  if (editorMark) { try { editorMark.geometry.setCoordinates([lat,lng]); editorMap?.setCenter([lat,lng]); } catch(_){} }
}
document.getElementById("fLat").addEventListener("change", syncMarkerFromInputs);
document.getElementById("fLng").addEventListener("change", syncMarkerFromInputs);

// ══════════════════════════════════════════════════════
// NOTIFICATION SYSTEM — GazNav Admin v3.0
// ══════════════════════════════════════════════════════

const NOTIF_KEY = "gaznav-notifications-v1";

// Audience counts (simulated)
const AUDIENCE_COUNTS = {
  all:     2847,
  region:  1204,
  metan:    873,
  benzin:   651,
  dizel:    423,
  premium:  318
};

// ── Load/Save notifications ────────────────────────────
function loadNotifications() {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveNotifications(list) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(list));
}

let notifications = loadNotifications();

// ── Show notification view ─────────────────────────────
function showNotifView() {
  document.getElementById("dashboardView").style.display = "none";
  document.getElementById("editorView").style.display   = "none";
  document.getElementById("usersView").classList.remove("visible");
  document.getElementById("notifView").classList.add("visible");
  document.getElementById("topbarSection").textContent  = "Bildirishnomalar";
  currentId = null;
  renderSidebar();
  renderNotifHistory();
  updateNotifStats();
  updatePendingBadge();
}

function hideNotifView() {
  document.getElementById("notifView").classList.remove("visible");
}

// ── Pending badge ──────────────────────────────────────
function updatePendingBadge() {
  const pending = notifications.filter(n => n.status === "scheduled" && new Date(n.scheduledAt) > new Date()).length;
  const badge = document.getElementById("notifPendingBadge");
  if (pending > 0) {
    badge.textContent = pending;
    badge.style.display = "";
  } else {
    badge.style.display = "none";
  }
}

// ── Stats ──────────────────────────────────────────────
function updateNotifStats() {
  const sent  = notifications.filter(n => n.status === "sent").length;
  const sched = notifications.filter(n => n.status === "scheduled").length;
  const users = notifications.filter(n => n.status === "sent").reduce((s, n) => s + (n.audienceCount || 0), 0);

  document.getElementById("notifStatTotal").textContent = sent;
  document.getElementById("notifStatSched").textContent = sched;
  document.getElementById("notifStatUsers").textContent = users.toLocaleString();
}

// ── Notification type ──────────────────────────────────
let activeType = "info";
document.querySelectorAll(".notif-type-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".notif-type-btn").forEach(b => b.classList.remove("on"));
    btn.classList.add("on");
    activeType = btn.dataset.ntype;
  });
});

// ── Emoji insert ───────────────────────────────────────
document.querySelectorAll(".emoji-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const titleEl = document.getElementById("notifTitle");
    const pos = titleEl.selectionStart;
    const val = titleEl.value;
    titleEl.value = val.slice(0, pos) + btn.dataset.emoji + val.slice(pos);
    titleEl.focus();
    titleEl.selectionStart = titleEl.selectionEnd = pos + btn.dataset.emoji.length;
    updatePreview();
  });
});

// ── Preview update ─────────────────────────────────────
function updatePreview() {
  const title = document.getElementById("notifTitle").value || "Sarlavha...";
  const body  = document.getElementById("notifBody").value  || "Xabar matni bu yerda ko'rinadi...";
  const btn   = document.getElementById("notifBtnText").value;
  const now   = new Date();
  const timeStr = now.getHours() + ":" + String(now.getMinutes()).padStart(2, "0");

  document.getElementById("previewTitle").textContent = title;
  document.getElementById("previewBody").textContent  = body;
  document.getElementById("previewTime").textContent  = timeStr;

  const previewBtnEl = document.getElementById("previewBtn");
  if (btn.trim()) {
    previewBtnEl.style.display = "";
    previewBtnEl.textContent = btn;
  } else {
    previewBtnEl.style.display = "none";
  }
}

document.getElementById("notifTitle").addEventListener("input", updatePreview);
document.getElementById("notifBody").addEventListener("input", () => {
  updatePreview();
  document.getElementById("notifCharCount").textContent = document.getElementById("notifBody").value.length;
});
document.getElementById("notifBtnText").addEventListener("input", updatePreview);

// ── Audience selector ──────────────────────────────────
let activeAudiences = new Set(["all"]);

document.querySelectorAll(".audience-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    const a = chip.dataset.audience;
    if (a === "all") {
      activeAudiences.clear();
      activeAudiences.add("all");
      document.querySelectorAll(".audience-chip").forEach(c => c.classList.remove("on"));
      chip.classList.add("on");
    } else {
      activeAudiences.delete("all");
      document.querySelector('[data-audience="all"]').classList.remove("on");
      if (chip.classList.contains("on")) {
        chip.classList.remove("on");
        activeAudiences.delete(a);
        if (activeAudiences.size === 0) {
          activeAudiences.add("all");
          document.querySelector('[data-audience="all"]').classList.add("on");
        }
      } else {
        chip.classList.add("on");
        activeAudiences.add(a);
      }
    }
    updateAudienceCount();
  });
});

function updateAudienceCount() {
  if (activeAudiences.has("all")) {
    document.getElementById("audienceCountVal").textContent = AUDIENCE_COUNTS.all.toLocaleString();
    return;
  }
  const total = [...activeAudiences].reduce((s, a) => s + (AUDIENCE_COUNTS[a] || 0), 0);
  document.getElementById("audienceCountVal").textContent = Math.round(total * 0.85).toLocaleString();
}

// ── Schedule toggle ────────────────────────────────────
let isScheduled = false;
let scheduledDateTime = null;

document.getElementById("scheduleToggle").addEventListener("click", () => {
  isScheduled = !isScheduled;
  const toggle = document.getElementById("scheduleToggle");
  const inputs = document.getElementById("scheduleInputs");
  const badge  = document.getElementById("scheduleNowBadge");
  const schedBtn = document.getElementById("notifScheduleBtn");
  const sendBtn  = document.getElementById("notifSendBtn");

  toggle.classList.toggle("on", isScheduled);
  inputs.classList.toggle("visible", isScheduled);

  if (isScheduled) {
    // Default to 1 hour from now
    const d = new Date(Date.now() + 3600000);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById("scheduleDateTime").value = local;
    scheduledDateTime = d;
    badge.style.display = "none";
    schedBtn.style.display = "";
    sendBtn.style.display = "none";
  } else {
    scheduledDateTime = null;
    badge.style.display = "";
    schedBtn.style.display = "none";
    sendBtn.style.display = "";
  }
});

document.getElementById("scheduleClearBtn").addEventListener("click", () => {
  isScheduled = false;
  document.getElementById("scheduleToggle").classList.remove("on");
  document.getElementById("scheduleInputs").classList.remove("visible");
  document.getElementById("scheduleNowBadge").style.display = "";
  document.getElementById("notifScheduleBtn").style.display = "none";
  document.getElementById("notifSendBtn").style.display = "";
  scheduledDateTime = null;
});

document.getElementById("scheduleDateTime").addEventListener("change", function() {
  scheduledDateTime = new Date(this.value);
});

// ── Send notification ──────────────────────────────────
function getAudienceCount() {
  if (activeAudiences.has("all")) return AUDIENCE_COUNTS.all;
  return Math.round([...activeAudiences].reduce((s, a) => s + (AUDIENCE_COUNTS[a] || 0), 0) * 0.85);
}

function buildNotifObject(status) {
  const title = document.getElementById("notifTitle").value.trim();
  const body  = document.getElementById("notifBody").value.trim();
  const btnText = document.getElementById("notifBtnText").value.trim();
  const audCount = getAudienceCount();

  return {
    id:            Date.now(),
    type:          activeType,
    title:         title,
    body:          body,
    btnText:       btnText,
    audiences:     [...activeAudiences],
    audienceCount: audCount,
    status:        status,
    createdAt:     new Date().toISOString(),
    scheduledAt:   status === "scheduled" ? (scheduledDateTime || new Date()).toISOString() : null,
    sentAt:        status === "sent" ? new Date().toISOString() : null,
    reads:         status === "sent" ? Math.round(audCount * (0.4 + Math.random() * 0.3)) : 0,
    clicks:        status === "sent" ? Math.round(audCount * (0.08 + Math.random() * 0.12)) : 0
  };
}

function validateNotif() {
  const title = document.getElementById("notifTitle").value.trim();
  const body  = document.getElementById("notifBody").value.trim();
  if (!title) { toast("Sarlavhani kiriting!", "err"); document.getElementById("notifTitle").focus(); return false; }
  if (!body)  { toast("Xabar matnini kiriting!", "err"); document.getElementById("notifBody").focus(); return false; }
  return true;
}

// Send now
document.getElementById("notifSendBtn").addEventListener("click", async () => {
  if (!validateNotif()) return;
  const count = getAudienceCount();

  const ok = await confirmDialog(
    `${count.toLocaleString()} foydalanuvchiga yuborish`,
    `"${document.getElementById("notifTitle").value}" xabarini hozir yuboribasizmi?`
  );
  if (!ok) return;

  // Animate sending
  const btn = document.getElementById("notifSendBtn");
  const icon = document.getElementById("notifSendBtnIcon");
  const text = document.getElementById("notifSendBtnText");
  btn.disabled = true;
  icon.textContent = "⏳";
  text.textContent = "Yuborilmoqda...";
  icon.classList.add("sending-anim");

  await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));

  const notif = buildNotifObject("sent");
  notifications.unshift(notif);
  saveNotifications(notifications);

  btn.disabled = false;
  icon.textContent = "📤";
  text.textContent = "Yuborish";
  icon.classList.remove("sending-anim");

  clearNotifForm();
  renderNotifHistory();
  updateNotifStats();
  updatePendingBadge();
  toast(`✅ ${count.toLocaleString()} foydalanuvchiga yuborildi!`, "ok");

  // Simulate notification appearing in main app
  localStorage.setItem("lastNotification", JSON.stringify({
    title: notif.title, body: notif.body, time: notif.sentAt
  }));
});

// Schedule
document.getElementById("notifScheduleBtn").addEventListener("click", async () => {
  if (!validateNotif()) return;
  if (!scheduledDateTime || scheduledDateTime <= new Date()) {
    toast("Kelajak vaqtni tanlang!", "err");
    document.getElementById("scheduleDateTime").focus();
    return;
  }

  const count = getAudienceCount();
  const timeStr = scheduledDateTime.toLocaleString("uz-UZ");
  const ok = await confirmDialog(
    `Xabarni rejalashtirish`,
    `${timeStr} da ${count.toLocaleString()} foydalanuvchiga yuboriladi.`
  );
  if (!ok) return;

  const notif = buildNotifObject("scheduled");
  notifications.unshift(notif);
  saveNotifications(notifications);

  clearNotifForm();
  renderNotifHistory();
  updateNotifStats();
  updatePendingBadge();
  toast(`⏰ Xabar ${timeStr} ga rejalashtirildi`, "ok");

  // Start countdown timer for this notification
  scheduleDelivery(notif);
});

// ── Schedule delivery timer ────────────────────────────
function scheduleDelivery(notif) {
  const delay = new Date(notif.scheduledAt) - new Date();
  if (delay <= 0 || delay > 24 * 3600 * 1000) return; // Only schedule if within 24h
  setTimeout(() => {
    const list = loadNotifications();
    const idx = list.findIndex(n => n.id === notif.id);
    if (idx === -1 || list[idx].status !== "scheduled") return;
    list[idx].status = "sent";
    list[idx].sentAt = new Date().toISOString();
    list[idx].reads  = Math.round(list[idx].audienceCount * (0.4 + Math.random() * 0.3));
    list[idx].clicks = Math.round(list[idx].audienceCount * (0.08 + Math.random() * 0.12));
    saveNotifications(list);
    notifications = list;
    renderNotifHistory();
    updateNotifStats();
    updatePendingBadge();
    toast(`📨 "${notif.title}" xabari avtomatik yuborildi!`, "info");
  }, delay);
}

// On load, re-register pending schedulers
function reRegisterSchedulers() {
  notifications.forEach(n => {
    if (n.status === "scheduled") scheduleDelivery(n);
  });
}

// ── Clear form ─────────────────────────────────────────
function clearNotifForm() {
  document.getElementById("notifTitle").value  = "";
  document.getElementById("notifBody").value   = "";
  document.getElementById("notifBtnText").value = "";
  document.getElementById("notifCharCount").textContent = "0";
  updatePreview();
  // Reset schedule
  isScheduled = false;
  scheduledDateTime = null;
  document.getElementById("scheduleToggle").classList.remove("on");
  document.getElementById("scheduleInputs").classList.remove("visible");
  document.getElementById("scheduleNowBadge").style.display = "";
  document.getElementById("notifScheduleBtn").style.display = "none";
  document.getElementById("notifSendBtn").style.display = "";
}

// ── Render history ─────────────────────────────────────
const TYPE_ICONS = { info: "ℹ️", alert: "⚠️", promo: "🎁", update: "🔄" };
const TYPE_LABELS = { info: "Xabar", alert: "Ogohlantirish", promo: "Aksiya", update: "Yangilanish" };
const AUDIENCE_LABELS = { all: "Barchasi", region: "Toshkent", metan: "Metan", benzin: "Benzin", dizel: "Dizel", premium: "Premium" };

function renderNotifHistory() {
  const container = document.getElementById("notifHistoryList");
  container.innerHTML = "";

  if (!notifications.length) {
    container.innerHTML = `
      <div class="notif-empty">
        <div class="notif-empty__icon">📭</div>
        <div class="notif-empty__label">Hozircha bildirishnoma yo'q</div>
      </div>`;
    return;
  }

  notifications.forEach((n, idx) => {
    const card = document.createElement("div");
    card.className = "hist-card";

    const isScheduled = n.status === "scheduled";
    const isCancelled = n.status === "cancelled";
    const schedDate = n.scheduledAt ? new Date(n.scheduledAt) : null;
    const sentDate  = n.sentAt ? new Date(n.sentAt) : null;
    const now = new Date();

    // Time remaining for scheduled
    let timeRemaining = "";
    if (isScheduled && schedDate > now) {
      const diff = schedDate - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      timeRemaining = h > 0 ? `${h}s ${m}d qoldi` : `${m} daqiqa qoldi`;
    }

    const audienceTags = (n.audiences || ["all"])
      .map(a => `<span class="hist-tag">${AUDIENCE_LABELS[a] || a}</span>`)
      .join("");

    let statusBadge = "";
    let footerExtra = "";
    if (n.status === "sent") {
      statusBadge = `<span class="hist-badge hist-badge--sent">✓ Yuborildi</span>`;
      const sentStr = sentDate ? sentDate.toLocaleString("uz-UZ") : "";
      footerExtra = `
        <span class="hist-stat">👁 <strong>${(n.reads||0).toLocaleString()}</strong> o'qidi</span>
        <span class="hist-stat">🖱 <strong>${(n.clicks||0).toLocaleString()}</strong> bosdi</span>
        <span class="hist-stat">📅 ${sentStr}</span>`;
    } else if (isScheduled) {
      statusBadge = `<span class="hist-badge hist-badge--sched">⏰ Rejalashtirilgan</span>`;
      const schedStr = schedDate ? schedDate.toLocaleString("uz-UZ") : "";
      footerExtra = `
        <span class="hist-stat">📅 <strong>${schedStr}</strong></span>
        ${timeRemaining ? `<span class="hist-stat" style="color:var(--warn)">${timeRemaining}</span>` : ""}
        <button class="hist-cancel-btn" data-idx="${idx}">Bekor qilish</button>`;
    } else if (isCancelled) {
      statusBadge = `<span class="hist-badge hist-badge--cancelled">✕ Bekor qilingan</span>`;
    }

    card.innerHTML = `
      <div class="hist-card__header">
        <div class="hist-card__icon">${TYPE_ICONS[n.type] || "🔔"}</div>
        <div class="hist-card__meta">
          <div class="hist-card__title">${n.title || "(Sarlavsiz)"}</div>
          <div class="hist-card__body">${n.body || ""}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
          ${statusBadge}
          <button class="hist-del-btn" data-idx="${idx}" title="O'chirish">🗑</button>
        </div>
      </div>
      <div class="hist-card__tags">
        <span class="hist-tag" style="background:rgba(34,216,122,.08);color:var(--accent);border-color:rgba(34,216,122,.2)">${TYPE_LABELS[n.type]||"Xabar"}</span>
        ${audienceTags}
        <span class="hist-tag">👥 ${(n.audienceCount||0).toLocaleString()} ta</span>
        ${n.btnText ? `<span class="hist-tag">🔗 ${n.btnText}</span>` : ""}
      </div>
      <div class="hist-card__footer">${footerExtra}</div>`;

    // Delete
    card.querySelector(".hist-del-btn").addEventListener("click", async () => {
      const ok = await confirmDialog("Tarixdan o'chirish", "Bu yozuv o'chiriladimi?");
      if (!ok) return;
      notifications.splice(idx, 1);
      saveNotifications(notifications);
      renderNotifHistory();
      updateNotifStats();
      updatePendingBadge();
      toast("O'chirildi", "ok");
    });

    // Cancel scheduled
    const cancelBtn = card.querySelector(".hist-cancel-btn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", async () => {
        const ok = await confirmDialog("Bekor qilish", "Rejalashtirilgan xabar bekor qilinsinmi?");
        if (!ok) return;
        notifications[idx].status = "cancelled";
        saveNotifications(notifications);
        renderNotifHistory();
        updateNotifStats();
        updatePendingBadge();
        toast("Rejalashtirilgan xabar bekor qilindi", "info");
      });
    }

    container.appendChild(card);
  });
}

// ── USERS VIEW ──────────────────────────────────────────
const USERS_KEY = "gaznav-users";
let selectedUserId = null;

function showUsersView() {
  document.getElementById("dashboardView").style.display = "none";
  document.getElementById("editorView").style.display    = "none";
  document.getElementById("notifView").classList.remove("visible");
  document.getElementById("usersView").classList.add("visible");
  document.getElementById("topbarSection").textContent   = "Foydalanuvchilar";
  currentId = null;
  renderSidebar();
  renderUsersTable();
}

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "{}"); }
  catch { return {}; }
}

function getUsersList() {
  const usersObj = loadUsers();
  return Object.values(usersObj).sort((a,b) => (b.lastActive||0) - (a.lastActive||0));
}

function formatTimeAgo(ts) {
  if (!ts) return "–";
  const diff = Date.now() - ts;
  const m = Math.floor(diff/60000);
  if (m < 1) return "hozirgina";
  if (m < 60) return m + " min oldin";
  const h = Math.floor(m/60);
  if (h < 24) return h + " soat oldin";
  const d = Math.floor(h/24);
  return d + " kun oldin";
}

function isOnline(ts) { return ts && (Date.now() - ts) < 600000; } // 10 min

function renderUsersTable() {
  const users = getUsersList();
  const tbody = document.getElementById("usersTableBody");

  // Stats
  const withProfile = users.filter(u => u.profile?.name || u.profile?.phone).length;
  const totalCars = users.reduce((s,u) => s + (u.cars||[]).length, 0);
  document.getElementById("usersStatTotal").textContent = users.length;
  document.getElementById("usersStatProfiles").textContent = withProfile;
  document.getElementById("usersStatCars").textContent = totalCars;

  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="users-table-empty">Foydalanuvchilar topilmadi.<br><span style="font-size:11px;opacity:.6;">Bosh sahifada kabinet orqali profil to\'ldirilganda foydalanuvchilar bu yerda paydo bo\'ladi.</span></td></tr>';
    return;
  }

  tbody.innerHTML = "";
  users.forEach((u, i) => {
    const name = u.profile?.name || "";
    const phone = u.profile?.phone || "";
    const carsCount = (u.cars||[]).length;
    const favsCount = (u.favorites||[]).length;
    const online = isOnline(u.lastActive);
    const tr = document.createElement("tr");
    if (u.id === selectedUserId) tr.classList.add("active");
    tr.innerHTML = `
      <td style="color:var(--muted);font-size:11px;">${i+1}</td>
      <td><span class="${name?"ut-name":"ut-name ut-name--empty"}">${name || "Nomsiz"}</span></td>
      <td><span class="ut-phone">${phone || "–"}</span></td>
      <td><span class="ut-badge ${carsCount?"ut-badge--on":"ut-badge--off"}">${carsCount}</span></td>
      <td><span class="ut-badge ${favsCount?"ut-badge--on":"ut-badge--off"}">${favsCount}</span></td>
      <td><span class="ut-time">${formatTimeAgo(u.lastActive)}</span></td>
      <td><span class="ut-dot ${online?"ut-dot--online":"ut-dot--offline"}"></span></td>`;
    tr.addEventListener("click", () => {
      selectedUserId = u.id;
      renderUsersTable();
      renderUserDetail(u);
    });
    tbody.appendChild(tr);
  });
}

function renderUserDetail(u) {
  const panel = document.getElementById("usersDetailSide");
  const stations = state.stations || [];
  const profile = u.profile || {};
  const cars = u.cars || [];
  const favs = u.favorites || [];
  const recent = u.recentViewed || [];
  const settings = u.settings || {};
  const geo = u.geo;
  const name = profile.name || "Nomsiz";
  const phone = profile.phone || "";
  const online = isOnline(u.lastActive);
  const regDate = u.registeredAt ? new Date(u.registeredAt).toLocaleDateString("uz-UZ") : "–";

  // Build favs HTML
  let favsHtml = "";
  if (favs.length) {
    favs.forEach(fid => {
      const s = stations.find(x=>x.id===fid);
      if (!s) { favsHtml += `<div class="ud-item"><div class="ud-item__icon ud-item__icon--fuel"><span>❓</span></div><div class="ud-item__info"><div class="ud-item__name">ID: ${fid}</div><div class="ud-item__meta">O'chirilgan</div></div></div>`; return; }
      favsHtml += `<div class="ud-item"><div class="ud-item__icon ud-item__icon--fuel"><span>⛽</span></div><div class="ud-item__info"><div class="ud-item__name">${s.name}</div><div class="ud-item__meta">${s.region||""} · ${(s.fuels||[]).join(", ")} · ${s.openTime||""}</div></div><span class="ud-item__tag">${s.status==="open"?"Ochiq":"Yopiq"}</span></div>`;
    });
  } else { favsHtml = '<div class="ud-empty">Sevimli zapravka belgilanmagan</div>'; }

  // Cars HTML
  let carsHtml = "";
  if (cars.length) {
    cars.forEach(c => {
      carsHtml += `<div class="ud-item"><div class="ud-item__icon ud-item__icon--car">🚗</div><div class="ud-item__info"><div class="ud-item__name">${c.name||"Nomsiz"}</div></div><span class="ud-item__tag">${c.quality||"–"}</span></div>`;
    });
  } else { carsHtml = '<div class="ud-empty">Avtomobil qo\'shilmagan</div>'; }

  // Recent HTML
  let recentHtml = "";
  if (recent.length) {
    recent.slice(0,8).forEach((r,i) => {
      const s = stations.find(x=>x.id===r.id);
      recentHtml += `<div class="ud-item"><div class="ud-item__icon" style="background:var(--bg3);font-size:10px;font-weight:800;color:var(--muted)">${i+1}</div><div class="ud-item__info"><div class="ud-item__name">${s?s.name:"ID:"+r.id}</div><div class="ud-item__meta">${formatTimeAgo(r.time)}</div></div></div>`;
    });
  } else { recentHtml = '<div class="ud-empty">Ko\'rilgan zapravka yo\'q</div>'; }

  // Geo HTML
  let geoHtml = '<div class="ud-empty">Geolokatsiya ma\'lumoti yo\'q</div>';
  if (geo && geo.lat != null) {
    const geoTime = geo.timestamp ? new Date(geo.timestamp).toLocaleString("uz-UZ") : "–";
    geoHtml = `
      <div class="ud-row"><span class="ud-row__label">Koordinata</span><span class="ud-row__val">${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)}</span></div>
      <div class="ud-row" style="margin-top:4px"><span class="ud-row__label">Yangilangan</span><span class="ud-row__val">${geoTime}</span></div>`;
  }

  panel.innerHTML = `
    <div class="ud-header">
      <div class="ud-avatar"><span>👤</span></div>
      <div class="ud-info">
        <div class="ud-name">${name}</div>
        <div class="ud-meta">${phone || "Telefon kiritilmagan"} · <span style="color:${online?"var(--accent)":"var(--muted)"}">${online?"● Onlayn":"○ Oflayn"}</span></div>
        <div class="ud-id">ID: ${u.id} · Ro'yxatdan: ${regDate}</div>
      </div>
    </div>
    <div class="ud-grid">
      <div class="ud-card">
        <div class="ud-card-title"><span>📋 Profil</span></div>
        <div class="ud-row"><span class="ud-row__label">Ism</span><span class="ud-row__val ${name==="Nomsiz"?"ud-row__val--empty":""}">${name}</span></div>
        <div class="ud-row"><span class="ud-row__label">Telefon</span><span class="ud-row__val ${phone?"":"ud-row__val--empty"}">${phone||"kiritilmagan"}</span></div>
      </div>
      <div class="ud-card">
        <div class="ud-card-title"><span>🚗 Avtomobillar</span><span class="ud-card-badge">${cars.length}</span></div>
        ${carsHtml}
      </div>
      <div class="ud-card ud-card--full">
        <div class="ud-card-title"><span>⭐ Sevimli zapravkalar</span><span class="ud-card-badge">${favs.length}</span></div>
        ${favsHtml}
      </div>
      <div class="ud-card">
        <div class="ud-card-title"><span>🕐 Oxirgi ko'rilganlar</span><span class="ud-card-badge">${recent.length}</span></div>
        ${recentHtml}
      </div>
      <div class="ud-card">
        <div class="ud-card-title"><span>📍 Geolokatsiya</span></div>
        ${geoHtml}
      </div>
      <div class="ud-card ud-card--full">
        <div class="ud-card-title"><span>⚙️ Sozlamalar</span></div>
        <div class="ud-settings-grid">
          <div class="ud-setting"><span class="ud-setting__icon">🌐</span><span class="ud-setting__label">Til</span><span class="ud-setting__val ud-setting__val--neutral">${(settings.language||"uz").toUpperCase()}</span></div>
          <div class="ud-setting"><span class="ud-setting__icon">🎨</span><span class="ud-setting__label">Mavzu</span><span class="ud-setting__val ud-setting__val--neutral">${settings.theme==="light"?"Kunduzgi":"Tungi"}</span></div>
          <div class="ud-setting"><span class="ud-setting__icon">🔔</span><span class="ud-setting__label">Bildirishnoma</span><span class="ud-setting__val ${settings.notifications?"ud-setting__val--on":"ud-setting__val--off"}">${settings.notifications?"Yoqilgan":"O'chirilgan"}</span></div>
          <div class="ud-setting"><span class="ud-setting__icon">🔊</span><span class="ud-setting__label">Ovoz</span><span class="ud-setting__val ${settings.sound?"ud-setting__val--on":"ud-setting__val--off"}">${settings.sound?"Yoqilgan":"O'chirilgan"}</span></div>
          <div class="ud-setting"><span class="ud-setting__icon">⛽</span><span class="ud-setting__label">Filtr</span><span class="ud-setting__val ${settings.filterFuel?"ud-setting__val--on":"ud-setting__val--off"}">${settings.filterFuel||"Hammasi"}</span></div>
          <div class="ud-setting"><span class="ud-setting__icon">📍</span><span class="ud-setting__label">Viloyat</span><span class="ud-setting__val ud-setting__val--neutral">${settings.selectedRegion||"–"}</span></div>
        </div>
      </div>
    </div>`;
}

// Nav button
document.getElementById("usersNavBtn").addEventListener("click", () => { showUsersView(); });
document.getElementById("usersRefreshBtn").addEventListener("click", () => { renderUsersTable(); if(selectedUserId){ const u=getUsersList().find(x=>x.id===selectedUserId); if(u) renderUserDetail(u); } toast("Yangilandi","ok"); });

// ── Nav button ─────────────────────────────────────────
document.getElementById("notifNavBtn").addEventListener("click", () => {
  showNotifView();
});

// Override showDashboard to hide notif view
const _origShowDashboard = showDashboard;
// patch: hide notif view when showing other panels
function hideNotifAndShow(fn) {
  return function(...args) {
    document.getElementById("notifView").classList.remove("visible");
    fn.apply(this, args);
  };
}

// Patch selectStation to hide notif view and users view
const _origSelectStation = selectStation;
window.selectStation = function(id) {
  document.getElementById("notifView").classList.remove("visible");
  document.getElementById("usersView").classList.remove("visible");
  _origSelectStation(id);
};

// Patch showDashboard
const origShowDashboard2 = showDashboard;
window.showDashboard = function() {
  document.getElementById("notifView").classList.remove("visible");
  document.getElementById("usersView").classList.remove("visible");
  origShowDashboard2();
};

// Patch addNewBtn
document.getElementById("addNewBtn").addEventListener("click", () => {
  document.getElementById("notifView").classList.remove("visible");
  document.getElementById("usersView").classList.remove("visible");
});

// ── Init notifications on app load ─────────────────────
const _origInitApp = initApp;
window.initApp = function() {
  _origInitApp();
  reRegisterSchedulers();
  updatePendingBadge();
};

// Kick off if already initialized
if (typeof initApp === "function") {
  // Will be called by initApp override
}
