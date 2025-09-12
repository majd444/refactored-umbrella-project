(function(){
  // Find current script tag
  var currentScript = document.currentScript || (function(){
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  if (!currentScript) return;

  var botId = currentScript.getAttribute('data-bot-id') || currentScript.getAttribute('data-agent-id');
  var apiBase = currentScript.getAttribute('data-api-base') || '';
  if (!botId) {
    console.error('[Widget] Missing required data-bot-id attribute on script tag');
    return;
  }

  // Derive base origin from the script src so iframe points back to same host (e.g., your Vercel app)
  function getBaseOrigin(src){
    try { return new URL(src).origin; } catch { return window.location.origin; }
  }

  var baseOrigin = getBaseOrigin(currentScript.src);

  // Create container
  var container = document.createElement('div');
  container.id = 'chatbot-widget-container';
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.width = '360px';
  container.style.maxWidth = '90vw';
  container.style.height = '520px';
  container.style.maxHeight = '80vh';
  container.style.zIndex = '2147483647';
  container.style.boxShadow = '0 10px 30px rgba(0,0,0,0.12)';
  container.style.borderRadius = '16px';
  container.style.overflow = 'hidden';
  container.style.background = 'transparent';

  // Toggle button
  var toggleBtn = document.createElement('button');
  toggleBtn.id = 'ycw-toggle';
  toggleBtn.setAttribute('aria-label', 'Open chat');
  toggleBtn.style.position = 'fixed';
  toggleBtn.style.bottom = '20px';
  toggleBtn.style.right = '20px';
  toggleBtn.style.width = '56px';
  toggleBtn.style.height = '56px';
  toggleBtn.style.borderRadius = '50%';
  toggleBtn.style.border = 'none';
  toggleBtn.style.cursor = 'pointer';
  toggleBtn.style.boxShadow = '0 8px 24px rgba(0,0,0,0.16)';
  toggleBtn.style.background = '#3B82F6';
  toggleBtn.style.color = '#fff';
  toggleBtn.style.zIndex = '2147483646';
  toggleBtn.style.display = 'flex';
  toggleBtn.style.alignItems = 'center';
  toggleBtn.style.justifyContent = 'center';
  toggleBtn.style.fontSize = '22px';
  toggleBtn.textContent = '💬';

  // Iframe
  var iframe = document.createElement('iframe');
  iframe.id = 'ycw-iframe';
  iframe.title = 'Chatbot';
  iframe.allow = 'clipboard-write;';
  iframe.referrerPolicy = 'no-referrer-when-downgrade';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = '0';
  var src = baseOrigin + '/widget?botId=' + encodeURIComponent(botId);
  if (apiBase) {
    src += '&apiBase=' + encodeURIComponent(apiBase);
  }
  iframe.src = src;

  var isOpen = false;
  function open(){
    if (isOpen) return;
    document.body.appendChild(container);
    container.appendChild(iframe);
    isOpen = true;
    toggleBtn.style.transform = 'translateY(-540px)';
    toggleBtn.setAttribute('aria-label', 'Close chat');
  }
  function close(){
    if (!isOpen) return;
    if (container.parentNode) container.parentNode.removeChild(container);
    while (container.firstChild) container.removeChild(container.firstChild);
    isOpen = false;
    toggleBtn.style.transform = 'translateY(0)';
    toggleBtn.setAttribute('aria-label', 'Open chat');
  }

  toggleBtn.addEventListener('click', function(){
    if (isOpen) {
      close();
    } else {
      open();
    }
  });

  // Listen for close events from iframe
  window.addEventListener('message', function(ev){
    if (!ev || !ev.data) return;
    if (ev.data === 'widget:close') close();
  });

  // Insert toggle button (support late injection after DOMContentLoaded)
  function insertToggle(){
    if (!document.body.contains(toggleBtn)) {
      document.body.appendChild(toggleBtn);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertToggle);
  } else {
    insertToggle();
  }
})();
