(() => {
  const WIDGET_ID = "chat-widget";
  const SESSION_KEY = "cw_session_v1";
  const DEFAULTS = {
    name: "AI Assistant",
    welcomeMessage: "👋 Hi there! How can I help you today?",
    headerColor: null, 
    accentColor: null, 
    backgroundColor: null, 
    profileImage: null,
  };

  // Resolve API base from the script src or data attribute
  function getApiBase() {
    const el = document.getElementById(WIDGET_ID);
    const override = el?.dataset?.apiBase?.trim();
    if (override) return override.replace(/\/+$/, "");

    // Find this script tag
    const scripts = document.getElementsByTagName("script");
    const self = [...scripts].find(s => {
      const src = s.src || "";
      return src.includes("chat-widget.js") || src.includes("widget.js");
    });
    if (!self) return "";

    // Allow explicit override on the script tag as well
    const scriptOverride = (self.dataset?.apiBase || "").trim();
    if (scriptOverride) return scriptOverride.replace(/\/+$/, "");

    try {
      const url = new URL(self.src);
      return `${url.protocol}//${url.host}`;
    } catch { 
      return ""; 
    }
  }

  const API_BASE = getApiBase();
  let elRoot = document.getElementById(WIDGET_ID);
  if (!elRoot) {
    // Legacy/inline usage: auto-create the root if a script tag provides bot id
    const scripts = document.getElementsByTagName("script");
    const self = [...scripts].find(s => {
      const src = s.src || "";
      return src.includes("chat-widget.js") || src.includes("widget.js");
    });
    const agentFromScript = self?.dataset?.botId || self?.dataset?.agentId || "";
    if (agentFromScript) {
      elRoot = document.createElement("div");
      elRoot.id = WIDGET_ID;
      elRoot.dataset.agentId = agentFromScript;
      // Propagate apiBase if provided on script tag
      if (self?.dataset?.apiBase) {
        elRoot.dataset.apiBase = self.dataset.apiBase;
      }
      document.body.appendChild(elRoot);
    }
  }
  if (!elRoot) return console.error("[chat-widget] Root div#chat-widget not found.");

  const agentId = elRoot.dataset.agentId;
  if (!agentId) return console.error("[chat-widget] data-agent-id is required.");

  // Build UI
  elRoot.innerHTML = `
    <div class="cw-panel" id="cw-panel">
      <div class="cw-header">
        <img id="cw-avatar" alt="avatar" />
        <div>
          <div class="cw-title" id="cw-title">${DEFAULTS.name}</div>
          <div class="cw-sub" id="cw-sub">${DEFAULTS.welcomeMessage}</div>
        </div>
      </div>
      <div class="cw-messages" id="cw-messages"></div>
      <div class="cw-status" id="cw-status"></div>
      <div class="cw-input">
        <textarea id="cw-input" placeholder="Type your message…"></textarea>
        <button class="cw-send" id="cw-send">Send ▸</button>
      </div>
    </div>
    <button class="cw-launcher" id="cw-launch">Chat</button>
  `;

  const panel = document.getElementById("cw-panel");
  const launch = document.getElementById("cw-launch");
  const messagesEl = document.getElementById("cw-messages");
  const statusEl = document.getElementById("cw-status");
  const inputEl = document.getElementById("cw-input");
  const sendEl = document.getElementById("cw-send");
  const titleEl = document.getElementById("cw-title");
  const subEl = document.getElementById("cw-sub");
  const avatarEl = document.getElementById("cw-avatar");

  let sessionId = null;
  let history = [];

  function setStatus(t) { 
    statusEl.textContent = t || ""; 
  }

  function bubble(role, text) {
    const b = document.createElement("div");
    b.className = "cw-bubble " + (role === "user" ? "cw-u" : "cw-a");
    b.textContent = text;
    messagesEl.appendChild(b);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function applyTheme(agent) {
    if (!agent) return;
    if (agent.name) titleEl.textContent = agent.name;
    if (agent.welcomeMessage) subEl.textContent = agent.welcomeMessage;
    if (agent.profileImage) { 
      avatarEl.src = agent.profileImage; 
      avatarEl.style.display = "block"; 
    } else { 
      avatarEl.style.display = "none"; 
    }

    if (agent.headerColor) document.documentElement.style.setProperty("--chat-header-bg", agent.headerColor);
    if (agent.accentColor) document.documentElement.style.setProperty("--chat-accent", agent.accentColor);
    if (agent.backgroundColor) document.documentElement.style.setProperty("--chat-bg", agent.backgroundColor);
  }

  function restoreSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.agentId !== agentId) return null;
      return data;
    } catch { 
      return null; 
    }
  }

  function saveSession() {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ 
      sessionId, 
      agentId, 
      history 
    }));
  }

  async function ensureSession() {
    const cached = restoreSession();
    if (cached && cached.sessionId) {
      sessionId = cached.sessionId;
      history = Array.isArray(cached.history) ? cached.history : [];
      return;
    }

    setStatus("Creating session…");
    const url = `${API_BASE}/api/chat/widget/session`;
    
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId })
      });

      if (!res.ok) {
        const t = await res.text().catch(() => res.statusText);
        throw new Error(`Session error ${res.status}: ${t}`);
      }

      const data = await res.json();
      sessionId = data.sessionId || data.id || data.session || null;
      applyTheme(data.agent || data);
      saveSession();
      setStatus("");
    } catch (error) {
      console.error("Session creation failed:", error);
      setStatus("Failed to create session. Please try again.");
      throw error;
    }
  }

  async function send() {
    const text = (inputEl.value || "").trim();
    if (!text) return;
    
    inputEl.value = "";
    bubble("user", text);
    history.push({ role: "user", content: text });
    saveSession();

    const typing = document.createElement("div");
    typing.className = "cw-bubble cw-a";
    typing.textContent = "…";
    messagesEl.appendChild(typing);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try {
      const url = `${API_BASE}/api/chat/widget/chat`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sessionId, 
          agentId, 
          message: text, 
          history 
        })
      });

      if (!res.ok) {
        const t = await res.text().catch(() => res.statusText);
        throw new Error(`HTTP ${res.status}: ${t}`);
      }

      const data = await res.json();
      typing.remove();
      const reply = data.reply || data.message || data.text || "(no reply)";
      bubble("assistant", reply);
      history.push({ role: "assistant", content: reply });
      saveSession();
      setStatus("");
    } catch (err) {
      typing.remove();
      bubble("assistant", "⚠️ " + (err?.message || "Request failed"));
      setStatus("Error. Check console.");
      console.error("[chat-widget]", err);
    }
  }

  // Toggle open/close
  launch.addEventListener("click", async () => {
    const isOpen = panel.style.display === "flex";
    panel.style.display = isOpen ? "none" : "flex";
    
    if (!isOpen) {
      try {
        await ensureSession();
        // Show welcome only once
        if (!messagesEl.dataset.welcomed) {
          bubble("assistant", subEl.textContent || DEFAULTS.welcomeMessage);
          messagesEl.dataset.welcomed = "1";
        }
      } catch (e) {
        setStatus("Failed to initialize session.");
        console.error(e);
      }
    }
  });

  // Handle send button and Enter key
  sendEl.addEventListener("click", send);
  inputEl.addEventListener("keydown", (e) => { 
    if (e.key === "Enter" && !e.shiftKey) { 
      e.preventDefault(); 
      send(); 
    } 
  });
})();
