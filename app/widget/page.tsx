"use client";
import { useSearchParams } from "next/navigation";

export default function WidgetPage() {
  const sp = useSearchParams();
  const botId = (sp.get("botId") || "").toString();
  const qpApiBase = (sp.get("apiBase") || "").toString();
  const apiBase = qpApiBase || (process.env.NEXT_PUBLIC_CONVEX_URL || "");

  return (
    <>
      <div id="chat-widget" data-agent-id={botId} data-api-base={apiBase}>
        <div className="cw-panel" id="cw-panel" style={{ display: 'flex', flexDirection: 'column', background: '#fff' }}>
          <div className="cw-header">
            <img id="cw-avatar" alt="avatar" style={{ display: 'none' }} />
            <div>
              <div className="cw-title" id="cw-title">AI Assistant</div>
              <div className="cw-sub" id="cw-sub">Loading…</div>
            </div>
          </div>
          <div className="cw-messages" id="cw-messages">
            <div className="cw-bubble cw-a">👋 Hi there! How can I help you today?</div>
          </div>
          <div className="cw-status" id="cw-status"></div>
          <div className="cw-input">
            <textarea id="cw-input" placeholder="Type your message…"></textarea>
            <button className="cw-send" id="cw-send">Send ▸</button>
          </div>
        </div>
        <button className="cw-launcher" id="cw-launch" style={{ display: 'none' }}>Chat</button>
      </div>
      <script src="/chat-widget.js" defer></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function(){
              try {
                var existing = document.querySelector('link[data-cw-css]');
                if (!existing) {
                  var link = document.createElement('link');
                  link.setAttribute('data-cw-css','1');
                  link.rel = 'stylesheet';
                  link.href = '/chat-widget.css';
                  document.head.appendChild(link);
                }
              } catch {}
            })();
          `,
        }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Auto-open on load so the iframe shows the chat immediately
            (function(){
              function openNow(){
                var tries = 0;
                var tm = setInterval(function(){
                  tries++;
                  var launch = document.getElementById('cw-launch');
                  if (launch) {
                    try { launch.click(); } catch(e) {}
                    clearInterval(tm);
                  }
                  if (tries > 50) { // ~5s max
                    clearInterval(tm);
                  }
                }, 100);
              }
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', openNow);
              } else {
                openNow();
              }

              // Accept messages from parent to send into chat
              try {
                window.addEventListener('message', function(ev){
                  if (!ev || !ev.data) return;
                  var d = ev.data;
                  if (d && d.type === 'widget:send' && typeof d.text === 'string') {
                    if (typeof window.__cw_send === 'function') {
                      window.__cw_send(d.text);
                    }
                  }
                });
              } catch {}
            })();
          `,
        }}
      />
      <style>{`
        /* Ensure no outer margins inside iframe */
        html, body { height: 100%; }
        body { margin: 0; padding: 0; background: #f8fafc; }
        /* Inside the iframe, don't fix the widget to the window */
        #chat-widget { position: static !important; inset: auto !important; }
        /* Critical styles to ensure visibility even without external CSS */
        #chat-widget .cw-panel {
          width: 100%;
          height: 100%;
          max-width: none;
          max-height: none;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          background: #fff;
          color: #111827;
          box-sizing: border-box;
          min-width: 280px;
          min-height: 320px;
        }
        #chat-widget .cw-header {
          background: #3B82F6;
          color: #fff;
          height: 56px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 12px;
          box-sizing: border-box;
        }
        #chat-widget .cw-messages {
          flex: 1;
          overflow: auto;
          padding: 12px;
          box-sizing: border-box;
        }
        #chat-widget .cw-status {
          font-size: 12px;
          color: #6b7280;
          padding: 6px 12px;
          box-sizing: border-box;
        }
        #chat-widget .cw-input {
          height: 64px;
          display: flex;
          gap: 8px;
          padding: 8px;
          border-top: 1px solid #e5e7eb;
          box-sizing: border-box;
        }
        #chat-widget textarea#cw-input {
          flex: 1;
          resize: none;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 10px;
          font: inherit;
          color: inherit;
          background: #fff;
          outline: none;
          box-sizing: border-box;
        }
        #chat-widget .cw-send {
          background: #00D4FF;
          color: #002;
          border: none;
          border-radius: 12px;
          padding: 0 14px;
          font-weight: 700;
          cursor: pointer;
        }
      `}</style>
    </>
  );
}
