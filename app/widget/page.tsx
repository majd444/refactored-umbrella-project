type SearchParams = { [key: string]: string | string[] | undefined };

export default function WidgetPage({ searchParams }: { searchParams?: SearchParams }) {
  const sp = searchParams || {};
  const botIdParam = sp.botId;
  const botId = Array.isArray(botIdParam) ? botIdParam[0] : botIdParam || "";
  const apiBaseParam = sp.apiBase;
  const qpApiBase = Array.isArray(apiBaseParam) ? apiBaseParam[0] : apiBaseParam || "";
  const apiBase = qpApiBase || process.env.NEXT_PUBLIC_CONVEX_URL || "";

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
