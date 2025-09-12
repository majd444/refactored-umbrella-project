"use client";
import { useSearchParams } from "next/navigation";

export default function WidgetPage() {
  const sp = useSearchParams();
  const botId = (sp.get("botId") || "").toString();
  const qpApiBase = (sp.get("apiBase") || "").toString();
  const apiBase = qpApiBase || (process.env.NEXT_PUBLIC_CONVEX_URL || "");

  return (
    <>
      <div
        id="chat-widget"
        data-agent-id={botId}
        data-api-base={apiBase}
      />
      <script src="/chat-widget.js" defer></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Auto-open on load so the iframe shows the chat immediately
            (function(){
              function openNow(){
                var launch = document.getElementById('cw-launch');
                if (launch) { launch.click(); }
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
        body { margin: 0; padding: 0; }
      `}</style>
    </>
  );
}
