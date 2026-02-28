(() => {
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
            input.dispatchEvent(new Event("change", { bubbles: true }));
            input.dispatchEvent(new Event("input", { bubbles: true }));
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

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "FILL_FORM_REQUEST") {
      window.MOROCCAN_FILLER.fillForm()
        .then((result) => sendResponse(result))
        .catch((err) => sendResponse({ ok: false, error: String(err) }));
      return true; // indicate we'll send a response asynchronously
    }
  });

  return window.MOROCCAN_FILLER;
})();
