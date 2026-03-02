const usersEl = document.getElementById("users");
const outputEl = document.getElementById("output");

const fillFakeBtn = document.getElementById("fillFakeBtn");
const openOptionsBtn = document.getElementById("openOptionsBtn");

const USERS_KEY = "savedUsers";

function setOutput(value) {
  outputEl.textContent = typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function getUsers() {
  const { [USERS_KEY]: savedUsers } = await chrome.storage.local.get({
    [USERS_KEY]: []
  });
  return Array.isArray(savedUsers) ? savedUsers : [];
}

function renderUsers(users) {
  usersEl.innerHTML = "";

  if (!users.length) {
    const empty = document.createElement("div");
    empty.className = "text-xs text-slate-600";
    empty.textContent = "No users saved. Add them in the Options page.";
    usersEl.appendChild(empty);
    return;
  }

  for (const user of users) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:bg-slate-50";

    const name = document.createElement("div");
    name.className = "text-xs font-semibold text-slate-900";
    name.textContent = user.name;

    const email = document.createElement("div");
    email.className = "mt-0.5 text-[11px] text-slate-600 truncate";
    email.textContent = user.email;

    btn.appendChild(name);
    btn.appendChild(email);

    btn.addEventListener("click", () => {
      setOutput(`Filling credentials for: ${user.name}...`);
      fillCredentialsOnActiveTab(user).catch((e) => setOutput({ error: String(e) }));
    });

    usersEl.appendChild(btn);
  }
}

async function fillCredentialsOnActiveTab(user) {
  const tab = await getActiveTab();
  if (!tab?.id) throw new Error("No active tab id");

  await chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: true },
    files: ["contentScript.js"]
  });

  const response = await chrome.tabs.sendMessage(tab.id, {
    type: "FILL_CREDENTIALS_REQUEST",
    payload: {
      email: user.email,
      password: user.password
    }
  });

  setOutput(response);
}

async function fillFakeDataOnActiveTab() {
  const tab = await getActiveTab();
  if (!tab?.id) throw new Error("No active tab id");

  await chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: true },
    files: ["contentScript.js"]
  });

  const response = await chrome.tabs.sendMessage(tab.id, {
    type: "FILL_FORM_REQUEST"
  });

  setOutput(response);
}

fillFakeBtn.addEventListener("click", () => {
  setOutput("Filling form with fake data...");
  fillFakeDataOnActiveTab().catch((e) => setOutput({ error: String(e) }));
});

openOptionsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

getUsers()
  .then((users) => renderUsers(users))
  .catch((e) => setOutput({ error: String(e) }));
