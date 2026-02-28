import { createMoroccanFaker } from "@elfedali/moroccan-data";

let morocco = null;

function initMoroccan() {
  if (!morocco) {
    try {
      morocco = createMoroccanFaker();
      console.log("[chrome-moroccan-data] initialized");
    } catch (err) {
      console.error("[chrome-moroccan-data] Failed to initialize:", err);
      throw err;
    }
  }
  return morocco;
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("[chrome-moroccan-data] installed");
});

function generateFakeData(fieldType, fieldName = "") {
  const normalized = (fieldName || fieldType).toLowerCase();

  // Try to guess field type from name or type attribute
  if (
    normalized.includes("email") ||
    normalized.includes("mail")
  ) {
    return morocco.internet.email();
  }
  if (
    normalized.includes("phone") ||
    normalized.includes("tel") ||
    fieldType === "tel"
  ) {
    return morocco.phone.mobile({ formatted: true });
  }
  if (
    normalized.includes("zip") ||
    normalized.includes("postal") ||
    normalized.includes("code")
  ) {
    return morocco.location.postalCode();
  }
  if (normalized.includes("city") || normalized.includes("town")) {
    return morocco.location.city();
  }
  if (normalized.includes("address") || normalized.includes("street")) {
    return morocco.location.streetAddress();
  }
  if (normalized.includes("region") || normalized.includes("state")) {
    return morocco.location.region();
  }
  if (normalized.includes("country")) {
    return "Morocco";
  }
  if (
    normalized.includes("firstname") ||
    normalized.includes("first_name")
  ) {
    return morocco.person.firstName();
  }
  if (
    normalized.includes("lastname") ||
    normalized.includes("last_name")
  ) {
    return morocco.person.lastName();
  }
  if (
    normalized.includes("fullname") ||
    normalized.includes("full_name") ||
    normalized.includes("name")
  ) {
    return morocco.person.fullName();
  }
  if (normalized.includes("username")) {
    return morocco.internet.username();
  }
  if (normalized.includes("jobTitle") || normalized.includes("job_title")) {
    return morocco.person.jobTitle();
  }
  if (normalized.includes("company")) {
    return morocco.company.name();
  }
  if (fieldType === "email") {
    return morocco.internet.email();
  }
  if (fieldType === "tel") {
    return morocco.phone.mobile({ formatted: true });
  }
  if (fieldType === "number") {
    return String(morocco.number.int({ min: 1, max: 100 }));
  }
  if (fieldType === "date") {
    return morocco.date.isoDate({ from: new Date("1980-01-01") });
  }

  // Fallback: random full name or text
  return morocco.person.fullName();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== "object") return false;

  if (message.type === "PING") {
    sendResponse({ ok: true, from: "background" });
    return true;
  }

  if (message.type === "FILL_FORM") {
    try {
      initMoroccan();
      const fields = message.fields || [];
      const filled = fields.map((field) => ({
        index: field.index,
        value: generateFakeData(field.type, field.name)
      }));
      sendResponse({ ok: true, filled });
    } catch (err) {
      sendResponse({ ok: false, error: String(err) });
    }
    return true;
  }
});
