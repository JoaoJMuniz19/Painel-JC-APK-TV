(function () {
  "use strict";

  const A = window.JC_APP;
  let busy = false;
  let captureBound = false;

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
      const message = result.error?.context?.json?.error
        || result.error?.message
        || "A função jc-download recusou a solicitação.";
      throw new Error(message);
    }
    if (!result.data || result.data.ok !== true) {
      throw new Error(result.data?.error || "Não foi possível preparar o arquivo.");
    }
    return result.data;
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

  function saveBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || ".config";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
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

  async function realDownload(button) {
    if (busy) return false;
    if (isTestMode()) return demoDownload();

    busy = true;
    setButtonBusy(button, true);
    let deliveryId = "";

    try {
      const sessionResult = await app().client.auth.getSession();
      if (!sessionResult.data?.session) throw new Error("Entre no painel antes de baixar o arquivo.");

      const reserved = await invoke({
        action: "reserve",
        request_key: requestKey(),
        device_key: deviceKey(),
        channel: "acesso_aqui",
      });
      deliveryId = reserved.delivery_id || "";

      if (!reserved.signed_url) throw new Error("O Supabase não retornou o link temporário da CONFIG.");
      const response = await fetch(reserved.signed_url, { cache: "no-store" });
      if (!response.ok) throw new Error("O arquivo privado não pôde ser baixado. Código " + response.status + ".");
      const blob = await response.blob();
      if (!blob || blob.size < 1) throw new Error("O arquivo recebido está vazio.");

      if (deliveryId && !reserved.admin_test) {
        await invoke({ action: "confirm", delivery_id: deliveryId });
      }

      saveBlob(blob, ".config");
      report({
        function_id: "config.access",
        function_name: "Acesse aqui (.config)",
        category: "CONFIG",
        item_label: "CONFIG " + String(reserved.config_no || "").padStart(3, "0") + " — V" + String(reserved.version_no || 1),
        status: "delivered",
        operation_id: randomId(),
        config_no: reserved.config_no || null,
        version_no: reserved.version_no || null,
        metadata: { admin_test: Boolean(reserved.admin_test), source: "jc-download" },
      });

      app().toast?.(
        reserved.admin_test
          ? "Teste do ADM concluído sem consumir a CONFIG."
          : "Arquivo .config baixado com sucesso."
      );
      return false;
    } catch (error) {
      if (deliveryId) {
        try {
          await invoke({ action: "cancel", delivery_id: deliveryId });
        } catch (_) {
          // A falha original continua sendo a mensagem principal para o usuário.
        }
      }
      console.error("JC-APK CONFIG:", error);
      report({
        function_id: "config.access",
        function_name: "Acesse aqui (.config)",
        category: "CONFIG",
        status: "failed",
        operation_id: randomId(),
        metadata: { message: String(error?.message || error || "Falha desconhecida"), source: "jc-download" },
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

    // Este listener é registrado depois do controle de permissões. Assim,
    // acesso bloqueado continua bloqueado, mas o botão liberado nunca volta
    // para a lógica de links_catalog, mesmo se houver metadado antigo no Supabase.
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
