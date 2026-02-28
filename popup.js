const tabInfoEl = document.getElementById("tabInfo");
const outputEl = document.getElementById("output");

const fillFormBtn = document.getElementById("fillFormBtn");
const pingBtn = document.getElementById("pingBtn");

const noteEl = document.getElementById("note");
const saveBtn = document.getElementById("saveBtn");
const clearBtn = document.getElementById("clearBtn");

function setOutput(value) {
  outputEl.textContent = typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function refreshTabInfo() {
  const tab = await getActiveTab();
  const title = tab?.title ?? "(no title)";
  const url = tab?.url ?? "(no url)";
  tabInfoEl.textContent = `${title}`;
  tabInfoEl.title = url;
}

async function fillForm() {
  const tab = await getActiveTab();
  if (!tab?.id) throw new Error("No active tab id");

  // First inject the content script
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["contentScript.js"]
  });

  // Then request the tab to fill the form
  const response = await chrome.tabs.sendMessage(tab.id, {
    type: "FILL_FORM_REQUEST"
  });

  setOutput(response);
}

async function pingBackground() {
  const resp = await chrome.runtime.sendMessage({ type: "PING" });
  setOutput(resp);
}

async function loadNote() {
  const { note } = await chrome.storage.local.get({ note: "" });
  noteEl.value = note;
}

async function saveNote() {
  await chrome.storage.local.set({ note: noteEl.value });
  setOutput("Saved.");
}

async function clearNote() {
  await chrome.storage.local.set({ note: "" });
  noteEl.value = "";
  setOutput("Cleared.");
}

fillFormBtn.addEventListener("click", () => {
  setOutput("Filling form...");
  fillForm().catch((e) => setOutput({ error: String(e) }));
});

pingBtn.addEventListener("click", () => {
  setOutput("Pinging...");
  pingBackground().catch((e) => setOutput({ error: String(e) }));
});

saveBtn.addEventListener("click", () => {
  saveNote().catch((e) => setOutput({ error: String(e) }));
});

clearBtn.addEventListener("click", () => {
  clearNote().catch((e) => setOutput({ error: String(e) }));
});

refreshTabInfo().catch(() => {
  tabInfoEl.textContent = "(unable to read tab)";
});

loadNote().catch(() => {
  // ignore
});
