const noteEl = document.getElementById("note");
const saveBtn = document.getElementById("saveBtn");
const clearBtn = document.getElementById("clearBtn");
const statusEl = document.getElementById("status");

function setStatus(text) {
  statusEl.textContent = text;
}

async function loadNote() {
  const { note } = await chrome.storage.local.get({ note: "" });
  noteEl.value = note;
}

async function saveNote() {
  await chrome.storage.local.set({ note: noteEl.value });
  setStatus("Saved.");
}

async function clearNote() {
  await chrome.storage.local.set({ note: "" });
  noteEl.value = "";
  setStatus("Cleared.");
}

saveBtn.addEventListener("click", () => {
  setStatus("Saving...");
  saveNote().catch((e) => setStatus(`Error: ${String(e)}`));
});

clearBtn.addEventListener("click", () => {
  setStatus("Clearing...");
  clearNote().catch((e) => setStatus(`Error: ${String(e)}`));
});

loadNote().catch((e) => setStatus(`Error: ${String(e)}`));
