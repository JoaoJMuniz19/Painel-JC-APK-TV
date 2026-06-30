/* JC-APK TV — Acesse Aqui 13A
   Histórico detalhado, escolha ADM/cliente e limite diário por cliente.
   Não usa IP e não altera a regra dos vencidos há 3 dias. */
(function () {
  "use strict";

  const A = window.JC_APP;
  let busy = false;
  let captureBound = false;
  let pickerResolver = null;
  let pickerTimer = 0;

  function app() {
    if (!A?.client) throw new Error("A conexão com o Supabase ainda não foi preparada.");
    return A;
  }

  function currentMode() {
    const contextMode = String(window.JC_GENERATOR_CONTEXT?.mode || "").toLowerCase();
    if (contextMode) return contextMode;
    try {
      const stored = String(sessionStorage.getItem("jc_apk_tipo_usuario") || "").toLowerCase();
      return stored === "teste" ? "test" : stored;
    } catch (_) {
      return "";
    }
  }

  function isAdminMode() {
    return currentMode() === "admin" || window.JC_GENERATOR_CONTEXT?.profile?.role === "admin";
  }

  function isTestMode() {
    return currentMode() === "test" || currentMode() === "teste";
  }

  function randomId() {
    return window.crypto?.randomUUID?.()
      || (Date.now().toString(36) + Math.random().toString(36).slice(2));
  }

  function deviceKey() {
    const storageKey = "jc_apk_config_device_key";
    try {
      let value = localStorage.getItem(storageKey);
      if (!value) {
        value = "web-" + randomId();
        localStorage.setItem(storageKey, value);
      }
      return value;
    } catch (_) {
      return "web-session-" + randomId();
    }
  }

  function requestKey() {
    return "acesso-aqui-" + randomId();
  }

  async function invoke(body) {
    const result = await app().client.functions.invoke("jc-download", { body });
    if (result.error) {
      let message = result.error?.message || "A função jc-download recusou a solicitação.";
      try {
        const context = result.error?.context;
        if (context && typeof context.json === "function") {
          const payload = await context.clone().json();
          message = payload?.error || message;
        } else if (context?.json?.error) message = context.json.error;
      } catch (_) {}
      throw new Error(message);
    }
    if (!result.data || result.data.ok !== true) {
      throw new Error(result.data?.error || "Não foi possível preparar o arquivo.");
    }
    return result.data;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[char]));
  }

  function browserInfo() {
    const ua = String(navigator.userAgent || "");
    let platform = "Dispositivo";
    let browser = "Navegador";

    if (/iPhone/i.test(ua)) platform = "iPhone";
    else if (/iPad/i.test(ua)) platform = "iPad";
    else if (/Android/i.test(ua)) {
      const model = ua.match(/Android[^;]*;\s*([^;)]+?)(?:\s+Build\/|;|\))/i)?.[1]?.trim();
      platform = model && !/^(wv|en-us|pt-br)$/i.test(model) ? `Android — ${model}` : "Celular/Tablet Android";
    } else if (/Windows/i.test(ua)) platform = "PC Windows";
    else if (/Macintosh|Mac OS X/i.test(ua)) platform = "Mac";
    else if (/CrOS/i.test(ua)) platform = "Chromebook";
    else if (/Linux/i.test(ua)) platform = "PC Linux";

    if (/Edg\//i.test(ua)) browser = "Microsoft Edge";
    else if (/SamsungBrowser\//i.test(ua)) browser = "Samsung Internet";
    else if (/OPR\//i.test(ua)) browser = "Opera";
    else if (/CriOS\//i.test(ua)) browser = "Chrome";
    else if (/FxiOS\//i.test(ua)) browser = "Firefox";
    else if (/Firefox\//i.test(ua)) browser = "Firefox";
    else if (/Chrome\//i.test(ua)) browser = "Chrome";
    else if (/Safari\//i.test(ua)) browser = "Safari";

    return {
      device_label: `${platform} / ${browser}`,
      platform_label: platform,
      browser_label: browser,
      user_agent: ua.slice(0, 1000),
    };
  }

  function closeDestinationPicker(value) {
    const modal = document.getElementById("jc_config_destination_picker");
    if (modal) modal.classList.remove("show");
    const resolver = pickerResolver;
    pickerResolver = null;
    if (typeof resolver === "function") resolver(value || null);
  }

  function ensureDestinationPicker() {
    let modal = document.getElementById("jc_config_destination_picker");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "jc_config_destination_picker";
    modal.innerHTML = `
      <div class="jc-config-destination-box" role="dialog" aria-modal="true" aria-labelledby="jc_config_destination_title">
        <div class="jc-config-destination-head">
          <div>
            <h3 id="jc_config_destination_title">Como deseja baixar?</h3>
            <p>Como ADM não contabiliza. Para cliente, o download entra no limite diário dele.</p>
          </div>
          <button type="button" id="jc_config_destination_close" aria-label="Fechar">×</button>
        </div>
        <button type="button" id="jc_config_download_as_admin" class="jc-config-admin-choice">
          <strong>🛡️ Baixar como ADM</strong>
          <span>Não contabiliza para cliente e não consome a CONFIG.</span>
        </button>
        <div class="jc-config-divider"><span>ou baixar para um cliente</span></div>
        <input id="jc_config_client_search" type="search" autocomplete="off" placeholder="Pesquisar nome, usuário, e-mail ou WhatsApp">
        <div id="jc_config_client_results" class="jc-config-client-results">
          <div class="jc-config-picker-message">Digite pelo menos 2 caracteres para pesquisar.</div>
        </div>
      </div>`;
    document.body.appendChild(modal);

    const style = document.createElement("style");
    style.id = "jc_config_destination_styles";
    style.textContent = `
      #jc_config_destination_picker{position:fixed;inset:0;z-index:2147483647;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.80);backdrop-filter:blur(8px)}
      #jc_config_destination_picker.show{display:flex}.jc-config-destination-box{width:min(680px,96vw);max-height:88vh;overflow:auto;box-sizing:border-box;padding:20px;border-radius:24px;border:1px solid rgba(67,177,255,.38);background:linear-gradient(145deg,#071522,#02070d);box-shadow:0 28px 90px rgba(0,0,0,.68);color:#fff;font-family:Arial,sans-serif}
      .jc-config-destination-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.jc-config-destination-head h3{margin:0;font-size:23px}.jc-config-destination-head p{margin:6px 0 0;color:#9db2bd;line-height:1.45}.jc-config-destination-head>button{width:42px;height:42px;border:0;border-radius:12px;background:rgba(255,255,255,.1);color:#fff;font-size:24px;cursor:pointer}
      .jc-config-admin-choice{display:flex;flex-direction:column;align-items:flex-start;gap:5px;width:100%;margin-top:18px;padding:15px;border-radius:15px;border:1px solid rgba(54,225,141,.62);background:linear-gradient(135deg,rgba(18,125,74,.52),rgba(13,74,117,.46));color:#fff;text-align:left;cursor:pointer}.jc-config-admin-choice:hover{background:linear-gradient(135deg,rgba(24,159,92,.65),rgba(20,99,151,.58))}.jc-config-admin-choice strong{font-size:16px}.jc-config-admin-choice span{font-size:12px;color:#c9ffe1}
      .jc-config-divider{display:flex;align-items:center;gap:10px;margin:17px 0 12px;color:#8297a4;font-size:12px}.jc-config-divider:before,.jc-config-divider:after{content:"";height:1px;flex:1;background:rgba(255,255,255,.12)}
      #jc_config_client_search{width:100%;box-sizing:border-box;padding:13px 14px;border-radius:13px;border:1px solid rgba(255,255,255,.16);background:#07101b;color:#fff;font-size:15px}.jc-config-client-results{display:grid;gap:9px;margin-top:12px}.jc-config-client-option{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:13px 14px;border-radius:14px;border:1px solid rgba(62,175,255,.28);background:rgba(21,83,153,.34);color:#fff;text-align:left;cursor:pointer}.jc-config-client-option:hover{background:rgba(31,111,205,.52)}.jc-config-client-option strong,.jc-config-client-option span,.jc-config-client-option small{display:block}.jc-config-client-option strong{font-size:15px}.jc-config-client-option span{margin-top:3px;font-size:12px;color:#a9bdc9}.jc-config-client-option small{white-space:nowrap;padding:6px 8px;border-radius:9px;background:rgba(0,0,0,.25);color:#d8efff}.jc-config-picker-message{padding:18px;text-align:center;color:#9db2bd;font-size:13px}`;
    document.head.appendChild(style);

    document.getElementById("jc_config_destination_close").onclick = () => closeDestinationPicker(null);
    document.getElementById("jc_config_download_as_admin").onclick = () => closeDestinationPicker({
      download_mode: "admin",
      target_client_id: null,
      target_name: "ADM",
    });
    modal.onclick = (event) => { if (event.target === modal) closeDestinationPicker(null); };

    const search = document.getElementById("jc_config_client_search");
    search.addEventListener("input", () => {
      clearTimeout(pickerTimer);
      pickerTimer = window.setTimeout(() => searchClients(search.value), 300);
    });
    search.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        clearTimeout(pickerTimer);
        searchClients(search.value);
      }
    });
    return modal;
  }

  async function searchClients(term) {
    const results = document.getElementById("jc_config_client_results");
    const query = String(term || "").trim();
    if (!results) return;
    if (query.length < 2) {
      results.innerHTML = '<div class="jc-config-picker-message">Digite pelo menos 2 caracteres para pesquisar.</div>';
      return;
    }
    results.innerHTML = '<div class="jc-config-picker-message">Pesquisando clientes...</div>';
    try {
      const data = await invoke({ action: "admin_search_clients", search: query });
      const clients = data.clients || [];
      results.innerHTML = clients.length ? clients.map((client) => {
        const usage = client.unlimited
          ? "Sem limite"
          : `${Number(client.used_today || 0)} de ${Number(client.effective_limit || 20)} hoje`;
        return `<button type="button" class="jc-config-client-option" data-client-id="${escapeHtml(client.id)}" data-client-name="${escapeHtml(client.display_name || client.full_name || client.username || "Cliente")}">
          <div><strong>${escapeHtml(client.display_name || client.full_name || client.username || "Cliente")}</strong><span>@${escapeHtml(client.username || "")} · ${escapeHtml(client.email || client.whatsapp || "")}</span></div><small>${escapeHtml(usage)}</small>
        </button>`;
      }).join("") : '<div class="jc-config-picker-message">Nenhum cliente ativo encontrado.</div>';
      results.querySelectorAll("[data-client-id]").forEach((button) => {
        button.onclick = () => closeDestinationPicker({
          download_mode: "client",
          target_client_id: button.dataset.clientId,
          target_name: button.dataset.clientName || "Cliente",
        });
      });
    } catch (error) {
      results.innerHTML = `<div class="jc-config-picker-message">${escapeHtml(error?.message || "Não foi possível pesquisar.")}</div>`;
    }
  }

  async function chooseDestination() {
    if (!isAdminMode()) {
      return { download_mode: "client", target_client_id: null, target_name: "Minha conta" };
    }
    const modal = ensureDestinationPicker();
    document.getElementById("jc_config_client_search").value = "";
    document.getElementById("jc_config_client_results").innerHTML = '<div class="jc-config-picker-message">Digite pelo menos 2 caracteres para pesquisar.</div>';
    modal.classList.add("show");
    window.setTimeout(() => document.getElementById("jc_config_client_search")?.focus(), 80);
    return await new Promise((resolve) => { pickerResolver = resolve; });
  }

  function buttonTitle(button) {
    return button?.querySelector?.(".btn-title") || null;
  }

  function setButtonBusy(button, value) {
    if (!button) return;
    button.disabled = value;
    button.setAttribute("aria-busy", value ? "true" : "false");
    const title = buttonTitle(button);
    if (value) {
      button.dataset.jcOriginalTitle = title?.textContent || button.textContent?.trim() || "Acesse Aqui";
      if (title) title.textContent = "Preparando .config...";
      button.classList.add("is-loading");
    } else {
      if (title && button.dataset.jcOriginalTitle) title.textContent = button.dataset.jcOriginalTitle;
      button.classList.remove("is-loading");
    }
  }

  function saveBlob(blob) {
    const payload = typeof File === "function"
      ? new File([blob], ".config", { type: "application/octet-stream", lastModified: Date.now() })
      : new Blob([blob], { type: "application/octet-stream" });
    const url = URL.createObjectURL(payload);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", ".config");
    link.download = ".config";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function report(detail) {
    document.dispatchEvent(new CustomEvent("jc:report-action", { detail }));
  }

  function demoDownload() {
    if (typeof window.jcDemoAbrirArquivoFake === "function") {
      window.jcDemoAbrirArquivoFake("btn_config_pack");
      return false;
    }
    app().toast?.("Modo teste: download real bloqueado.", "error");
    return false;
  }

  function usageMessage(confirmation, destination) {
    if (confirmation?.admin_test || destination?.download_mode === "admin") {
      return "Download como ADM concluído sem contabilizar e sem consumir a CONFIG.";
    }
    if (confirmation?.unlimited) return `Arquivo .config baixado para ${destination?.target_name || "o cliente"}. Cliente sem limite diário.`;
    const used = Number(confirmation?.used_today || 0);
    const limit = Number(confirmation?.effective_limit || 20);
    return `Arquivo .config baixado para ${destination?.target_name || "o cliente"}. Uso hoje: ${used} de ${limit}.`;
  }

  async function realDownload(button) {
    if (busy) return false;
    if (isTestMode()) return demoDownload();

    busy = true;
    setButtonBusy(button, true);
    let historyId = "";
    let destination = null;

    try {
      const sessionResult = await app().client.auth.getSession();
      if (!sessionResult.data?.session) throw new Error("Entre no painel antes de baixar o arquivo.");

      destination = await chooseDestination();
      if (!destination) return false;

      const device = browserInfo();
      const reserved = await invoke({
        action: "reserve",
        request_key: requestKey(),
        device_key: deviceKey(),
        channel: "acesso_aqui",
        download_mode: destination.download_mode,
        target_client_id: destination.target_client_id,
        ...device,
      });
      historyId = reserved.history_id || "";

      if (!reserved.signed_url) throw new Error("O Supabase não retornou o link temporário da CONFIG.");
      const response = await fetch(reserved.signed_url, { cache: "no-store" });
      if (!response.ok) throw new Error("O arquivo privado não pôde ser baixado. Código " + response.status + ".");
      const blob = await response.blob();
      if (!blob || blob.size < 1) throw new Error("O arquivo recebido está vazio.");

      const confirmation = await invoke({ action: "confirm", history_id: historyId });
      saveBlob(blob);

      report({
        function_id: "config.access",
        function_name: "Acesse aqui (.config)",
        category: "CONFIG",
        item_label: "CONFIG " + String(reserved.config_no || "").padStart(3, "0") + " — V" + String(reserved.version_no || 1),
        status: "delivered",
        operation_id: randomId(),
        config_no: reserved.config_no || null,
        version_no: reserved.version_no || null,
        metadata: {
          admin_test: Boolean(reserved.admin_test),
          download_mode: destination.download_mode,
          target_client_id: destination.target_client_id || null,
          device_label: device.device_label,
          source: "jc-download",
        },
      });

      app().toast?.(usageMessage(confirmation, destination));
      return false;
    } catch (error) {
      if (historyId) {
        try {
          await invoke({
            action: "cancel",
            history_id: historyId,
            failed: true,
            error_message: String(error?.message || error || "Falha desconhecida"),
          });
        } catch (_) {
          // A falha original continua sendo a mensagem principal.
        }
      }
      console.error("JC-APK CONFIG:", error);
      report({
        function_id: "config.access",
        function_name: "Acesse aqui (.config)",
        category: "CONFIG",
        status: "failed",
        operation_id: randomId(),
        metadata: {
          message: String(error?.message || error || "Falha desconhecida"),
          download_mode: destination?.download_mode || null,
          target_client_id: destination?.target_client_id || null,
          source: "jc-download",
        },
      });
      app().toast?.(error?.message || "Não foi possível baixar o arquivo .config.", "error");
      return false;
    } finally {
      busy = false;
      setButtonBusy(button, false);
    }
  }

  function canTakeClick(button) {
    if (!button) return false;
    if (button.classList.contains("jc-function-locked")) return false;
    if (button.classList.contains("jc-panel-maintenance")) return false;
    if (button.getAttribute("aria-disabled") === "true") return false;
    if (window.JC_PANEL_RUNTIME?.isMaintenance?.("config.access")) return false;
    return true;
  }

  function bindCapture() {
    if (captureBound) return;
    captureBound = true;

    document.addEventListener("click", (event) => {
      const button = event.target?.closest?.("#btn_config_pack,[data-jc-function-id='config.access']");
      if (!button || !canTakeClick(button)) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      event.__jcConfigDeliveryHandled = true;
      Promise.resolve(realDownload(button)).catch((error) => {
        console.error("JC-APK CONFIG:", error);
        app().toast?.(error?.message || "Não foi possível baixar o arquivo .config.", "error");
      });
    }, true);
  }

  document.addEventListener("jc:access-ready", bindCapture, { once: true });
  if (window.JC_GENERATOR_CONTEXT?.mode) bindCapture();

  window.JC_CONFIG_DOWNLOAD = Object.freeze({
    download: realDownload,
    isBusy: () => busy,
    bind: bindCapture,
  });
})();
