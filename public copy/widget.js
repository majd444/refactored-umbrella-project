(() => {
  const currentScript = document.currentScript;
  if (!currentScript) return;

  // Required: the bot identifier (maps to agents.userId by default)
  const botId = currentScript.getAttribute("data-bot-id");
  if (!botId) {
    console.error("[Chat Widget] Missing data-bot-id");
    return;
  }

  // Optional: allow configuring URLs from the script tag for easy deploys
  // Example:
  // <script src="/widget.js"
  //         data-bot-id="USER1234"
  //         data-convex-url="https://your-convex.convex.cloud"
  //         data-backend-url="https://your-backend.com/api/chat"></script>
  const CONVEX_URL = currentScript.getAttribute("data-convex-url") || "";
  const BACKEND_CHAT_URL = currentScript.getAttribute("data-backend-url") || "https://your-backend.com/api/chat";
  // Optional: enforce required fields in pre-chat form (default: false)
  const ENFORCE_REQUIRED = currentScript.getAttribute("data-enforce-required") === "true";
  // Optional: enable showing the pre-chat form (default: false)
  const ENABLE_PRECHAT = currentScript.getAttribute("data-enable-prechat") === "true";

  // Prevent duplicate insertion
  if (document.getElementById("chat-widget-container") || document.getElementById("chat-widget-toggle")) return;

  const STORAGE_KEY = `chatWidget:user:${botId}`;

  function getStoredUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setStoredUser(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }

  async function fetchAgentConfig(botId) {
    try {
      const endpoint = CONVEX_URL
        ? `${CONVEX_URL.replace(/\/$/, "")}/getAgent?botId=${encodeURIComponent(botId)}`
        : `/api/getAgent?botId=${encodeURIComponent(botId)}`;
      const res = await fetch(endpoint, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`Failed to fetch agent config (${res.status})`);
      return await res.json();
    } catch (err) {
      console.error("[Chat Widget] Error loading agent:", err);
      return null;
    }
  }

  function injectStyleFromAgent(agent) {
    const style = document.createElement("style");
    style.textContent = `
      #chat-widget-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 480px;
        height: 75vh; /* make much taller on desktop */
        background: ${agent.backgroundColor || "#fff"};
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        z-index: 999999;
      }
      #chat-widget-header {
        background: ${agent.headerColor || "#2563eb"};
        color: white;
        padding: 18px;
        font-size: 22px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      #chat-widget-header .title {
        display: flex; align-items: center; gap: 8px;
      }
      #chat-widget-header img {
        width: 24px; height: 24px; border-radius: 50%; object-fit: cover;
      }
      #chat-widget-body {
        display: flex;
        flex-direction: column;
        flex: 1; /* fill remaining space below header */
        min-height: 0; /* allow #chat-widget-messages to scroll */
      }
      #chat-widget-messages {
        flex: 1;
        padding: 18px;
        overflow-y: auto;
        font-size: 19px;
        line-height: 1.65;
        background: ${agent.backgroundColor || "#fff"};
      }
      #chat-widget-input {
        display: flex;
        border-top: 1px solid #e5e7eb;
        background: #fff;
      }
      #chat-widget-input input {
        flex: 1;
        padding: 18px 16px;
        border: none;
        outline: none;
        font-size: 19px;
      }
      #chat-widget-input button {
        background: ${agent.accentColor || "#2563eb"};
        color: white;
        border: none;
        padding: 16px 22px;
        cursor: pointer;
        font-weight: 700;
        font-size: 19px;
      }
      #chat-widget-toggle {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${agent.accentColor || "#2563eb"};
        color: white;
        border-radius: 50%;
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 999998;
        font-size: 28px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      }
      
      /* Mobile responsive adjustments */
      @media (max-width: 640px) {
        #chat-widget-container {
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 95vh; /* taller on small screens */
          max-height: none;
          border-radius: 16px 16px 0 0; /* top-rounded corners */
        }
        #chat-widget-toggle {
          width: 60px;
          height: 60px;
          bottom: 20px;
          right: 20px;
        }
      }
      /* Form styles */
      #chat-widget-form {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        overflow-y: auto;
        max-height: 440px;
        background: #fff;
      }
      #chat-widget-form .field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      #chat-widget-form label {
        font-size: 12px;
        color: #374151;
      }
      #chat-widget-form input, #chat-widget-form textarea, #chat-widget-form select {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 10px;
        font-size: 14px;
        outline: none;
      }
      #chat-widget-form .error {
        color: #b91c1c;
        font-size: 12px;
      }
      #chat-widget-form button[type="submit"] {
        background: ${agent.accentColor || "#2563eb"};
        color: white;
        border: none;
        padding: 10px 16px;
        cursor: pointer;
        font-weight: 600;
        border-radius: 10px;
      }
      #chat-widget-footer-note {
        font-size: 11px;
        color: #6b7280;
        padding: 0 12px 12px;
        background: #fff;
      }
    `;
    document.head.appendChild(style);
  }

  function buildToggle() {
    const toggle = document.createElement("div");
    toggle.id = "chat-widget-toggle";
    toggle.textContent = "💬";
    document.body.appendChild(toggle);
    return toggle;
  }

  function buildContainer(agent) {
    const container = document.createElement("div");
    container.id = "chat-widget-container";
    container.style.display = "none";
    container.innerHTML = `
      <div id="chat-widget-header">
        <div class="title">
          ${agent.profileImage ? `<img src="${agent.profileImage}" alt="bot" />` : ""}
          <span>${agent.name || "AI Assistant"}</span>
        </div>
        <span style="cursor:pointer" id="chat-widget-close" aria-label="Close">✖</span>
      </div>
      <div id="chat-widget-body"></div>
    `;
    document.body.appendChild(container);
    return container;
  }

  function renderPreChatForm(container, agent, storedUser, onComplete) {
    const body = container.querySelector("#chat-widget-body");
    const defaults = storedUser || {};
    const fields = Array.isArray(agent.formFields) ? agent.formFields : [];

    const formEl = document.createElement("form");
    formEl.id = "chat-widget-form";

    // Build fields
    fields.forEach((f) => {
      const wrapper = document.createElement("div");
      wrapper.className = "field";

      const label = document.createElement("label");
      label.setAttribute("for", `field-${f.id}`);
      label.textContent = `${f.label}${(ENFORCE_REQUIRED && f.required) ? " *" : ""}`;

      const type = (f.type || "text").toLowerCase();
      let input;
      if (type === "textarea") {
        input = document.createElement("textarea");
        input.rows = 3;
      } else if (type === "select" && Array.isArray(f.options)) {
        input = document.createElement("select");
        // Optional: include a placeholder option
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = `Select ${f.label}`;
        input.appendChild(placeholder);
        f.options.forEach((opt) => {
          const o = document.createElement("option");
          o.value = String(opt.value ?? opt);
          o.textContent = String(opt.label ?? opt);
          input.appendChild(o);
        });
      } else {
        input = document.createElement("input");
        input.type = ["email", "tel", "text"].includes(type) ? type : "text";
      }

      input.id = `field-${f.id}`;
      input.name = f.id;
      if (input.tagName !== "SELECT") input.placeholder = f.label;
      input.required = ENFORCE_REQUIRED ? !!f.required : false;
      const defaultVal = defaults[f.id] ?? f.value ?? "";
      if (input.tagName === "SELECT") {
        input.value = String(defaultVal);
      } else {
        input.value = String(defaultVal);
      }

      wrapper.appendChild(label);
      wrapper.appendChild(input);
      formEl.appendChild(wrapper);
    });

    const errorDiv = document.createElement("div");
    errorDiv.className = "error";
    errorDiv.style.display = "none";
    formEl.appendChild(errorDiv);

    const submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.textContent = "Start Chat";
    formEl.appendChild(submitBtn);

    const note = document.createElement("div");
    note.id = "chat-widget-footer-note";
    note.textContent = "Your details are used to personalize your chat experience.";

    body.innerHTML = "";
    body.appendChild(formEl);
    body.appendChild(note);

    formEl.addEventListener("submit", (e) => {
      e.preventDefault();
      errorDiv.style.display = "none";
      errorDiv.textContent = "";

      const data = {};
      let hasError = false;

      fields.forEach((f) => {
        const el = formEl.querySelector(`#field-${f.id}`);
        if (!el) return;
        const val = (el.value || "").trim();

        if (ENFORCE_REQUIRED && f.required && !val) {
          hasError = true;
          errorDiv.textContent = "Please complete all required fields.";
        }

        if (!hasError && f.type === "email" && val) {
          const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
          if (!emailOk) {
            hasError = true;
            errorDiv.textContent = "Please enter a valid email address.";
          }
        }

        data[f.id] = val;
      });

      if (hasError) {
        errorDiv.style.display = "block";
        return;
      }

      setStoredUser(data);
      onComplete();
    });
  }

  function renderChatUI(container, agent) {
    const body = container.querySelector("#chat-widget-body");
    body.innerHTML = `
      <div id="chat-widget-messages">
        <div><b>Bot:</b> ${agent.welcomeMessage || "👋 Hi! How can I help you today?"}</div>
      </div>
      <div id="chat-widget-input">
        <input type="text" placeholder="Type your message..." />
        <button>Send</button>
      </div>
    `;

    const messages = body.querySelector("#chat-widget-messages");
    const input = body.querySelector("input");
    const sendBtn = body.querySelector("button");

    function addMessage(sender, text) {
      const div = document.createElement("div");
      div.innerHTML = `<b>${sender}:</b> ${text}`;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    sendBtn.addEventListener("click", async () => {
      const value = input.value.trim();
      if (!value) return;
      addMessage("You", value);
      input.value = "";

      const userInfo = getStoredUser();

      try {
        const res = await fetch(BACKEND_CHAT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            botId: agent.userId, // or agent._id if you later switch identifiers
            message: value,
            user: userInfo || {},
          }),
        });

        const data = await res.json().catch(() => ({}));
        addMessage("Bot", data.reply || "Sorry, I didn’t understand that.");
      } catch (err) {
        addMessage("Bot", "⚠️ Error contacting server");
      }
    });

    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendBtn.click();
    });
  }

  // Bootstrap
  (async () => {
    // Loading toggle
    const loadingToggle = document.createElement("div");
    loadingToggle.id = "chat-widget-toggle";
    loadingToggle.textContent = "…";
    document.body.appendChild(loadingToggle);

    const agent = await fetchAgentConfig(botId);
    if (!agent) {
      loadingToggle.textContent = "⚠️";
      loadingToggle.title = "Failed to load chat widget";
      return;
    }

    loadingToggle.remove();
    injectStyleFromAgent(agent);
    const toggle = buildToggle();
    const container = buildContainer(agent);

    const closeBtn = container.querySelector("#chat-widget-close");
    toggle.addEventListener("click", () => {
      container.style.display = "flex";
      toggle.style.display = "none";

      const storedUser = getStoredUser();
      const hasFields = Array.isArray(agent.formFields) && agent.formFields.length > 0;
      if (ENABLE_PRECHAT && agent.collectUserInfo && hasFields && (!storedUser || Object.keys(storedUser).length === 0)) {
        // Show pre-chat form first
        renderPreChatForm(container, agent, storedUser, () => renderChatUI(container, agent));
      } else {
        renderChatUI(container, agent);
      }
    });

    closeBtn.addEventListener("click", () => {
      container.style.display = "none";
      toggle.style.display = "flex";
    });
  })();
})();
