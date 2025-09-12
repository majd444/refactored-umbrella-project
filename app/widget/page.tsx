export default function WidgetPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const botIdParam = searchParams?.botId;
  const botId = Array.isArray(botIdParam) ? botIdParam[0] : botIdParam || "";
  const apiBase = process.env.NEXT_PUBLIC_CONVEX_URL || "";

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Chat Widget</title>
        <link href="/chat-widget.css" rel="stylesheet" />
        <style>{`
          body { margin: 0; padding: 0; }
          /* Provide a neutral background for iframe usage */
          html, body { height: 100%; }
        `}</style>
      </head>
      <body>
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
      </body>
    </html>
  );
}
