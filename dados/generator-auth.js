(function () {
  "use strict";
  const A = window.JC_APP,
    $ = (id) => document.getElementById(id);
  const state = {
    access: null,
    mode: "",
    profile: null,
    permissions: {},
    functions: [],
    general: {},
    demo: {},
    downloadCodes: [],
    creditPending: new WeakSet(),
    creditBypass: new WeakSet(),
    activationPending: { "11": false, "16": false },
  };
  const knownFallback = [
    ["config.open", "config", "Config", "Abrir Config", "#btn_gerar", "entry"],
    [
      "config.generate_codes",
      "config",
      "Config",
      "Gerar códigos de download",
      "#btn_config_download_gerar_codigo",
      "action",
    ],
    [
      "config.copy_code",
      "config",
      "Config",
      "Copiar código de download",
      "#btn_config_download_copiar_codigo",
      "action",
    ],
    [
      "config.access",
      "config",
      "Config",
      "Acesse aqui (.config)",
      "#btn_config_pack",
      "download",
    ],
    [
      "config.download_codes",
      "config",
      "Config",
      "Versões / códigos de download",
      "#btn_unitv_codigos",
      "action",
    ],
    [
      "config.download_apk",
      "config",
      "Config",
      "Download das versões do APK",
      "#btn_versao",
      "link",
    ],
    [
      "config.file_manager",
      "config",
      "Config",
      "Gerenciador de arquivos",
      "#btn_tutorial",
      "link",
    ],
    [
      "config.system_update",
      "config",
      "Config",
      "Limpeza do UniTv S/Formatar",
      "#btn_atualizacao",
      "link",
    ],
    [
      "activator11.open",
      "activator11",
      "Gerador de 11 dígitos",
      "Abrir gerador 11",
      "#btn_gerador11_11",
      "entry",
    ],
    [
      "activator11.access",
      "activator11",
      "Gerador de 11 dígitos",
      "Ativador 11",
      "#btn_ativador_5100_11",
      "link",
    ],
    [
      "activator11.generate",
      "activator11",
      "Gerador de 11 dígitos",
      "Gerar ativação 11",
      "#btn_gerar_codigo_11",
      "action",
    ],
    [
      "activator11.copy",
      "activator11",
      "Gerador de 11 dígitos",
      "Copiar ativação 11",
      "#btn_copiar_codigo_11",
      "action",
    ],
    [
      "activator11.generate_download",
      "activator11",
      "Gerador de 11 dígitos",
      "Gerar código download 11",
      "#btn_gerar_codigo_download_11",
      "action",
    ],
    [
      "activator11.copy_download",
      "activator11",
      "Gerador de 11 dígitos",
      "Copiar código download 11",
      "#btn_copiar_codigo_download_11",
      "action",
    ],
    [
      "activator16.open",
      "activator16",
      "Gerador de 16 dígitos",
      "Abrir gerador 16",
      "#btn_gerador11",
      "entry",
    ],
    [
      "activator16.access",
      "activator16",
      "Gerador de 16 dígitos",
      "Ativador 16",
      "#btn_ativador_5100",
      "link",
    ],
    [
      "activator16.generate",
      "activator16",
      "Gerador de 16 dígitos",
      "Gerar ativação 16",
      "#btn_gerar_codigo_16",
      "action",
    ],
    [
      "activator16.copy",
      "activator16",
      "Gerador de 16 dígitos",
      "Copiar ativação 16",
      "#btn_copiar_codigo_16",
      "action",
    ],
    [
      "activator16.generate_download",
      "activator16",
      "Gerador de 16 dígitos",
      "Gerar código download 16",
      "#btn_gerar_codigo_download",
      "action",
    ],
    [
      "activator16.copy_download",
      "activator16",
      "Gerador de 16 dígitos",
      "Copiar código download 16",
      "#btn_copiar_codigo_download_16",
      "action",
    ],
    [
      "package.btv.open",
      "packages",
      "Pacote de APK",
      "BTV APK",
      "#btn_pacote_gerar",
      "entry",
    ],
    [
      "package.btv.generate",
      "packages",
      "Pacote de APK",
      "BTV gerar códigos",
      "#btn_pacote_btv_gerar_codigo",
      "action",
    ],
    [
      "package.btv.copy",
      "packages",
      "Pacote de APK",
      "BTV copiar código",
      "#btn_pacote_btv_copiar_codigo",
      "action",
    ],
    [
      "package.btv.access",
      "packages",
      "Pacote de APK",
      "BTV acesse aqui",
      "#btn_pacote_btv_acessar",
      "link",
    ],
    [
      "package.stv.open",
      "packages",
      "Pacote de APK",
      "STV APK",
      "#btn_pacote_stv",
      "entry",
    ],
    [
      "package.stv.generate",
      "packages",
      "Pacote de APK",
      "STV gerar códigos",
      "#btn_pacote_stv_gerar_codigo",
      "action",
    ],
    [
      "package.stv.copy",
      "packages",
      "Pacote de APK",
      "STV copiar código",
      "#btn_pacote_stv_copiar_codigo",
      "action",
    ],
    [
      "package.stv.access",
      "packages",
      "Pacote de APK",
      "STV acesse aqui",
      "#btn_pacote_stv_acessar",
      "link",
    ],
    [
      "package.xplus.open",
      "packages",
      "Pacote de APK",
      "XPLUS APK",
      "#btn_pacote_xplus",
      "entry",
    ],
    [
      "package.xplus.generate",
      "packages",
      "Pacote de APK",
      "XPLUS gerar códigos",
      "#btn_pacote_xplus_gerar_codigo",
      "action",
    ],
    [
      "package.xplus.copy",
      "packages",
      "Pacote de APK",
      "XPLUS copiar código",
      "#btn_pacote_xplus_copiar_codigo",
      "action",
    ],
    [
      "package.xplus.access",
      "packages",
      "Pacote de APK",
      "XPLUS acesse aqui",
      "#btn_pacote_xplus_acessar",
      "link",
    ],
    [
      "package.eaigo.open",
      "packages",
      "Pacote de APK",
      "EAIGO APK",
      "#btn_pacote_xplus_novo",
      "entry",
    ],
    [
      "package.eaigo.generate",
      "packages",
      "Pacote de APK",
      "EAIGO gerar códigos",
      "#btn_pacote_eaigo_gerar_codigo",
      "action",
    ],
    [
      "package.eaigo.copy",
      "packages",
      "Pacote de APK",
      "EAIGO copiar código",
      "#btn_pacote_eaigo_copiar_codigo",
      "action",
    ],
    [
      "package.eaigo.access",
      "packages",
      "Pacote de APK",
      "EAIGO acesse aqui",
      "#btn_pacote_eaigo_acessar",
      "link",
    ],
  ].map((x, i) => ({
    id: x[0],
    group_id: x[1],
    group_name: x[2],
    name: x[3],
    selector: x[4],
    action_kind: x[5],
    sort_order: i,
  }));

  function previewStorageKey(token) {
    return "jc_admin_preview_" + token;
  }
  function readAdminPreview() {
    const token = new URLSearchParams(location.search).get("jc_admin_preview");
    if (!token) return null;
    try {
      const key = previewStorageKey(token);
      const raw = localStorage.getItem(key);
      if (!raw) throw new Error("Pré-teste não encontrado.");
      const payload = JSON.parse(raw);
      localStorage.removeItem(key);
      if (!payload?.access || Number(payload.expiresAt || 0) < Date.now()) throw new Error("O pré-teste expirou. Volte ao painel e gere outro.");
      return payload.access;
    } catch (error) {
      console.warn(error);
      return { error: error.message || "Pré-teste inválido." };
    }
  }

  function msg(text, ok = false) {
    const el = $("login_msg");
    if (el) {
      el.style.color = ok ? "#1dff95" : "#ff626f";
      el.textContent = text;
    }
  }
  function expired(p) {
    if (p.status !== "active") return true;
    const type=p.account_type || (p.role==="test"?"test":Number(p.plan_months)===0?"one_time":"monthly");
    if(type==="test" && p.trial_expires_at) return new Date(p.trial_expires_at) < new Date();
    if(type==="monthly" && p.grace_until) return new Date(p.grace_until + "T23:59:59") < new Date();
    return false;
  }
  function store() {
    try {
      sessionStorage.setItem(
        "jc_apk_access",
        JSON.stringify({
          profile: state.profile,
          mode: state.mode,
          permissions: state.permissions,
          general: state.general,
          demo: state.demo,
          download_codes: state.downloadCodes,
          attendant: state.access?.attendant || {},
        }),
      );
      sessionStorage.setItem(
        "jc_apk_tipo_usuario",
        state.mode === "test" ? "teste" : state.mode,
      );
      sessionStorage.setItem(
        "jc_apk_nome_usuario",
        state.profile?.full_name || "TESTE",
      );
    } catch (e) {}
  }
  function shouldRequireAvatar() {
    if(state.access?.admin_preview) return false;
    if(!["client","test"].includes(state.mode)) return false;
    return state.profile?.avatar_required!==false && !String(state.profile?.avatar_data||"").trim();
  }
  function activationDemoCode(type) {
    const length = type === "11" ? 11 : 16;
    let output = "";
    for (let i = 0; i < length; i += 1) {
      output += (i === 0 || i === length - 1 || i % 4 === 0)
        ? String(Math.floor(Math.random() * 10))
        : "X";
    }
    return output;
  }
  function activationCodeElement(type) {
    return $(type === "11" ? "download_code_11" : "download_code_16");
  }
  function setActivationGeneratorStatus(type, message, ok) {
    if (type === "11") {
      const bar = $("download_status_11");
      const icon = $("download_status_icon_11");
      const text = $("download_status_msg_11");
      if (bar) {
        bar.classList.add("visible");
        bar.classList.remove("success", "error");
        bar.classList.add(ok === false ? "error" : "success");
      }
      if (icon) icon.textContent = ok === false ? "⚠️" : "✅";
      if (text) text.textContent = message;
      return;
    }
    const bar = $("status_bar");
    const icon = $("status_icon");
    const text = $("status_msg");
    if (bar) {
      bar.classList.add("visible");
      bar.classList.remove("success", "error");
      bar.classList.add(ok === false ? "error" : "success");
    }
    if (icon) icon.textContent = ok === false ? "⚠️" : "✅";
    if (text) text.textContent = message;
  }
  function setActivationCodeValue(type, value) {
    const element = activationCodeElement(type);
    if (!element) return;
    element.textContent = String(value || "");
    element.dataset.codigoAtual = String(value || "");
  }
  function closeActivationClientPicker(value) {
    const modal = $("jc_activation_client_picker");
    if (modal) modal.classList.remove("show");
    const resolver = window.__jcActivationClientResolver;
    window.__jcActivationClientResolver = null;
    if (typeof resolver === "function") resolver(value || null);
  }
  function ensureActivationClientPicker() {
    let modal = $("jc_activation_client_picker");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "jc_activation_client_picker";
    modal.innerHTML = `
      <div class="jc-activation-client-box" role="dialog" aria-modal="true" aria-labelledby="jc_activation_client_title">
        <div class="jc-activation-client-head">
          <div><h3 id="jc_activation_client_title">Escolha o responsável pelo código</h3><p>Venda direta usa seu cadastro. Para revenda, escolha o cliente responsável pelo suporte.</p></div>
          <button type="button" id="jc_activation_client_close" aria-label="Fechar">×</button>
        </div>
        <input id="jc_activation_client_search" type="search" placeholder="Buscar venda direta, nome, usuário ou e-mail">
        <div id="jc_activation_client_list" class="jc-activation-client-list"></div>
      </div>`;
    document.body.appendChild(modal);
    if (!$("jc_activation_client_styles")) {
      const style = document.createElement("style");
      style.id = "jc_activation_client_styles";
      style.textContent = `#jc_activation_client_picker{position:fixed;inset:0;z-index:2147483647;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.78);backdrop-filter:blur(8px)}#jc_activation_client_picker.show{display:flex}.jc-activation-client-box{width:min(660px,96vw);max-height:86vh;overflow:auto;border-radius:24px;padding:20px;background:linear-gradient(145deg,#071522,#02070d);border:1px solid rgba(67,177,255,.35);box-shadow:0 28px 90px rgba(0,0,0,.65);color:#fff;font-family:Arial,sans-serif}.jc-activation-client-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.jc-activation-client-head h3{margin:0;font-size:23px}.jc-activation-client-head p{margin:6px 0 0;color:#9db2bd}.jc-activation-client-head button{width:42px;height:42px;border:0;border-radius:12px;background:rgba(255,255,255,.1);color:#fff;font-size:24px;cursor:pointer}#jc_activation_client_search{width:100%;box-sizing:border-box;margin:16px 0 12px;padding:13px 14px;border-radius:13px;border:1px solid rgba(255,255,255,.16);background:#07101b;color:#fff;font-size:15px}.jc-activation-client-list{display:grid;gap:9px}.jc-activation-client-option{display:flex;flex-direction:column;align-items:flex-start;gap:4px;width:100%;padding:13px 14px;border-radius:14px;border:1px solid rgba(62,175,255,.28);background:rgba(21,83,153,.34);color:#fff;text-align:left;cursor:pointer}.jc-activation-client-option:hover{background:rgba(31,111,205,.5)}.jc-activation-client-option.jc-direct-sale{border-color:rgba(54,225,141,.62);background:linear-gradient(135deg,rgba(18,125,74,.52),rgba(13,74,117,.46));box-shadow:inset 0 0 0 1px rgba(54,225,141,.12)}.jc-activation-client-option.jc-direct-sale:hover{background:linear-gradient(135deg,rgba(24,159,92,.62),rgba(20,99,151,.56))}.jc-activation-client-option strong{font-size:15px}.jc-activation-client-option span,.jc-activation-client-loading{font-size:12px;color:#a9bdc9}.jc-activation-client-option.jc-direct-sale span{color:#bfffe0}.jc-activation-client-loading{padding:18px;text-align:center}`;
      document.head.appendChild(style);
    }
    $("jc_activation_client_close").onclick = () => closeActivationClientPicker(null);
    modal.onclick = (event) => { if (event.target === modal) closeActivationClientPicker(null); };
    return modal;
  }
  async function chooseActivationClient() {
    const modal = ensureActivationClientPicker();
    const list = $("jc_activation_client_list");
    const search = $("jc_activation_client_search");
    list.innerHTML = '<div class="jc-activation-client-loading">Carregando clientes...</div>';
    search.value = "";
    modal.classList.add("show");

    const result = await A.client
      .from("profiles")
      .select("id,username,full_name,email,role,status,account_type")
      .eq("status", "active")
      .order("full_name", { ascending: true });
    if (result.error) {
      modal.classList.remove("show");
      throw result.error;
    }

    const clients = (result.data || []).filter((item) =>
      item && item.role !== "admin" && item.role !== "test" && item.account_type !== "test"
    );

    const directSale = {
      id: state.profile?.id || "",
      username: state.profile?.username || "admin",
      full_name: "Venda direta JC APK TV",
      email: state.profile?.email || "",
      role: "admin",
      account_type: "direct_sale",
      direct_sale: true,
    };

    if (!directSale.id) {
      modal.classList.remove("show");
      throw new Error("Sua sessão administrativa não possui identificação.");
    }

    return await new Promise((resolve) => {
      window.__jcActivationClientResolver = resolve;
      const render = () => {
        const term = String(search.value || "").trim().toLowerCase();
        const matches = (item) =>
          [item.full_name, item.username, item.email, item.direct_sale ? "venda direta meu suporte jc apk tv" : ""]
            .join(" ")
            .toLowerCase()
            .includes(term);

        const filteredClients = clients.filter(matches);
        const showDirect = matches(directSale);

        list.innerHTML = "";

        if (showDirect) {
          const directButton = document.createElement("button");
          directButton.type = "button";
          directButton.className = "jc-activation-client-option jc-direct-sale";
          directButton.innerHTML = `<strong>🏠 Venda direta JC APK TV — Meu suporte</strong><span>Usa o WhatsApp principal do seu cadastro e não desconta créditos de revendedor.</span>`;
          directButton.onclick = () => closeActivationClientPicker(directSale);
          list.appendChild(directButton);
        }

        filteredClients.forEach((item) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "jc-activation-client-option";
          button.innerHTML = `<strong>${escapeHtml(item.full_name || item.username || "Cliente")}</strong><span>@${escapeHtml(item.username || "")} · ${escapeHtml(item.email || "")}</span>`;
          button.onclick = () => closeActivationClientPicker({ ...item, direct_sale: false });
          list.appendChild(button);
        });

        if (!showDirect && !filteredClients.length) {
          list.innerHTML = '<div class="jc-activation-client-loading">Nenhum responsável encontrado.</div>';
        }
      };

      search.oninput = render;
      render();
      setTimeout(() => search.focus(), 80);
    });
  }
  function activationErrorMessage(error) {
    const raw = String(error?.message || error || "").trim();
    const messages = {
      AUTHENTICATED_SESSION_REQUIRED: "Sua sessão não foi reconhecida. Saia do painel, entre novamente e tente outra vez.",
      INVALID_SESSION: "Sua sessão expirou. Saia do painel, entre novamente e tente outra vez.",
      CALLER_NOT_ACTIVE: "Este acesso não está ativo.",
      TEST_USER_CANNOT_CREATE_REAL_CODE: "O usuário de teste gera somente código demonstrativo.",
      INVALID_CODE_TYPE: "Tipo de código inválido.",
      CLIENT_REQUIRED: "Cliente não identificado.",
      CLIENT_CAN_ONLY_CREATE_FOR_SELF: "O cliente só pode gerar código para o próprio cadastro.",
      CLIENT_NOT_ACTIVE: "O cadastro do cliente não está ativo.",
      REAL_CLIENT_REQUIRED: "Selecione um cliente real e ativo.",
      DIRECT_SALE_ADMIN_ONLY: "A opção Venda direta JC APK TV está disponível somente para o administrador.",
      CLIENT_ACCESS_EXPIRED: "O acesso deste cliente está vencido.",
      CLIENT_FUNCTION_NOT_ALLOWED: "Esta função não está liberada para este cliente.",
      SERVER_SECRETS_NOT_CONFIGURED: "A função do servidor ainda não está configurada corretamente.",
      SERVER_DID_NOT_RETURN_CODE: "O servidor não devolveu o código. Tente novamente uma vez.",
      SERVER_REQUEST_FAILED: "Não foi possível concluir a solicitação no servidor.",
    };
    if (messages[raw]) return messages[raw];
    if (/Failed to send a request/i.test(raw)) return "Não foi possível alcançar o servidor. Verifique a internet e tente novamente.";
    if (/FunctionsHttpError|non-2xx/i.test(raw)) return "O servidor recusou a geração. Confira a permissão do cliente e a sessão do painel.";
    return raw || "Não foi possível gerar o código no servidor.";
  }
  function activationButton(type) {
    return $(type === "11" ? "btn_gerar_codigo_11" : "btn_gerar_codigo_16");
  }
  function setActivationButtonBusy(type, busy) {
    const button = activationButton(type);
    if (!button) return;
    if (!button.dataset.jcOriginalHtml) button.dataset.jcOriginalHtml = button.innerHTML;
    button.disabled = Boolean(busy);
    button.classList.toggle("loading", Boolean(busy));
    button.setAttribute("aria-busy", busy ? "true" : "false");
    button.innerHTML = busy
      ? `<span>⏳ GERANDO CÓDIGO REAL DE ${type} DÍGITOS...</span>`
      : button.dataset.jcOriginalHtml;
  }
  async function createServerActivationCode(type) {
    type = String(type || "");
    if (!["11", "16"].includes(type)) return false;

    if (state.activationPending[type]) {
      setActivationGeneratorStatus(type, "A geração já está em andamento. Aguarde a resposta do servidor.", true);
      return false;
    }

    if (state.mode === "test" || state.mode === "preview") {
      setActivationCodeValue(type, activationDemoCode(type));
      setActivationGeneratorStatus(type, "Código DEMO gerado. Ele contém X e nunca será válido.", true);
      return false;
    }

    state.activationPending[type] = true;
    setActivationButtonBusy(type, true);
    setActivationCodeValue(type, "AGUARDE...");
    const codeElement = activationCodeElement(type);
    if (codeElement) codeElement.dataset.codigoAtual = "";
    setActivationGeneratorStatus(type, "Enviando a solicitação ao servidor. Não clique novamente.", true);

    try {
      let clientId = state.profile?.id || "";
      let clientLabel = state.profile?.full_name || state.profile?.username || "cliente";
      let directSale = false;

      if (state.mode === "admin") {
        const selected = await chooseActivationClient();
        if (!selected) {
          setActivationCodeValue(type, "CANCELADO");
          setActivationGeneratorStatus(type, "Geração cancelada.", false);
          return false;
        }

        directSale = selected.direct_sale === true;
        clientId = selected.id;
        clientLabel = directSale
          ? "Venda direta JC APK TV"
          : (selected.full_name || selected.username || "cliente");
      }

      if (!clientId) throw new Error("CLIENT_REQUIRED");

      const response = await A.client.functions.invoke("jc-activate", {
        body: {
          action: "create_code",
          code_type: type,
          client_id: clientId,
          direct_sale: directSale,
        },
      });

      if (response.error) {
        let serverError = "";
        try {
          const context = response.error.context;
          if (context && typeof context.json === "function") {
            const body = await context.json();
            serverError = body?.error || "";
          }
        } catch (_) {}
        throw new Error(serverError || response.error.message || "SERVER_REQUEST_FAILED");
      }
      if (!response.data?.ok || !response.data?.code) {
        throw new Error(response.data?.error || "SERVER_DID_NOT_RETURN_CODE");
      }

      const code = String(response.data.code).replace(/\D/g, "");
      if (code.length !== Number(type)) throw new Error("O servidor devolveu um código com tamanho incorreto.");

      setActivationCodeValue(type, code);
      setActivationGeneratorStatus(
        type,
        directSale
          ? `Código real de ${type} dígitos criado como venda direta JC APK TV.`
          : `Código real de ${type} dígitos criado para ${clientLabel}.`,
        true
      );
      return false;
    } catch (error) {
      console.error("Falha ao gerar código real:", error);
      setActivationCodeValue(type, "NÃO GERADO");
      const failedElement = activationCodeElement(type);
      if (failedElement) failedElement.dataset.codigoAtual = "";
      setActivationGeneratorStatus(type, activationErrorMessage(error), false);
      return false;
    } finally {
      state.activationPending[type] = false;
      setActivationButtonBusy(type, false);
    }
  }
  function bindServerActivationButton(type) {
    const button = activationButton(type);
    if (!button || button.dataset.jcServerActivationBound === "1") return;
    button.dataset.jcServerActivationBound = "1";
    button.removeAttribute("onclick");
    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      createServerActivationCode(type);
      return false;
    }, true);
  }
  function installServerActivationGenerators() {
    // A geração real continua nesta camada autenticada. O clique é tratado
    // somente pelo runtime unificado (panel-runtime.js).
    window.JC_ACTIVATION_CODES = {
      generate: createServerActivationCode,
      mode: () => state.mode,
      profile: () => state.profile,
    };
  }
  function completeGrant() {
    store();
    installServerActivationGenerators();
    applyPermissions();
    renderDownloadCodePopup();
    if (state.mode === "test") {
      installTestGuard();
      scrubTestLinks();
    }
    window.JC_GENERATOR_CONTEXT={mode:state.mode,profile:state.profile,functions:state.functions,permissions:state.permissions};
    window.JC_DEMO_RUNTIME={show:demoDialog,showServer:showDemoServer};
    injectClientBar();
    document.dispatchEvent(new CustomEvent("jc:access-ready",{detail:window.JC_GENERATOR_CONTEXT}));
    if (typeof window.liberarSistemaAposEspera === "function")
      window.liberarSistemaAposEspera(state.mode === "test" ? "teste" : state.mode);
    else {
      const lock = $("tokenLock");
      if (lock) lock.style.display = "none";
    }
  }
  function avatarInitials(value){
    const parts=String(value||"").trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0]||"?")+(parts.length>1?(parts[parts.length-1]?.[0]||""):"")).toUpperCase();
  }
  function profileAvatarMarkup(){
    const name=state.profile?.full_name||state.profile?.username||"Cliente";
    const data=String(state.profile?.avatar_data||"");
    return data?`<img src="${escapeHtml(data)}" alt="Foto de ${escapeHtml(name)}">`:escapeHtml(avatarInitials(name));
  }
  async function compressProfileAvatar(file){
    if(!file) return "";
    if(!String(file.type||"").startsWith("image/")) throw new Error("Escolha um arquivo de imagem.");
    if(file.size>12*1024*1024) throw new Error("A imagem é muito grande. Escolha uma foto com até 12 MB.");
    const src=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error("Não foi possível ler a foto."));r.readAsDataURL(file);});
    const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error("Não foi possível abrir a foto."));i.src=src;});
    const size=320,canvas=document.createElement("canvas");canvas.width=size;canvas.height=size;const ctx=canvas.getContext("2d");
    const scale=Math.max(size/img.width,size/img.height),w=img.width*scale,h=img.height*scale;
    ctx.drawImage(img,(size-w)/2,(size-h)/2,w,h);
    let out=canvas.toDataURL("image/jpeg",.78);
    if(out.length>180000) out=canvas.toDataURL("image/jpeg",.62);
    if(out.length>180000) throw new Error("Não foi possível compactar a foto. Escolha outra imagem.");
    return out;
  }
  function showAvatarGate(){
    injectStyles();
    let m=$("jc_avatar_gate");
    if(!m){
      m=document.createElement("div");m.id="jc_avatar_gate";m.className="jc-avatar-gate show";
      m.innerHTML=`<div class="jc-avatar-box"><div class="jc-avatar-preview" id="jc_avatar_preview">${profileAvatarMarkup()}</div><h2>Complete sua identificação para continuar</h2><p>Para tornar seu acesso mais seguro e facilitar a identificação do seu cadastro, precisamos que você adicione uma foto de perfil.</p><p>Depois que a imagem for salva, seu acesso será liberado automaticamente e essa solicitação não aparecerá novamente.</p><p class="jc-avatar-note">A foto será usada somente como avatar de identificação dentro do painel.</p><div class="jc-avatar-buttons"><button id="jc_avatar_camera" type="button">📷 Abrir câmera</button><button id="jc_avatar_file" type="button">🖼️ Escolher foto do aparelho</button></div><input id="jc_avatar_camera_input" type="file" accept="image/*" capture="user" hidden><input id="jc_avatar_file_input" type="file" accept="image/*" hidden><button class="jc-avatar-save" id="jc_avatar_save" type="button" disabled>✅ Salvar e liberar acesso</button><div class="jc-avatar-msg" id="jc_avatar_msg"></div></div>`;
      document.body.appendChild(m);
      const camera=$("jc_avatar_camera_input"),fileInput=$("jc_avatar_file_input"),save=$("jc_avatar_save"),preview=$("jc_avatar_preview"),message=$("jc_avatar_msg");
      let prepared="";
      const choose=async(file)=>{try{message.textContent="Preparando foto...";prepared=await compressProfileAvatar(file);preview.innerHTML=`<img src="${escapeHtml(prepared)}" alt="Prévia da foto">`;save.disabled=false;message.textContent="Foto pronta para salvar.";}catch(e){prepared="";save.disabled=true;message.textContent=e.message||"Não foi possível preparar a foto.";}};
      $("jc_avatar_camera").onclick=()=>camera.click();
      $("jc_avatar_file").onclick=()=>fileInput.click();
      camera.onchange=(e)=>choose(e.target.files?.[0]);
      fileInput.onchange=(e)=>choose(e.target.files?.[0]);
      save.onclick=async()=>{if(!prepared)return;save.disabled=true;message.textContent="Salvando foto...";try{let result;if(state.mode==="test"){result=await A.client.rpc("set_test_avatar_by_username",{p_identifier:state.profile.username,p_password:"teste",p_avatar_data:prepared});}else{result=await A.client.rpc("set_my_avatar",{p_avatar_data:prepared});}if(result.error)throw result.error;state.profile.avatar_data=prepared;state.profile.avatar_updated_at=new Date().toISOString();m.classList.remove("show");completeGrant();}catch(e){save.disabled=false;message.textContent=e.message||"Não foi possível salvar a foto.";}};
    }else m.classList.add("show");
  }
  function grant(mode, access) {
    state.mode = mode;
    state.access = access || {};
    state.profile = access?.profile || {
      username: "teste",
      full_name: "USUÁRIO TESTE",
      role: "test",
      status: "active",
    };
    state.permissions = access?.permissions || {};
    state.functions = (access?.functions || knownFallback).map((item) =>
      String(item?.id || "") === "config.access"
        ? { ...item, selector: "#btn_config_pack", action_kind: "download" }
        : item
    );
    state.general = access?.general || {};
    state.demo = access?.demo || {};
    state.downloadCodes = Array.isArray(access?.download_codes) ? access.download_codes : [];
    if(shouldRequireAvatar()) { showAvatarGate(); return; }
    completeGrant();
  }
  async function validate() {
    const user = $("login_user")?.value.trim() || "",
      pass = $("login_pass")?.value || "";
    if (!user || !pass) {
      msg("Digite usuário/e-mail e senha.");
      return;
    }
    msg("VALIDANDO ACESSO...");
    try {
      // Cliente da categoria Teste usa a palavra pública "teste".
      // Este caminho não cria sessão autenticada e retorna somente o ambiente demonstrativo.
      if (pass === "teste") {
        const { data, error } = await A.client.rpc("get_test_access_by_username", {
          p_identifier: user,
          p_password: pass,
        });
        if (error) throw error;
        if (!data?.profile) throw new Error("Usuário de teste não encontrado, bloqueado ou com prazo encerrado.");
        msg("ABRINDO DEMONSTRAÇÃO...", true);
        grant("test", data);
        return;
      }
      await A.login(user, pass);
      const access = await A.myAccess();
      if (!access?.profile)
        throw new Error("Cadastro do usuário não encontrado.");
      if (expired(access.profile))
        throw new Error(
          access.profile.status === "blocked"
            ? "Seu acesso está bloqueado. Fale com o administrador."
            : "Seu acesso venceu. Fale com o administrador.",
        );
      const mode = access.profile.role === "admin" ? "admin" : access.profile.role === "test" ? "test" : "client";
      msg("PREPARANDO ACESSO...", true);
      grant(mode, access);
    } catch (e) {
      msg(e.message || "Usuário ou senha incorretos.");
    }
  }
  window.validarLogin = validate;
  function entryScopeAllowed(f) {
    const id = String(f?.id || "");

    // Cada pacote é independente. Antes, BTV, STV, XPLUS e EAIGO usavam o
    // mesmo group_id "packages"; ter qualquer permissão nesse grupo fazia
    // todos os botões principais parecerem liberados.
    const packageMatch = id.match(/^package\.(btv|stv|xplus|eaigo)\.open$/);
    if (packageMatch) {
      const prefix = "package." + packageMatch[1] + ".";
      return state.functions.some(
        (x) =>
          String(x.id || "").startsWith(prefix) &&
          Boolean(state.permissions?.[x.id]),
      );
    }

    // Mantém a regra histórica para os demais grupos do projeto.
    return state.functions.some(
      (x) => x.group_id === f.group_id && Boolean(state.permissions?.[x.id]),
    );
  }

  function allowed(f) {
    if (state.mode === "admin") return true;
    // No modo teste, cada função só aparece quando “Permitir demonstração”
    // estiver habilitado no Supabase.
    if (state.mode === "test") return f.demo_enabled !== false;
    if (state.permissions[f.id]) return true;
    if (f.action_kind === "entry") return entryScopeAllowed(f);
    return false;
  }
  function demoCode(value) {
    const raw=String(value||"");
    if(/^33XX/i.test(raw)) return raw;
    const n=Math.max(3,raw.length-4);
    return "33XX"+"X".repeat(n);
  }
  function renderDownloadCodePopup() {
    const modal=$("jc_unitv_codes_modal");
    if(!modal) return;
    if(!state.downloadCodes.length){
      const rows=modal.querySelectorAll(".jc-unitv-test-code.jc-unitv-copy-line");rows.forEach((x)=>x.style.display="none");
      const list=modal.querySelector(".jc-unitv-code-list");if(list)list.innerHTML='<div style="padding:14px;text-align:center;color:#ffd0d7">Nenhum código liberado para este acesso.</div>';
      return;
    }
    const items=state.downloadCodes.filter((x)=>x&&x.active!==false).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
    const managers=items.filter((x)=>x.item_kind==="manager");
    const versions=items.filter((x)=>x.item_kind==="version"||x.item_kind==="other");
    const tests=items.filter((x)=>x.item_kind==="test");
    const rows=modal.querySelectorAll(".jc-unitv-test-code.jc-unitv-copy-line");
    const manager=rows[0],test=rows[rows.length-1],list=modal.querySelector(".jc-unitv-code-list");
    const codeOf=(x)=>state.mode==="test"?demoCode(x.code):String(x.code||"");
    const copyButton=(code)=>`<button type="button" class="jc-unitv-copy-btn" data-jc-action="copy-unitv-code" data-copy-code="${escapeHtml(code)}" aria-label="Copiar código ${escapeHtml(code)}">COPIAR</button>`;
    if(manager){
      const x=managers[0];
      manager.style.display=x?"":"none";
      if(x){const c=codeOf(x);manager.innerHTML=`<span>${escapeHtml(x.label)} - <span class="jc-unitv-copy-value">${escapeHtml(c)}</span></span>${copyButton(c)}`;}
    }
    if(list){
      list.innerHTML=versions.map((x)=>{const c=codeOf(x);return `<div class="jc-unitv-code-row"><strong>${escapeHtml(x.label)}</strong><span class="jc-unitv-code-actions"><span class="jc-unitv-copy-value">${escapeHtml(c)}</span>${copyButton(c)}</span></div>`;}).join("");
    }
    if(test){
      const x=tests[0];
      test.style.display=x?"":"none";
      if(x){const c=codeOf(x);test.innerHTML=`<span>${escapeHtml(x.label)} - <span class="jc-unitv-copy-value">${escapeHtml(c)}</span></span>${copyButton(c)}`;}
    }
    const titles=modal.querySelectorAll(".jc-unitv-test-title");
    if(titles[0]) titles[0].textContent=(versions[0]?.section_name||"UniTV Free Versões");
    if(titles[1]) titles[1].textContent=(tests[0]?.section_name||"Código de teste");
  }
  function scrubTestLinks() {
    document.querySelectorAll("a[href],a[download]").forEach((a)=>{
      const raw=a.getAttribute("href")||"";
      try{const u=new URL(raw,location.href);if(a.hasAttribute("download")||u.origin!==location.origin){a.removeAttribute("href");a.removeAttribute("download");a.dataset.jcDemoOnly="true";}}catch(e){}
    });
    const functions=state.functions.length?state.functions:knownFallback;
    functions.filter((f)=>f.action_kind==="link").forEach((f)=>{
      let els=[];try{els=[...document.querySelectorAll(f.selector)];}catch(e){}
      els.forEach((el)=>{
        if(el.matches?.("a")){el.removeAttribute("href");el.removeAttribute("download");}
        el.querySelectorAll?.("a[href],a[download]").forEach((a)=>{a.removeAttribute("href");a.removeAttribute("download");});
        el.dataset.jcDemoOnly="true";
      });
    });
  }
  function demoFileInfo(f) {
    const name=String(f?.name||"Arquivo demonstrativo").trim();
    let ext=".APK";
    if(/config/i.test(name)) ext=".CONFIG";
    else if(/zip|pacote/i.test(name)) ext=".ZIP";
    else if(/atualiza/i.test(name)) ext=".BIN";
    else if(/gerenciador/i.test(name)) ext=".APK";
    const base=name.replace(/\s+/g," ");
    const bytes=(base.length*13791+Number(new Date().getMinutes())*997)%85000000+1800000;
    const size=bytes>1000000?(bytes/1000000).toFixed(1)+" MB":Math.round(bytes/1000)+" KB";
    return {name:base+(/\.[A-Z0-9]{2,7}$/i.test(base)?"":ext.toLowerCase()),type:ext,size};
  }
  function showDemoServer(f) {
    injectStyles();
    let m=$("jc_demo_server_modal");
    if(!m){
      m=document.createElement("div");m.id="jc_demo_server_modal";m.className="jc-demo-server-modal";
      m.innerHTML='<div class="jc-demo-page"><button class="jc-demo-x" id="jc_demo_server_close" type="button">×</button><div class="jc-demo-watermarks" id="jc_demo_watermarks"></div><div class="jc-demo-server-main"><div class="jc-demo-server-top"><div class="jc-demo-file-icon">📄</div><div class="jc-demo-top-tools">↗ &nbsp; 🔗 &nbsp; ＋</div><button type="button" class="jc-demo-download" id="jc_demo_download">DOWNLOAD</button></div><div class="jc-demo-server-hint">O botão abaixo simula o servidor, sem entregar arquivo ou endereço real.</div><div class="jc-demo-file-card"><div class="jc-demo-file-big">📄</div><div><div class="jc-demo-file-name" id="jc_demo_file_name"></div><div class="jc-demo-file-type" id="jc_demo_file_type"></div><div class="jc-demo-meta"><b>Tamanho:</b> <span id="jc_demo_file_size"></span><br><b>Atualizado:</b> <span id="jc_demo_file_time"></span><br><b>Servidor:</b> <span id="jc_demo_server_name"></span></div><h4>Sobre o arquivo</h4><p>Arquivo apresentado em ambiente demonstrativo para conhecer o funcionamento do Painel JC-APK TV.</p></div><div class="jc-demo-side"><b id="jc_demo_side_type"></b><span>Compatibilidade do sistema</span><select disabled><option>Windows / Android</option></select><p>✅ Arquivo compatível com o sistema selecionado.</p></div></div></div><div class="jc-demo-fixed-badge"><b>🛡️ <span id="jc_demo_badge_title"></span></b><small id="jc_demo_badge_text"></small><button type="button" class="jc-demo-buy" id="jc_demo_buy">Ver valor / comprar</button></div></div>';
      document.body.appendChild(m);
      $("jc_demo_server_close").onclick=()=>m.classList.remove("show");
      m.onclick=(e)=>{if(e.target===m)m.classList.remove("show");};
      $("jc_demo_download").onclick=()=>demoDialog({name:"Download demonstrativo",purchase_enabled:false});
    }
    const buy=$("jc_demo_buy");if(buy){const canBuy=Boolean(f.purchase_enabled)||Number(f.purchase_price||0)>0;buy.style.display=canBuy?"":"none";buy.onclick=()=>{m.classList.remove("show");openPurchaseCenter(f.id);};}
    const info=demoFileInfo(f),now=new Date();
    const server=state.demo.server_name||"MediaFire",watermark=state.demo.watermark||"DEMONSTRAÇÃO";
    $("jc_demo_file_name").textContent=info.name;
    $("jc_demo_file_type").textContent=`Documento (${info.type})`;
    $("jc_demo_file_size").textContent=info.size;
    $("jc_demo_file_time").textContent=now.toLocaleString("pt-BR");
    $("jc_demo_server_name").textContent=server;
    $("jc_demo_side_type").textContent=info.type.toLowerCase();
    $("jc_demo_download").textContent=`DOWNLOAD (${info.size})`;
    $("jc_demo_badge_title").textContent=state.demo.badge_title||"AMBIENTE DEMONSTRATIVO";
    $("jc_demo_badge_text").textContent=state.demo.badge_text||"Conteúdo fictício — nenhum arquivo ou download real.";
    $("jc_demo_watermarks").style.setProperty("--jc-watermark",JSON.stringify(watermark));
    m.classList.add("show");
  }
  function installTestGuard() {
    if (window.__jcTestGuard) return;
    window.__jcTestGuard = true;
    const nativeOpen = window.open ? window.open.bind(window) : null;
    window.open = function (url) {
      const raw=String(url||"");
      try{
        const u=new URL(raw,location.href);
        const isWhatsapp=["wa.me","api.whatsapp.com","web.whatsapp.com"].includes(u.hostname);
        if(isWhatsapp&&nativeOpen)return nativeOpen.apply(window,arguments);
        if(u.origin===location.origin&&u.pathname.includes("/autoatendimento/")&&u.searchParams.get("mode")==="config"&&nativeOpen)return nativeOpen.apply(window,arguments);
      }catch(e){}
      showDemoServer({name:"Link ou download protegido",action_kind:"link"});
      return {opener:null,focus:function(){},close:function(){}};
    };
    document.addEventListener("click",function(e){
      const a=e.target.closest&&e.target.closest("a[href],a[download]");if(!a)return;const raw=a.getAttribute("href")||"";
      if(a.hasAttribute("download")||/^https?:/i.test(raw)){
        try{
          const u=new URL(raw,location.href);
          if(["wa.me","api.whatsapp.com","web.whatsapp.com"].includes(u.hostname))return;
          if(u.origin===location.origin&&u.pathname.includes("/autoatendimento/")&&u.searchParams.get("mode")==="config")return;
        }catch(err){}
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();showDemoServer({name:a.dataset?.jcFunctionName||a.textContent?.trim()||(a.hasAttribute("download")?"Download demonstrativo":"Link demonstrativo"),action_kind:"link"});
      }
    },true);
    const nativeFetch=window.fetch?window.fetch.bind(window):null;
    if(nativeFetch){window.fetch=function(input,init){const raw=typeof input==="string"?input:(input&&input.url)||"";try{const u=new URL(raw,location.href),supabaseOrigin=A.cfg.url?new URL(A.cfg.url).origin:"";if(u.origin!==location.origin&&u.origin!==supabaseOrigin){demoDialog({name:"Acesso externo demonstrativo"});return Promise.reject(new Error("Modo teste: acesso externo bloqueado."));}}catch(e){}return nativeFetch(input,init);};}
    if(window.XMLHttpRequest){const nativeXhrOpen=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(method,url){try{const u=new URL(String(url||""),location.href),supabaseOrigin=A.cfg.url?new URL(A.cfg.url).origin:"";if(u.origin!==location.origin&&u.origin!==supabaseOrigin){demoDialog({name:"Acesso externo demonstrativo"});throw new Error("Modo teste: acesso externo bloqueado.");}}catch(e){if(String(e.message||e).includes("Modo teste"))throw e;}return nativeXhrOpen.apply(this,arguments);};}
    document.addEventListener("submit",function(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();demoDialog({name:"Envio demonstrativo"});},true);
  }
  function blockedDialog(f) {
    let m = $("jc_permission_modal");
    if (!m) {
      m = document.createElement("div");
      m.id = "jc_permission_modal";
      m.innerHTML =
        '<div class="jc-permission-box"><div class="jc-permission-icon">🔒</div><h3 id="jc_permission_title"></h3><p>Esta função não está incluída no seu acesso. Entre em contato com a JC-APK TV para solicitar a liberação.</p><button type="button" id="jc_permission_close">Entendi</button></div>';
      document.body.appendChild(m);
      $("jc_permission_close").onclick = () => m.classList.remove("show");
      m.onclick = (e) => {
        if (e.target === m) m.classList.remove("show");
      };
    }
    $("jc_permission_title").textContent = f.name;
    m.classList.add("show");
  }
  function applyPermissions() {
    const functions = state.functions.length ? state.functions : knownFallback;
    functions.forEach((f) => {
      let els = [];
      try { if (f.selector) els = [...document.querySelectorAll(f.selector)]; } catch (e) {}
      document.querySelectorAll("[data-jc-function-id]").forEach((candidate) => {
        if (candidate.dataset.jcFunctionId === f.id && !els.includes(candidate)) els.push(candidate);
      });
      els.forEach((el) => {
        el.dataset.jcFunctionId = f.id;
        el.dataset.jcFunctionName = f.name;
        const yes = allowed(f);
        el.classList.toggle("jc-function-locked", !yes && state.mode !== "preview");
        el.classList.toggle("jc-function-demo", state.mode === "test");
        el.classList.toggle("jc-preview-active", state.mode === "preview" && yes);
        el.classList.toggle("jc-preview-blocked", state.mode === "preview" && !yes);
        if (!yes && state.mode === "test" && f.demo_enabled === false) {
          el.style.display = "none";
          el.setAttribute("aria-hidden", "true");
        } else if (!yes && state.mode !== "preview" && state.general.show_locked_functions === false) {
          el.style.display = "none";
        } else {
          if (state.mode === "preview") el.style.removeProperty("display");
          if (!yes) {
            el.setAttribute("aria-disabled", "true");
            el.title = state.mode === "preview" ? "Bloqueado para este cliente — clique para ver a demonstração" : "Função não incluída no acesso";
          } else {
            el.removeAttribute("aria-disabled");
            if (state.mode === "preview") el.title = "Liberado para este cliente";
          }
        }
      });
    });
    if (!window.__jcPermissionCaptureBound) {
      document.addEventListener("click", permissionCapture, true);
      window.__jcPermissionCaptureBound = true;
    }
  }

  function accountType(){return state.profile?.account_type || (state.profile?.role==="test"?"test":Number(state.profile?.plan_months)===0?"one_time":"monthly");}
  function reportOperationId(){
    return crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,(c)=>{const r=Math.random()*16|0,v=c==="x"?r:(r&3|8);return v.toString(16);});
  }
  function dispatchReportAction(el,f,operationId){
    if(!f || f.report_enabled===false || String(f.report_trigger||"click")!=="click") return;
    if(state.mode==="test" || state.mode==="preview") return;
    const detail={
      function_id:f.id,
      function_name:f.name,
      category:f.report_category||f.group_name||f.name,
      item_label:f.report_label||f.name,
      status:"opened",
      operation_id:operationId||reportOperationId()
    };
    document.dispatchEvent(new CustomEvent("jc:report-action",{detail}));
  }
  window.JC_GENERATOR_CONTEXT=window.JC_GENERATOR_CONTEXT||{};
  function updateCreditBalance(balance){
    state.profile.credits_balance=Number(balance||0);const el=$("jc_credit_balance");if(el)el.textContent=state.profile.credits_balance+" créditos";
  }
  async function consumeCreditAndReplay(el,f){
    if(state.creditPending.has(el))return;state.creditPending.add(el);
    try{
      const cost=Math.max(1,Number(f.credit_cost)||1);const balance=Number(state.profile.credits_balance||0);
      if(balance<cost){demoDialog({name:"Créditos insuficientes"});$("jc_demo_text").textContent=`Seus créditos acabaram ou são insuficientes. Saldo atual: ${balance}. As funções gratuitas continuam disponíveis. Entre em contato para comprar mais.`;return;}
      if(!confirm(`Esta função utiliza ${cost} crédito${cost>1?"s":""}. Saldo atual: ${balance}. Deseja continuar?`))return;
      const operationId=crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,(c)=>{const r=Math.random()*16|0,v=c==="x"?r:(r&3|8);return v.toString(16);});
      const {data,error}=await A.client.rpc("consume_credit",{p_function_id:f.id,p_operation_id:operationId});if(error)throw error;
      updateCreditBalance(data?.balance);el.dataset.jcReportOperationId=operationId;state.creditBypass.add(el);setTimeout(()=>state.creditBypass.delete(el),3000);el.click();
    }catch(err){demoDialog({name:"Não foi possível usar os créditos"});$("jc_demo_text").textContent=err.message||"Falha ao confirmar o consumo.";}finally{state.creditPending.delete(el);}
  }
  function permissionCapture(e) {
    const el=e.target.closest("[data-jc-function-id]");if(!el)return;
    const f=(state.functions.length?state.functions:knownFallback).find((x)=>x.id===el.dataset.jcFunctionId);if(!f)return;
    if(!allowed(f)){
      if(state.mode==="preview"){
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();demoDialog(f,true);return;
      }
      if(f.demo_enabled!==false){
        // O botão principal pode abrir seu submenu para o cliente conhecer a função.
        // Ações, links, downloads e códigos não comprados continuam protegidos.
        if(f.action_kind==="entry"){
          showPurchaseHint(f);
          return;
        }
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
        if(f.action_kind==="link" || f.action_kind==="download") showDemoServer(f);
        else demoDialog(f,false);
        return;
      }
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();blockedDialog(f);return;
    }
    if(state.mode==="test") {
      // Geradores usam a demonstração existente; links e downloads nunca abrem o endereço real.
      if((f.action_kind==="link" || f.action_kind==="download") && f.id!=="config.access") {
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
        showDemoServer(f);
      }
      return;
    }
    if(accountType()==="credits"&&f.credit_mode==="disabled"){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      demoDialog({name:f.name,purchase_enabled:false,purchase_price:0});
      $("jc_demo_title").textContent=f.name+" — desativado para clientes por créditos";
      $("jc_demo_text").textContent="Esta função está desativada na regra geral dos clientes por créditos. O administrador poderá ativá-la depois como gratuita ou definir quantos créditos ela consome.";
      const buy=$("jc_demo_buy");if(buy)buy.style.display="none";
      return;
    }
    if(accountType()==="credits"&&f.credit_mode==="credits"&&Number(f.credit_cost||0)>0){
      // O bypass pertence somente ao elemento clicado. Ele não libera os
      // demais pacotes e existe apenas para repetir o clique após o débito.
      if(state.creditBypass.has(el)){
        state.creditBypass.delete(el);
        const operationId=el.dataset.jcReportOperationId||reportOperationId();
        delete el.dataset.jcReportOperationId;
        dispatchReportAction(el,f,operationId);
        return;
      }
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();consumeCreditAndReplay(el,f);return;
    }
    dispatchReportAction(el,f);
  }
  function demoDialog(f, blockedPreview = false) {
    let m = $("jc_demo_modal");
    if (!m) {
      m = document.createElement("div");
      m.id = "jc_demo_modal";
      m.innerHTML = '<div class="jc-permission-box"><div class="jc-permission-icon">🧪</div><h3 id="jc_demo_title"></h3><p id="jc_demo_text"></p><div class="jc-demo-actions"><button type="button" id="jc_demo_close">Entendi</button><button type="button" id="jc_demo_buy" class="jc-buy-button">Ver valor / comprar</button></div></div>';
      document.body.appendChild(m);
      $("jc_demo_close").onclick = () => m.classList.remove("show");
      m.onclick = (e) => { if (e.target === m) m.classList.remove("show"); };
    }
    $("jc_demo_title").textContent = f.name + (blockedPreview ? " — bloqueado para este cliente" : " — demonstração");
    $("jc_demo_text").textContent = blockedPreview
      ? "No acesso real deste cliente esta função ficará bloqueada. Nesta prévia ela aparece somente como demonstração, sem código válido, download real ou link externo."
      : "Esta ação é demonstrativa. Nenhum download ou link real foi liberado. Você pode consultar o valor e enviar sua escolha pelo WhatsApp.";
    const buy=$("jc_demo_buy");
    const canBuy=Boolean(f.purchase_enabled)||Number(f.purchase_price||0)>0;
    buy.style.display=canBuy?"":"none";
    buy.onclick=()=>{m.classList.remove("show");openPurchaseCenter(f.id);};
    m.classList.add("show");
  }
  function injectStyles() {
    if ($("jc_access_styles")) return;
    const st = document.createElement("style");
    st.id = "jc_access_styles";
    st.textContent = `.jc-function-locked{filter:grayscale(.7)!important;opacity:.58!important;position:relative!important}.jc-function-locked::after{content:' 🔒'}.jc-function-demo{outline:1px dashed rgba(255,191,71,.65)!important}.jc-client-bar{margin:12px auto 16px;padding:12px 14px;border:1px solid rgba(37,211,102,.24);border-radius:16px;background:rgba(5,19,27,.86);display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}.jc-client-info b,.jc-client-info small{display:block}.jc-client-info small{color:#aebbc3;margin-top:3px}.jc-client-actions{display:flex;gap:7px;flex-wrap:wrap}.jc-client-actions button,.jc-client-actions a{padding:9px 11px;border-radius:10px;border:1px solid rgba(255,255,255,.13);background:#163247;color:#fff;text-decoration:none;font-weight:800;cursor:pointer}.jc-client-actions .att{background:#25d366;color:#052117}.jc-client-actions .att-report{background:#1c91ff;color:#fff}.jc-client-actions .logout{background:rgba(255,101,120,.15);color:#ffd6dc}.jc-credit-banner{padding:8px 11px;border-radius:10px;background:rgba(28,145,255,.12);border:1px solid rgba(28,145,255,.35);color:#d8ebff;font-size:11px;font-weight:900}.jc-demo-banner{width:100%;padding:8px;border-radius:10px;background:rgba(255,191,71,.09);border:1px solid rgba(255,191,71,.28);color:#ffe5a5;text-align:center;font-size:11px;font-weight:800}.jc-preview-banner{width:100%;padding:9px;border-radius:10px;background:rgba(28,145,255,.1);border:1px solid rgba(28,145,255,.35);color:#d8ebff;text-align:center;font-size:11px;font-weight:850}.jc-preview-active{outline:2px solid rgba(41,211,145,.75)!important;box-shadow:0 0 0 3px rgba(41,211,145,.08)!important}.jc-preview-blocked{outline:2px dashed rgba(248,188,69,.8)!important;filter:grayscale(.6)!important;opacity:.66!important;position:relative!important}.jc-preview-blocked::after{content:' 🔒 DEMO';font-size:10px!important}.jc-permission-box{width:min(430px,92vw);padding:24px;border-radius:22px;background:#0b1d29;border:1px solid rgba(255,255,255,.13);text-align:center;box-shadow:0 25px 80px rgba(0,0,0,.5)}#jc_permission_modal,#jc_demo_modal{display:none;position:fixed;inset:0;z-index:99999999;align-items:center;justify-content:center;background:rgba(0,0,0,.76);backdrop-filter:blur(8px)}#jc_permission_modal.show,#jc_demo_modal.show{display:flex}.jc-permission-icon{font-size:35px}.jc-permission-box h3{margin:10px 0}.jc-permission-box p{color:#abc0cb;line-height:1.5}.jc-permission-box button{padding:10px 14px;border:0;border-radius:10px;background:#25d366;color:#052117;font-weight:900}.jc-password-modal{display:none;position:fixed;inset:0;z-index:99999999;align-items:center;justify-content:center;background:rgba(0,0,0,.76);padding:10px}.jc-password-modal.show{display:flex}.jc-password-box{width:min(450px,100%);padding:20px;border:1px solid rgba(255,255,255,.13);border-radius:20px;background:#0b1d29}.jc-password-box input{width:100%;padding:11px;margin:6px 0;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:#06131b;color:#fff}.jc-password-box .row{display:flex;gap:7px;margin-top:10px}.jc-password-box button{flex:1;padding:10px;border:0;border-radius:10px;font-weight:800;cursor:pointer}`;
    st.textContent += `.jc-demo-server-modal{display:none;position:fixed;inset:0;z-index:100000000;background:rgba(0,0,0,.82);overflow:auto;padding:18px}.jc-demo-server-modal.show{display:block}.jc-demo-page{position:relative;min-height:calc(100vh - 36px);max-width:1180px;margin:auto;background:#fff;color:#20242a;border-radius:10px;overflow:hidden;box-shadow:0 25px 100px rgba(0,0,0,.55)}.jc-demo-x{position:absolute;right:12px;top:10px;z-index:5;border:0;background:#111;color:#fff;width:38px;height:38px;border-radius:50%;font-size:27px;cursor:pointer}.jc-demo-watermarks{position:absolute;inset:0;pointer-events:none;opacity:.13;background-image:repeating-linear-gradient(-22deg,transparent 0 105px,rgba(0,0,0,.015) 106px 210px);overflow:hidden}.jc-demo-watermarks:after{content:var(--jc-watermark,'DEMONSTRAÇÃO');position:absolute;inset:-30%;font-size:28px;letter-spacing:2px;word-spacing:130px;line-height:180px;transform:rotate(-18deg);white-space:normal;color:#7b8490}.jc-demo-server-main{position:relative;z-index:1;width:min(760px,92%);margin:24px auto 120px}.jc-demo-server-top{min-height:130px;background:linear-gradient(#202020,#303030);border-radius:9px 9px 0 0;display:flex;align-items:center;gap:18px;padding:24px;color:#fff}.jc-demo-file-icon,.jc-demo-file-big{font-size:64px}.jc-demo-top-tools{font-size:28px;flex:1}.jc-demo-download{border:0;border-radius:5px;background:#087cf0;color:#fff;font-weight:900;font-size:16px;padding:25px 48px;cursor:pointer}.jc-demo-server-hint{padding:14px;background:#3b3b3b;color:#eee;text-align:center;border-radius:0 0 9px 9px}.jc-demo-file-card{display:grid;grid-template-columns:64px 1fr 250px;gap:20px;margin-top:55px;align-items:start}.jc-demo-file-name{font-size:24px;font-weight:500}.jc-demo-file-type{font-size:24px;font-weight:900;margin-bottom:32px}.jc-demo-meta{line-height:1.55;font-size:16px}.jc-demo-file-card h4{font-size:18px;margin-bottom:8px}.jc-demo-file-card p{line-height:1.5}.jc-demo-side{background:linear-gradient(135deg,#f4f4f4,#ddd);padding:18px;display:grid;gap:12px}.jc-demo-side b{font-size:18px}.jc-demo-side select{padding:12px;border:0;background:#fff}.jc-demo-fixed-badge{position:absolute;z-index:2;left:22px;bottom:22px;padding:14px 18px;border:1px solid #ccd2d9;border-radius:8px;background:rgba(255,255,255,.94);box-shadow:0 8px 25px rgba(0,0,0,.12)}.jc-demo-fixed-badge b,.jc-demo-fixed-badge small{display:block}.jc-demo-fixed-badge small{margin-top:5px;color:#555}.jc-client-actions .reseller{background:#7b61ff;color:#fff}.jc-client-actions .jc-shop-button{background:#f0a52d;color:#211300}@media(max-width:760px){.jc-demo-server-main{width:94%;margin-top:60px}.jc-demo-server-top{flex-wrap:wrap}.jc-demo-download{width:100%;padding:18px}.jc-demo-file-card{grid-template-columns:48px 1fr}.jc-demo-side{grid-column:1/-1}.jc-demo-file-icon,.jc-demo-file-big{font-size:44px}}`;
    st.textContent += `.jc-client-info{display:flex;align-items:center;gap:10px}.jc-client-info>span:last-child{min-width:0}.jc-client-avatar{width:46px;height:46px;flex:0 0 auto;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:linear-gradient(145deg,#1c91ff,#26d9ff);color:#03121d;font-weight:1000;border:2px solid rgba(255,255,255,.16)}.jc-client-avatar img{width:100%;height:100%;object-fit:cover}.jc-avatar-gate{display:none;position:fixed;inset:0;z-index:100000500;align-items:center;justify-content:center;padding:12px;background:rgba(0,0,0,.88);backdrop-filter:blur(10px)}.jc-avatar-gate.show{display:flex}.jc-avatar-box{width:min(520px,100%);max-height:96vh;overflow:auto;padding:24px;border:1px solid rgba(255,255,255,.14);border-radius:24px;background:linear-gradient(145deg,#0d2535,#071722);color:#fff;box-shadow:0 30px 100px rgba(0,0,0,.65);text-align:center}.jc-avatar-box h2{margin:14px 0 10px;font-size:24px}.jc-avatar-box p{margin:8px 0;color:#b7c9d3;line-height:1.55}.jc-avatar-box .jc-avatar-note{font-size:12px;color:#8fa6b2}.jc-avatar-preview{width:112px;height:112px;margin:auto;border-radius:50%;display:grid;place-items:center;overflow:hidden;background:linear-gradient(145deg,#1c91ff,#26d9ff);color:#03121d;font-size:34px;font-weight:1000;border:4px solid rgba(255,255,255,.15);box-shadow:0 18px 40px rgba(0,0,0,.35)}.jc-avatar-preview img{width:100%;height:100%;object-fit:cover}.jc-avatar-buttons{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:18px}.jc-avatar-buttons button,.jc-avatar-save{border:0;border-radius:12px;padding:12px 13px;font-weight:900;cursor:pointer}.jc-avatar-buttons button{background:#17364a;color:#fff;border:1px solid rgba(255,255,255,.12)}.jc-avatar-save{width:100%;margin-top:10px;background:#25d366;color:#052117}.jc-avatar-save:disabled{opacity:.45;cursor:not-allowed}.jc-avatar-msg{min-height:20px;margin-top:9px;color:#ffd0d7;font-size:12px}@media(max-width:520px){.jc-avatar-box{padding:19px}.jc-avatar-buttons{grid-template-columns:1fr}.jc-avatar-box h2{font-size:21px}.jc-client-info{width:100%}}`;
    document.head.appendChild(st);
  }
  function money(value){return Number(value||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});}
  function actuallyOwned(f){
    if(state.mode==="admin")return true;
    if(state.mode==="test")return false;
    if(state.permissions?.[f.id])return true;
    if(f.action_kind==="entry")return (state.functions||[]).some((x)=>x.group_id===f.group_id&&Boolean(state.permissions?.[x.id]));
    return false;
  }
  function purchasable(){
    return (state.functions||[]).filter((f)=>f.active!==false&&(f.purchase_enabled||Number(f.purchase_price||0)>0)).sort((a,b)=>Number(a.purchase_sort||a.sort_order||0)-Number(b.purchase_sort||b.sort_order||0)||String(a.name).localeCompare(String(b.name),"pt-BR"));
  }
  function showPurchaseHint(f){
    injectMarketStyles();
    let t=$("jc_purchase_hint");
    if(!t){t=document.createElement("button");t.id="jc_purchase_hint";t.className="jc-purchase-hint";document.body.appendChild(t);}
    const value=Number(f.purchase_price||0)>0?money(f.purchase_price):"consulte o valor";
    t.innerHTML=`🧪 Demonstração de <b>${escapeHtml(f.name)}</b> • ${escapeHtml(value)} <span>Ver opções</span>`;
    t.onclick=()=>openPurchaseCenter(f.id);
    t.classList.add("show");clearTimeout(t.__timer);t.__timer=setTimeout(()=>t.classList.remove("show"),6500);
  }
  function installPriceChips(){
    purchasable().forEach((f)=>{
      let els=[];try{els=[...document.querySelectorAll(f.selector||"")]}catch(e){}
      els.forEach((el)=>{
        if(el.querySelector?.(`.jc-price-chip[data-price-id="${CSS.escape(f.id)}"]`))return;
        if(state.mode!=="test"&&actuallyOwned(f))return;
        const chip=document.createElement("span");chip.className="jc-price-chip";chip.dataset.priceId=f.id;
        chip.textContent=(f.is_extra?"Extra + ":"")+ (Number(f.purchase_price||0)>0?money(f.purchase_price):"Valor a definir");
        try{el.appendChild(chip)}catch(e){}
      });
    });
  }
  function injectMarketStyles(){
    if($("jc_market_styles"))return;
    const st=document.createElement("style");st.id="jc_market_styles";st.textContent=`
      .jc-price-chip{display:inline-flex!important;margin-left:8px!important;padding:4px 7px!important;border-radius:999px!important;background:rgba(255,191,71,.15)!important;border:1px solid rgba(255,191,71,.4)!important;color:#ffe5ad!important;font:800 10px Arial!important;letter-spacing:0!important;text-transform:none!important;vertical-align:middle!important;white-space:nowrap!important}
      .jc-purchase-hint{position:fixed;left:50%;bottom:18px;z-index:100000001;transform:translate(-50%,30px);opacity:0;pointer-events:none;max-width:min(720px,94vw);padding:13px 16px;border:1px solid rgba(255,191,71,.45);border-radius:13px;background:#172731;color:#fff;box-shadow:0 18px 60px rgba(0,0,0,.5);transition:.2s;cursor:pointer}.jc-purchase-hint.show{opacity:1;transform:translate(-50%,0);pointer-events:auto}.jc-purchase-hint span{color:#8df0b0;margin-left:8px}
      .jc-market-modal{display:none;position:fixed;inset:0;z-index:100000002;align-items:center;justify-content:center;padding:10px;background:rgba(0,0,0,.82);backdrop-filter:blur(8px)}.jc-market-modal.show{display:flex}.jc-market-box{width:min(780px,100%);max-height:94vh;overflow:auto;border:1px solid rgba(255,255,255,.14);border-radius:22px;background:#091b29;color:#fff;box-shadow:0 30px 100px rgba(0,0,0,.62)}.jc-market-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;background:#091b29;border-bottom:1px solid rgba(255,255,255,.1)}.jc-market-head h3{margin:0}.jc-market-close{border:0;border-radius:10px;padding:9px 12px;background:#833142;color:#fff;font-weight:900;cursor:pointer}.jc-market-body{padding:17px}.jc-market-intro{color:#aebdc5;line-height:1.5;margin:0 0 13px}.jc-market-list{display:grid;gap:10px}.jc-market-item{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:11px;align-items:start;padding:13px;border:1px solid rgba(255,255,255,.11);border-radius:15px;background:rgba(255,255,255,.03)}.jc-market-item.extra{margin-left:24px;border-style:dashed}.jc-market-item.owned{opacity:.72}.jc-market-item input{margin-top:5px;accent-color:#25d366}.jc-market-item strong{display:block}.jc-market-item small{display:block;color:#9eb1bc;line-height:1.4;margin-top:4px}.jc-market-price{font-weight:950;color:#ffe2a4;white-space:nowrap}.jc-market-owned{color:#8df0b0}.jc-market-warning{padding:10px 12px;border-radius:11px;background:rgba(255,191,71,.08);border:1px solid rgba(255,191,71,.25);color:#ffe2a4;font-size:12px;line-height:1.45;margin-top:12px}.jc-market-foot{position:sticky;bottom:0;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 17px;background:#091b29;border-top:1px solid rgba(255,255,255,.1)}.jc-market-total b{font-size:20px}.jc-market-whatsapp{border:0;border-radius:11px;padding:12px 15px;background:#25d366;color:#052117;font-weight:950;cursor:pointer}.jc-market-whatsapp:disabled{opacity:.45;cursor:not-allowed}.jc-demo-actions{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}.jc-buy-button{background:#25d366!important;color:#052117!important}.jc-demo-fixed-badge .jc-demo-buy{display:block;margin-top:9px;width:100%;padding:9px;border:0;border-radius:8px;background:#25d366;color:#052117;font-weight:900;cursor:pointer}@media(max-width:620px){.jc-market-item{grid-template-columns:auto minmax(0,1fr)}.jc-market-price{grid-column:2}.jc-market-item.extra{margin-left:10px}.jc-market-foot{align-items:stretch;flex-direction:column}.jc-market-whatsapp{width:100%}}
    `;document.head.appendChild(st);
  }
  let purchaseFocusId="";
  function openPurchaseCenter(focusId=""){
    injectMarketStyles();purchaseFocusId=focusId||"";
    let m=$("jc_market_modal");
    if(!m){m=document.createElement("div");m.id="jc_market_modal";m.className="jc-market-modal";m.innerHTML='<div class="jc-market-box"><div class="jc-market-head"><div><h3>Funções e valores</h3><small>Escolha o que deseja adquirir</small></div><button class="jc-market-close" type="button">Fechar</button></div><div class="jc-market-body"><p class="jc-market-intro">Funções ainda não liberadas podem ser conhecidas em modo demonstração. Extras dependem da função principal.</p><div class="jc-market-list" id="jc_market_list"></div><div class="jc-market-warning">O pedido não libera nada automaticamente. Depois do pagamento, o administrador ativa somente as funções compradas.</div></div><div class="jc-market-foot"><div class="jc-market-total">Total escolhido<br><b id="jc_market_total">R$ 0,00</b></div><button class="jc-market-whatsapp" id="jc_market_whatsapp" type="button" disabled>💬 Voltar ao WhatsApp e finalizar</button></div></div>';document.body.appendChild(m);m.querySelector('.jc-market-close').onclick=()=>m.classList.remove('show');m.onclick=(e)=>{if(e.target===m)m.classList.remove('show')};$("jc_market_whatsapp").onclick=finishPurchase;}
    renderPurchaseCenter();m.classList.add("show");
  }
  function renderPurchaseCenter(){
    const rows=purchasable(),list=$("jc_market_list");if(!list)return;
    if(!rows.length){list.innerHTML='<div style="padding:18px;text-align:center;color:#9eb1bc">Nenhum valor foi configurado ainda.</div>';$("jc_market_whatsapp").disabled=true;return;}
    const mains=rows.filter((f)=>!f.is_extra),extras=rows.filter((f)=>f.is_extra);
    const html=[];
    mains.forEach((main)=>{
      const owned=actuallyOwned(main);const checked=purchaseFocusId===main.id&&!owned;
      html.push(`<label class="jc-market-item ${owned?'owned':''}"><input type="checkbox" data-buy-id="${escapeHtml(main.id)}" ${owned?'disabled':checked?'checked':''}><div><strong>${escapeHtml(main.purchase_icon||'🧩')} ${escapeHtml(main.name)}</strong><small>${escapeHtml(main.purchase_description||'Função principal do painel.')}</small></div><span class="jc-market-price ${owned?'jc-market-owned':''}">${owned?'Já liberado':Number(main.purchase_price||0)>0?money(main.purchase_price):'Sob consulta'}</span></label>`);
      extras.filter((x)=>x.parent_function_id===main.id).forEach((extra)=>{
        const extraOwned=actuallyOwned(extra);const wantsFocus=purchaseFocusId===extra.id&&!extraOwned;const parentReady=owned||checked||wantsFocus;
        html.push(`<label class="jc-market-item extra ${extraOwned?'owned':''}"><input type="checkbox" data-buy-id="${escapeHtml(extra.id)}" data-parent-id="${escapeHtml(main.id)}" ${extraOwned?'disabled':wantsFocus?'checked':parentReady?'':'disabled'}><div><strong>${escapeHtml(extra.purchase_icon||'➕')} ${escapeHtml(extra.name)}</strong><small>${escapeHtml(extra.purchase_description||'Extra opcional. Só funciona com a função principal.')}</small></div><span class="jc-market-price ${extraOwned?'jc-market-owned':''}">${extraOwned?'Já liberado':Number(extra.purchase_price||0)>0?'+ '+money(extra.purchase_price):'Sob consulta'}</span></label>`);
      });
    });
    // Extras sem pai válido continuam visíveis, mas não podem ser comprados sozinhos.
    extras.filter((x)=>!mains.some((m)=>m.id===x.parent_function_id)).forEach((extra)=>html.push(`<label class="jc-market-item extra"><input type="checkbox" disabled><div><strong>${escapeHtml(extra.name)}</strong><small>Defina a função principal deste extra no painel administrativo.</small></div><span class="jc-market-price">${Number(extra.purchase_price||0)>0?'+ '+money(extra.purchase_price):'Sob consulta'}</span></label>`));
    list.innerHTML=html.join("");
    if(purchaseFocusId){
      const focus=rows.find((x)=>x.id===purchaseFocusId);if(focus?.is_extra&&!actuallyOwned(focus)){const parent=list.querySelector(`[data-buy-id="${CSS.escape(focus.parent_function_id||'')}"]`);if(parent&&!parent.disabled)parent.checked=true;}
    }
    list.querySelectorAll('[data-buy-id]').forEach((ch)=>ch.addEventListener('change',()=>{
      const id=ch.dataset.buyId;
      if(!ch.checked){list.querySelectorAll(`[data-parent-id="${CSS.escape(id)}"]`).forEach((e)=>{e.checked=false;e.disabled=true});}
      else{list.querySelectorAll(`[data-parent-id="${CSS.escape(id)}"]`).forEach((e)=>{if(!actuallyOwned(rows.find((f)=>f.id===e.dataset.buyId)))e.disabled=false});}
      updatePurchaseTotal();
    }));
    updatePurchaseTotal();
  }
  function selectedPurchases(){const rows=purchasable(),ids=[...document.querySelectorAll('#jc_market_list [data-buy-id]:checked')].map((x)=>x.dataset.buyId);return ids.map((id)=>rows.find((x)=>x.id===id)).filter(Boolean);}
  function updatePurchaseTotal(){const selected=selectedPurchases();const total=selected.reduce((sum,x)=>sum+Number(x.purchase_price||0),0);if($("jc_market_total"))$("jc_market_total").textContent=money(total);if($("jc_market_whatsapp"))$("jc_market_whatsapp").disabled=!selected.length;}
  async function finishPurchase(){
    const selected=selectedPurchases();if(!selected.length)return;
    const total=selected.reduce((sum,x)=>sum+Number(x.purchase_price||0),0);
    const payload=selected.map((x)=>({id:x.id,name:x.name,price:Number(x.purchase_price||0),is_extra:Boolean(x.is_extra),parent_function_id:x.parent_function_id||null}));
    try{
      const {data:{session}}=await A.client.auth.getSession();
      if(session) await A.client.rpc("create_function_purchase_request",{p_items:payload,p_total:total,p_source:state.mode==="preview"?"admin_preview":"panel"});
      else if(state.mode==="test"&&state.profile?.username) await A.client.rpc("create_test_function_purchase_request",{p_username:state.profile.username,p_items:payload,p_total:total});
    }catch(e){console.warn("Não foi possível registrar a solicitação",e);}
    const intro=state.mode==="test"?"Olá! Finalizei o teste e escolhi as seguintes funções:":"Olá! Quero adicionar as seguintes funções ao meu painel:";
    const lines=selected.map((x)=>`${x.is_extra?'Extra: ':'• '}${x.name} — ${Number(x.purchase_price||0)>0?money(x.purchase_price):'valor sob consulta'}`);
    const text=[intro,"",...lines,"",`Total: ${money(total)}`,"","Gostaria de finalizar a compra."].join("\n");
    const phone=String(state.general.purchase_whatsapp||state.general.support_phone||"5555997234936").replace(/\D/g,"");
    const url=`https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url,"_blank");
  }
  function injectClientBar() {
    injectStyles();injectMarketStyles();if($("jc_client_bar"))return;const wrapper=document.querySelector(".wrapper")||document.body,bar=document.createElement("div");bar.id="jc_client_bar";bar.className="jc-client-bar";
    const preview=state.mode==="preview",type=accountType();
    const attEnabled=state.mode==="admin"||Boolean(state.permissions["attendant.open"])||Boolean(state.profile.attendant_enabled);
    const attHref=state.mode==="admin"
      ? new URL("painel-atendentes.html",A.rootUrl).href
      : new URL("minha-atendente.html",A.rootUrl).href;
    const attReportsHref=new URL("relatorios-atendente.html",A.rootUrl).href;
    const attLabel=state.mode==="admin"?"Gerenciar atendentes":"Minha Atendente";
    const title=state.mode==="test"?"🧪 Modo de demonstração":preview?"🔎 Pré-teste de "+escapeHtml(state.profile.full_name||state.profile.username):"Olá, "+escapeHtml(state.profile.full_name||state.profile.username);
    const labels={monthly:"Plano mensal",one_time:"Pagamento único — sem mensalidades",credits:"Acesso por créditos",test:"Teste temporário"};const subtitle=state.mode==="admin"?"Administrador":state.mode==="test"?"Acesso visual completo, com códigos fictícios e sem downloads reais":preview?"Verde = liberado • Amarelo = bloqueado em demonstração":labels[type]||escapeHtml(state.profile.plan_name||"Cliente");
    const credit=type==="credits"?`<span class="jc-credit-banner" id="jc_credit_balance">${Number(state.profile.credits_balance||0)} créditos</span>`:"";const reseller=Boolean(state.profile?.is_reseller)&&state.access?.reseller?.enabled!==false&&!preview&&state.mode!=="test"?'<a class="reseller" href="../painel-revenda.html">📊 Minha revenda</a>':"";const expiry=type==="test"&&state.profile.trial_expires_at?" • termina "+new Date(state.profile.trial_expires_at).toLocaleString("pt-BR"):type==="monthly"&&state.profile.expires_at?" • vence "+formatDate(state.profile.expires_at):"";
    const shop=purchasable().length&&state.mode!=="admin"&&!preview?'<button id="jc_open_market" class="jc-shop-button">🛒 Funções e preços</button>':"";
    const attendantActions=attEnabled&&!preview&&state.mode!=="test"
      ? (state.mode==="admin"
          ? `<a class="att" href="${attHref}">🤖 ${attLabel}</a>`
          : `<a class="att-report" href="${attReportsHref}">📊 Relatórios da atendente</a><a class="att" href="${attHref}">🤖 ${attLabel}</a>`)
      : "";
    bar.innerHTML=`<div class="jc-client-info"><span class="jc-client-avatar">${profileAvatarMarkup()}</span><span><b>${title}</b><small>${subtitle}${expiry}</small></span></div><div class="jc-client-actions">${credit}${reseller}${shop}${attendantActions}${state.mode!=="test"&&!preview?'<button id="jc_change_password">Minha senha</button>':""}<button id="jc_logout" class="logout">${preview?"Fechar pré-teste":"Sair"}</button></div>${state.mode==="test"?'<div class="jc-demo-banner">MODO TESTE — o painel abre completo para avaliação, mas links e downloads verdadeiros são bloqueados. Consulte os valores em “Funções e preços”.</div>':""}${preview?'<div class="jc-preview-banner">PRÉ-TESTE ADMINISTRATIVO — confira as funções e depois aprove o acesso no painel.</div>':""}`;
    const header=wrapper.querySelector(".header");if(header)header.insertAdjacentElement("afterend",bar);else wrapper.prepend(bar);
    $("jc_logout").onclick=async()=>{if(preview){window.close();return;}if(A.client)await A.client.auth.signOut();sessionStorage.clear();location.reload();};if($("jc_change_password"))$("jc_change_password").onclick=showPasswordModal;if($("jc_open_market"))$("jc_open_market").onclick=()=>openPurchaseCenter();
    setTimeout(installPriceChips,200);
  }
  function escapeHtml(v) {
    return String(v || "").replace(
      /[&<>"']/g,
      (s) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[s],
    );
  }
  function formatDate(v) {
    const d = new Date(v + "T12:00:00");
    return d.toLocaleDateString("pt-BR");
  }
  function showPasswordModal() {
    injectStyles();
    let m = $("jc_password_modal");
    if (!m) {
      m = document.createElement("div");
      m.id = "jc_password_modal";
      m.className = "jc-password-modal";
      m.innerHTML =
        '<div class="jc-password-box"><h3>Alterar senha do painel</h3><p style="color:#abc0cb">Use pelo menos 8 caracteres. O administrador verá somente que a senha foi alterada e a data, nunca a senha escolhida.</p><input id="jc_new_pass" type="password" placeholder="Nova senha"><input id="jc_new_pass2" type="password" placeholder="Confirmar nova senha"><div class="row"><button id="jc_pass_cancel">Cancelar</button><button id="jc_pass_save" style="background:#25d366;color:#052117">Salvar</button></div><div id="jc_pass_msg" style="margin-top:8px;color:#ff9ca8"></div></div>';
      document.body.appendChild(m);
      $("jc_pass_cancel").onclick = () => m.classList.remove("show");
      $("jc_pass_save").onclick = changePassword;
    }
    m.classList.add("show");
  }
  async function changePassword() {
    const a = $("jc_new_pass").value,
      b = $("jc_new_pass2").value,
      me = $("jc_pass_msg");
    if (a.length < 8)
      return (me.textContent = "A senha precisa ter pelo menos 8 caracteres.");
    if (a !== b) return (me.textContent = "As senhas não conferem.");
    me.textContent = "Salvando...";
    const { error } = await A.client.auth.updateUser({ password: a });
    if (error) return (me.textContent = error.message);
    await A.client.rpc("log_panel_password_change");
    me.style.color = "#8cf0b0";
    me.textContent = "Senha alterada com sucesso.";
    setTimeout(() => $("jc_password_modal").classList.remove("show"), 900);
  }
  async function restore() {
    const preview = readAdminPreview();
    if (preview?.error) {
      msg(preview.error);
      return;
    }
    if (preview) {
      msg("ABRINDO PRÉ-TESTE...", true);
      grant(preview?.profile?.account_type === "test" || preview?.profile?.role === "test" ? "test" : "preview", preview);
      return;
    }
    if (!A.ready) return;
    const trialToken=new URLSearchParams(location.search).get("teste");
    if(trialToken){
      try{const {data,error}=await A.client.rpc("get_trial_access",{p_token:trialToken});if(error)throw error;if(!data?.profile)throw new Error("Este link de teste expirou ou não é válido.");msg("ABRINDO TESTE TEMPORÁRIO...",true);grant("test",data);return;}catch(e){msg(e.message||"Link de teste inválido.");return;}
    }
    const { data: { session } } = await A.client.auth.getSession();
    if (!session) return;
    try {
      const access = await A.myAccess();
      if (access?.profile && !expired(access.profile)) {
        msg("RESTAURANDO ACESSO...", true);
        grant(access.profile.role === "admin" ? "admin" : access.profile.role === "test" ? "test" : "client", access);
      }
    } catch (e) { console.warn(e); }
  }
  document.addEventListener("DOMContentLoaded", () => {
    injectStyles();
    restore();
  });
})();
