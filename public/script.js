let userId = localStorage.getItem("userId");

if (!userId && !window.location.pathname.includes("login")) {
  window.location.href = "/login.html";
}

function toast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
}

// LOGIN
async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (data.error) return toast(data.error);

  localStorage.setItem("userId", data.userId);
  window.location.href = "/index.html";
}

// REGISTER
async function register() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/register", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (data.error) return toast("korisnik već postoji");

  toast("registriran");
}

// NAV
function goToAdd() {
  window.location.href = "/dodavanje.html";
}

function goToHistory() {
  window.location.href = "/history.html";
}

function goBack() {
  window.location.href = "/index.html";
}

function Logout() {
  localStorage.removeItem("userId");
  window.location.href = "/login.html";
}

// ABBREVIATIONS
async function loadAbbreviations() {
  if (!document.getElementById("list")) return;

  const res = await fetch(`/abbreviations/${userId}`);
  const data = await res.json();

  const list = document.getElementById("list");
  list.innerHTML = "";

  data.forEach(item => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <span>${item.short} → ${item.full}</span>
      <button onclick="del(${item.id})">Briši</button>
    `;
    list.appendChild(div);
  });
}

async function addAbbreviation() {
  const short = document.getElementById("short").value;
  const full = document.getElementById("full").value;

  const res = await fetch("/abbreviation", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ user_id: userId, short, full })
  });

  const data = await res.json();

  toast(data.replaced ? "zamjenjeno!" : "dodano");

  document.getElementById("short").value = "";
  document.getElementById("full").value = "";

  loadAbbreviations();
}

async function del(id) {
  await fetch(`/abbreviation/${id}`, { method: "DELETE" });
  loadAbbreviations();
}

// PROCESS
async function processText() {
  const text = document.getElementById("input").value;

  const res = await fetch("/process", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ user_id: userId, text })
  });

  const data = await res.json();
  document.getElementById("output").innerText = data.output;
}

// HISTORY
async function loadHistory() {
  if (!document.getElementById("historyList")) return;

  const res = await fetch(`/history/${userId}`);
  const data = await res.json();

  const list = document.getElementById("historyList");
  list.innerHTML = "";

  data.forEach(h => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `<b>${h.input}</b><br>${h.output}`;
    list.appendChild(div);
  });
}

// AUTO LOAD
loadAbbreviations();
loadHistory();