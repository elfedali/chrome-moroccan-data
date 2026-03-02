const formEl = document.getElementById("userForm");
const nameEl = document.getElementById("name");
const emailEl = document.getElementById("email");
const passwordEl = document.getElementById("password");
const addUserBtn = document.getElementById("addUserBtn");
const resetBtn = document.getElementById("resetBtn");
const usersListEl = document.getElementById("usersList");
const statusEl = document.getElementById("status");
const editStatusEl = document.getElementById("editStatus");

const defaultPasswordEl = document.getElementById("defaultPassword");
const saveDefaultPasswordBtn = document.getElementById("saveDefaultPasswordBtn");
const toggleDefaultPasswordBtn = document.getElementById("toggleDefaultPassword");
const togglePasswordBtn = document.getElementById("togglePassword");

const USERS_KEY = "savedUsers";
const DEFAULT_PASSWORD_KEY = "defaultPassword";
const DEFAULT_PASSWORD_FALLBACK = "Pa$$w0rd!";

let currentDefaultPassword = DEFAULT_PASSWORD_FALLBACK;
let editingUserId = null;

function setStatus(text) {
  statusEl.textContent = text;
}

function generateId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeName(value) {
  return String(value || "").trim();
}

async function getUsers() {
  const { [USERS_KEY]: savedUsers } = await chrome.storage.local.get({
    [USERS_KEY]: []
  });
  return Array.isArray(savedUsers) ? savedUsers : [];
}

async function setUsers(users) {
  await chrome.storage.local.set({ [USERS_KEY]: users });
}

async function getDefaultPassword() {
  const { [DEFAULT_PASSWORD_KEY]: defaultPassword } = await chrome.storage.local.get({
    [DEFAULT_PASSWORD_KEY]: DEFAULT_PASSWORD_FALLBACK
  });
  return typeof defaultPassword === "string" && defaultPassword.length
    ? defaultPassword
    : DEFAULT_PASSWORD_FALLBACK;
}

async function setDefaultPassword(value) {
  await chrome.storage.local.set({ [DEFAULT_PASSWORD_KEY]: value });
}

function renderUsers(users) {
  usersListEl.innerHTML = "";

  const eyeIcon = (open) => {
    // minimalist inline SVG; no external icons
    if (open) {
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      `;
    }
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
        <path d="M10.733 5.076A10.744 10.744 0 0 1 12 5c6.5 0 10 7 10 7a18.482 18.482 0 0 1-4.207 5.441" />
        <path d="M14.084 14.158A3 3 0 0 1 9.842 9.916" />
        <path d="M17.479 17.499A10.75 10.75 0 0 1 12 19c-6.5 0-10-7-10-7a18.386 18.386 0 0 1 4.282-5.498" />
        <path d="m2 2 20 20" />
      </svg>
    `;
  };

  // Attach to globals for the input toggles below
  renderUsers.eyeIcon = eyeIcon;

  if (!users.length) {
    const li = document.createElement("li");
    li.className = "text-sm text-slate-600";
    li.textContent = "No users saved yet.";
    usersListEl.appendChild(li);
    return;
  }

  for (const user of users) {
    const li = document.createElement("li");
    li.className = "rounded-lg border border-slate-200 bg-slate-50 p-3";

    const title = document.createElement("div");
    title.className = "text-sm font-semibold text-slate-900";
    title.textContent = user.name;

    const meta = document.createElement("div");
    meta.className = "mt-1 text-xs text-slate-600";
    meta.textContent = user.email;

    const pwRow = document.createElement("div");
    pwRow.className = "mt-2 flex items-center justify-between gap-2";

    const pwText = document.createElement("div");
    pwText.className = "text-xs text-slate-600";

    const realPassword = String(user.password || "");
    const masked = realPassword ? "•".repeat(Math.min(Math.max(realPassword.length, 6), 12)) : "(empty)";
    pwText.textContent = masked;

    const pwToggle = document.createElement("button");
    pwToggle.type = "button";
    pwToggle.className =
      "inline-flex items-center justify-center rounded-md border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50";
    pwToggle.setAttribute("aria-label", "Show password");
    pwToggle.innerHTML = eyeIcon(false);

    let isRevealed = false;
    pwToggle.addEventListener("click", () => {
      isRevealed = !isRevealed;
      pwText.textContent = isRevealed ? realPassword : masked;
      pwToggle.setAttribute("aria-label", isRevealed ? "Hide password" : "Show password");
      pwToggle.innerHTML = eyeIcon(!isRevealed);
    });

    pwRow.appendChild(pwText);
    pwRow.appendChild(pwToggle);

    const actionsRow = document.createElement("div");
    actionsRow.className = "mt-3 flex gap-2";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className =
      "inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50";
    editBtn.textContent = "Edit";

    editBtn.addEventListener("click", () => {
      startEditUser(user);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className =
      "inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-slate-50";
    deleteBtn.textContent = "Delete";

    deleteBtn.addEventListener("click", () => {
      const ok = confirm(`Delete user "${user.name}"?`);
      if (!ok) return;
      setStatus("Deleting...");
      deleteUserById(user.id)
        .then(() => setStatus("Deleted."))
        .catch((err) => setStatus(`Error: ${String(err)}`));
    });

    actionsRow.appendChild(editBtn);
    actionsRow.appendChild(deleteBtn);

    li.appendChild(title);
    li.appendChild(meta);
    li.appendChild(pwRow);
    li.appendChild(actionsRow);
    usersListEl.appendChild(li);
  }
}

function setPasswordVisibility({ inputEl, toggleBtn, isVisible, labelVisible, labelHidden }) {
  inputEl.type = isVisible ? "text" : "password";
  toggleBtn.setAttribute("aria-label", isVisible ? labelHidden : labelVisible);

  const iconFactory = renderUsers.eyeIcon;
  if (typeof iconFactory === "function") {
    // When visible, show the "open" eye.
    toggleBtn.innerHTML = iconFactory(isVisible);
  }
}

function setupPasswordToggle({ inputEl, toggleBtn, labelVisible, labelHidden }) {
  if (!inputEl || !toggleBtn) return;

  let isVisible = false;
  setPasswordVisibility({ inputEl, toggleBtn, isVisible, labelVisible, labelHidden });

  toggleBtn.addEventListener("click", () => {
    isVisible = !isVisible;
    setPasswordVisibility({ inputEl, toggleBtn, isVisible, labelVisible, labelHidden });
  });
}

function resetForm() {
  nameEl.value = "";
  emailEl.value = "";
  passwordEl.value = currentDefaultPassword;
  nameEl.focus();
  setEditMode(null);
}

function setEditMode(user) {
  if (!user) {
    editingUserId = null;
    addUserBtn.textContent = "Save user";
    editStatusEl.textContent = "";
    return;
  }

  editingUserId = user.id;
  addUserBtn.textContent = "Update user";
  editStatusEl.textContent = `Editing: ${user.name}`;
}

function startEditUser(user) {
  nameEl.value = String(user.name || "");
  emailEl.value = String(user.email || "");
  passwordEl.value = String(user.password || "");
  setEditMode(user);
  nameEl.focus();
}

async function init() {
  const [users, defaultPassword] = await Promise.all([getUsers(), getDefaultPassword()]);
  currentDefaultPassword = defaultPassword;
  defaultPasswordEl.value = defaultPassword;
  if (!passwordEl.value) passwordEl.value = defaultPassword;
  renderUsers(users);
  setEditMode(null);

  setupPasswordToggle({
    inputEl: defaultPasswordEl,
    toggleBtn: toggleDefaultPasswordBtn,
    labelVisible: "Show default password",
    labelHidden: "Hide default password"
  });

  setupPasswordToggle({
    inputEl: passwordEl,
    toggleBtn: togglePasswordBtn,
    labelVisible: "Show password",
    labelHidden: "Hide password"
  });
}

async function addOrUpdateUser({ id, name, email, password }) {
  const users = await getUsers();

  const existingIndex =
    id ? users.findIndex((u) => u.id === id) :
    users.findIndex((u) => String(u.name || "").toLowerCase() === name.toLowerCase());

  const record = {
    id: existingIndex >= 0 ? users[existingIndex].id : generateId(),
    name,
    email,
    password
  };

  if (existingIndex >= 0) {
    users[existingIndex] = record;
  } else {
    users.push(record);
  }

  // Keep a stable order: SuperAdmin/Admin/User in the order they were added.
  await setUsers(users);
  renderUsers(users);
}

async function deleteUserById(id) {
  const users = await getUsers();
  const next = users.filter((u) => u.id !== id);
  await setUsers(next);
  renderUsers(next);

  if (editingUserId === id) {
    resetForm();
  }
}

formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  setStatus("");

  const name = normalizeName(nameEl.value);
  const email = String(emailEl.value || "").trim();
  const password = String(passwordEl.value || "") || currentDefaultPassword;

  if (!name || !email) {
    setStatus("Please fill name and email.");
    return;
  }

  setStatus("Saving...");
  addOrUpdateUser({ id: editingUserId, name, email, password })
    .then(() => {
      setStatus("Saved.");
      resetForm();
    })
    .catch((err) => setStatus(`Error: ${String(err)}`));
});

resetBtn.addEventListener("click", () => {
  setStatus("");
  resetForm();
});

saveDefaultPasswordBtn.addEventListener("click", () => {
  setStatus("");
  const value = String(defaultPasswordEl.value || "");
  currentDefaultPassword = value || DEFAULT_PASSWORD_FALLBACK;
  setStatus("Saving...");
  setDefaultPassword(currentDefaultPassword)
    .then(() => {
      setStatus("Saved.");
      // Keep the user form in sync if it was empty.
      if (!passwordEl.value) passwordEl.value = currentDefaultPassword;
    })
    .catch((err) => setStatus(`Error: ${String(err)}`));
});

init().catch((err) => setStatus(`Error: ${String(err)}`));
