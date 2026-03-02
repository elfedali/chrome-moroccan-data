(() => {
  function fireInputEvents(el) {
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function isUsableInput(el) {
    if (!el) return false;
    if (!(el instanceof HTMLElement)) return false;
    if (el.hidden) return false;
    if (el.hasAttribute("disabled")) return false;

    // Some sites keep inputs offscreen until focused.
    // If it's display:none/visibility:hidden, skip.
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;

    return true;
  }

  function pickFirst(selectors) {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (isUsableInput(el)) return el;
    }
    return null;
  }

  function fillValue(el, value) {
    if (!el) return false;
    el.focus?.();
    try {
      el.value = value;
    } catch {
      return false;
    }
    fireInputEvents(el);
    return true;
  }

  window.MOROCCAN_FILLER = {
    async fillForm() {
      const inputs = Array.from(
        document.querySelectorAll(
          'input[type="text"], input[type="email"], input[type="tel"], input[type="number"], input[type="date"], input:not([type]), textarea, select'
        )
      ).filter((el) => {
        // Skip hidden, disabled inputs
        if (el.hidden || el.disabled) return false;
        // Skip very small text inputs (likely not form fields)
        if (el.offsetWidth < 30 || el.offsetHeight < 20) return false;
        return true;
      });

      if (inputs.length === 0) {
        return { ok: false, error: "No form inputs found" };
      }

      // Build field metadata for background to generate data
      const fields = inputs.map((el, index) => ({
        index,
        type: el.type || "text",
        name: el.name || el.id || "",
        placeholder: el.placeholder || ""
      }));

      try {
        const response = await chrome.runtime.sendMessage({
          type: "FILL_FORM",
          fields
        });

        if (!response.ok) {
          return { ok: false, error: response.error };
        }

        // Fill the inputs with generated data
        let filled = 0;
        response.filled.forEach(({ index, value }) => {
          const input = inputs[index];
          if (input) {
            input.value = value;
            fireInputEvents(input);
            filled++;
          }
        });

        return {
          ok: true,
          filled,
          count: inputs.length,
          summary: `Filled ${filled}/${inputs.length} inputs with fake Moroccan data`
        };
      } catch (err) {
        return { ok: false, error: String(err) };
      }
    }
  };

  window.MOROCCAN_FILLER.fillCredentials = async ({ email, password }) => {
    const emailSelectors = [
      'input[type="email"]',
      'input[autocomplete="email"]',
      'input[autocomplete="username"]',
      'input[name*="email" i]',
      'input[id*="email" i]',
      'input[placeholder*="email" i]',
      'input[name*="user" i]',
      'input[id*="user" i]',
      'input[name*="login" i]',
      'input[id*="login" i]'
    ];

    const passwordSelectors = [
      'input[type="password"]',
      'input[autocomplete="current-password"]',
      'input[name*="pass" i]',
      'input[id*="pass" i]'
    ];

    const emailEl = pickFirst(emailSelectors);
    const passwordEl = pickFirst(passwordSelectors);

    const didEmail = email ? fillValue(emailEl, email) : false;
    const didPassword = password ? fillValue(passwordEl, password) : false;

    if (!didEmail && !didPassword) {
      return {
        ok: false,
        error: "Could not find email/password inputs on this page",
        found: {
          email: Boolean(emailEl),
          password: Boolean(passwordEl)
        }
      };
    }

    return {
      ok: true,
      filled: {
        email: didEmail,
        password: didPassword
      }
    };
  };

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "FILL_FORM_REQUEST") {
      window.MOROCCAN_FILLER.fillForm()
        .then((result) => sendResponse(result))
        .catch((err) => sendResponse({ ok: false, error: String(err) }));
      return true; // indicate we'll send a response asynchronously
    }

    if (message.type === "FILL_CREDENTIALS_REQUEST") {
      const { email, password } = message.payload || {};
      window.MOROCCAN_FILLER.fillCredentials({ email, password })
        .then((result) => sendResponse(result))
        .catch((err) => sendResponse({ ok: false, error: String(err) }));
      return true;
    }
  });

  return window.MOROCCAN_FILLER;
})();
