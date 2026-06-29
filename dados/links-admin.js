(function () {
  "use strict";

  const A = window.JC_APP;
  const $ = (id) => document.getElementById(id);
  const state = { access: null, rows: [], definitions: [], scanFailed: false };

  const EMERGENCY_DEFINITIONS = [
    { id: "suporte_whatsapp", name: "Suporte WhatsApp", group: "Suporte", type: "link", sort: 10 },
    { id: "gerenciador_arquivos", name: "Gerenciador de arquivos", group: "Config", type: "link", sort: 20 },
    { id: "atualizacao_sistema", name: "Limpeza do UniTv S/Formatar", group: "Config", type: "link", sort: 30 },
    { id: "config_individual", name: "Acesse aqui (.config)", group: "Config", type: "link", sort: 40 },
    { id: "unitv_free", name: "Download das versões do APK", group: "Config", type: "link", sort: 50 },
    { id: "ativador_11_digitos", name: "Ativador 11", group: "Ativadores", type: "link", sort: 60 },
    { id: "ativador_16_digitos", name: "Ativador 16", group: "Ativadores", type: "link", sort: 70 },
    { id: "btv_apk", name: "BTV APK", group: "Pacote de APK", type: "link", sort: 80 },
    { id: "stv_apk", name: "STV APK", group: "Pacote de APK", type: "link", sort: 90 },
    { id: "xplus_apk", name: "XPLUS APK", group: "Pacote de APK", type: "link", sort: 100 },
    { id: "eaigo_apk", name: "EAIGO APK", group: "Pacote de APK", type: "link", sort: 110 },
    { id: "config_download_codes", name: "CONFIG — ATIVADOR DOWNLOAD", group: "Códigos de download", type: "code", sort: 210 },
    { id: "rotacao_11", name: "ATIVADOR 11 — DOWNLOAD", group: "Códigos de download", type: "code", sort: 220 },
    { id: "download_16", name: "ATIVADOR 16 — DOWNLOAD", group: "Códigos de download", type: "code", sort: 230 },
    { id: "btv_download_codes", name: "BTV — CÓDIGOS", group: "Pacote de APK", type: "code", sort: 240 },
    { id: "stv_download_codes", name: "STV — CÓDIGOS", group: "Pacote de APK", type: "code", sort: 250 },
    { id: "xplus_download_codes", name: "XPLUS — CÓDIGOS", group: "Pacote de APK", type: "code", sort: 260 },
    { id: "eaigo_download_codes", name: "EAIGO — CÓDIGOS", group: "Pacote de APK", type: "code", sort: 270 },
    { id: "launcher_lite_download_codes", name: "JC Launcher Lite — códigos", group: "JC Launcher Lite / Pro", type: "code", sort: 280 },
    { id: "launcher_pro_download_codes", name: "JC Launcher Pro — códigos", group: "JC Launcher Lite / Pro", type: "code", sort: 290 },
    { id: "launcher_lite_apk", name: "JC Launcher Lite APK", group: "JC Launcher Lite / Pro", type: "link", sort: 380 },
    { id: "launcher_pro_apk", name: "JC Launcher Pro APK", group: "JC Launcher Lite / Pro", type: "link", sort: 390 },
  ];

  const CURRENT_KNOWN_MANAGED_IDS = new Set(EMERGENCY_DEFINITIONS.map((item) => item.id));

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]);
  }
  function uniq(values) { return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))]; }
  function toast(message, type) { if (A?.toast) A.toast(message, type); else alert(message); }
  function rowById(id) { return state.rows.find((row) => String(row.id || "") === String(id || "")) || null; }
  function definitionById(id) { return state.definitions.find((item) => item.id === id) || null; }
  function supportsNamedCodeOptions(id) {
    const definition = definitionById(id);
    const row = rowById(id);
    return definition?.type === "code" || row?.kind === "code_group";
  }
  function showModal(id) { const el = $(id); if (el) { el.classList.add("open"); el.setAttribute("aria-hidden", "false"); } }
  function closeModal(id) { const el = $(id); if (el) { el.classList.remove("open"); el.setAttribute("aria-hidden", "true"); } }

  function itemsOf(row) {
    if (!row) return [];
    const items = Array.isArray(row.items) ? row.items : (() => {
      try { const value = JSON.parse(row.items || "[]"); return Array.isArray(value) ? value : []; } catch (_) { return []; }
    })();
    const output = items.map((value) => String(value || "").trim()).filter(Boolean);
    const direct = String(row.value || "").trim();
    if (row.kind === "direct" && direct && !output.includes(direct)) output.unshift(direct);
    return output;
  }

  function normalizedLabel(element, fallback) {
    return String(element.getAttribute("data-jc-link-name") || element.getAttribute("data-jc-function-name") || fallback || element.textContent || "")
      .replace(/\s+/g, " ").trim().slice(0, 120);
  }

  function definitionsFromDocument(doc) {
    const map = new Map();
    doc.querySelectorAll("[data-jc-link-id]").forEach((element, index) => {
      const id = String(element.getAttribute("data-jc-link-id") || "").trim();
      if (!id || map.has("link:" + id)) return;
      map.set("link:" + id, {
        id,
        name: normalizedLabel(element, id),
        group: String(element.getAttribute("data-jc-function-category") || "Links de download"),
        type: "link",
        sort: 100 + index,
      });
    });
    doc.querySelectorAll('[data-jc-action="generate-code"][data-jc-code-group]').forEach((element, index) => {
      const id = String(element.getAttribute("data-jc-code-group") || "").trim();
      if (!id || map.has("code:" + id)) return;
      map.set("code:" + id, {
        id,
        name: normalizedLabel(element, id),
        group: String(element.getAttribute("data-jc-function-category") || "Códigos de download"),
        type: "code",
        sort: 500 + index,
      });
    });
    doc.querySelectorAll('[data-jc-action="generate-package-code"][data-jc-package]').forEach((element, index) => {
      const slug = String(element.getAttribute("data-jc-package") || "").trim();
      if (!slug) return;
      const id = slug + "_download_codes";
      if (map.has("code:" + id)) return;
      map.set("code:" + id, {
        id,
        name: normalizedLabel(element, slug.toUpperCase() + " — CÓDIGOS"),
        group: String(element.getAttribute("data-jc-function-category") || "Pacote de APK"),
        type: "code",
        sort: 600 + index,
      });
    });
    return [...map.values()].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));
  }

  async function readHtmlDefinitions() {
    try {
      const response = await fetch("geradores/index.html?jc-link-scan=" + Date.now(), { cache: "no-store" });
      if (!response.ok) throw new Error("Não foi possível ler geradores/index.html.");
      const text = await response.text();
      const doc = new DOMParser().parseFromString(text, "text/html");
      const definitions = definitionsFromDocument(doc);
      if (!definitions.length) throw new Error("O HTML foi lido, mas nenhuma configuração estrutural foi encontrada.");
      state.scanFailed = false;
      return definitions;
    } catch (error) {
      console.warn("JC-APK: leitura estrutural falhou; usando lista de emergência sem desativar dados.", error);
      state.scanFailed = true;
      return EMERGENCY_DEFINITIONS.map((item) => ({ ...item }));
    }
  }

  async function fetchRows() {
    const { data, error } = await A.client.from("links_catalog").select("*").order("sort_order", { ascending: true }).order("name", { ascending: true });
    if (error) throw error;
    state.rows = data || [];
  }

  function emptyRowFor(definition) {
    return {
      id: definition.id,
      group_id: definition.type === "code" ? "download_codes" : "html_buttons",
      group_name: definition.group || (definition.type === "code" ? "Códigos de download" : "Botões do HTML"),
      name: definition.name || definition.id,
      kind: definition.type === "code" ? "code_group" : "link_group",
      value: null,
      items: [],
      active: false,
      sort_order: Number(definition.sort || 900),
    };
  }

  function isManagedRow(row) {
    const id = String(row.id || "");
    return CURRENT_KNOWN_MANAGED_IDS.has(id)
      || String(row.group_id || "") === "html_buttons"
      || /^extra_(?:link|code)__/.test(id)
      || /_apk$/.test(id)
      || /_download_codes$/.test(id);
  }

  async function synchronizeDefinitions(definitions, allowDeactivate) {
    const existing = new Map(state.rows.map((row) => [String(row.id), row]));
    const missing = definitions.filter((definition) => !existing.has(definition.id));
    if (missing.length) {
      const { error } = await A.client.from("links_catalog").upsert(missing.map(emptyRowFor), { onConflict: "id" });
      if (error) throw error;
    }

    let deactivated = 0;
    if (allowDeactivate) {
      const found = new Set(definitions.map((definition) => definition.id));
      const removed = state.rows.filter((row) => row.active !== false && isManagedRow(row) && !found.has(String(row.id)));
      for (const row of removed) {
        const { error } = await A.client.from("links_catalog").update({ active: false }).eq("id", row.id);
        if (error) throw error;
        deactivated += 1;
      }
    }
    return { created: missing.length, deactivated };
  }

  async function scanAndSync() {
    await fetchRows();
    const definitions = await readHtmlDefinitions();
    const result = await synchronizeDefinitions(definitions, !state.scanFailed);
    state.definitions = definitions;
    await fetchRows();
    return { ...result, found: definitions.length, emergency: state.scanFailed };
  }

  async function loadAll(sync) {
    if (sync) await scanAndSync();
    else {
      await fetchRows();
      state.definitions = await readHtmlDefinitions();
    }
    renderAll();
  }

  function summary(row, type) {
    const items = itemsOf(row);
    const testCount = type === "link" ? items.filter((item) => /(?:^|\s|[-_])(teste|test)(?:$|\s|[-_])/i.test(String(item).split("|")[0])).length : 0;
    return {
      count: items.length,
      preview: items[0] || "Configuração vazia",
      testCount,
      active: Boolean(row?.active && items.length),
    };
  }

  function tile(definition, row, context) {
    const info = summary(row, definition.type);
    const badge = !row ? "Nova" : info.active ? "Ativo" : "Inativo";
    const test = info.testCount ? `<span class="pill">${info.testCount} versão(ões) de teste</span>` : "";
    return `<article class="tile"><div class="tile-title"><h5>${esc(definition.name)}</h5><span class="tag">${badge}</span></div><div class="desc">ID: ${esc(definition.id)}<br>${esc(definition.group || "")}</div><div class="meta"><span class="pill">${info.count} item(ns)</span>${test}</div><div class="desc">${esc(info.preview)}</div><div class="tile-actions"><button class="btn blue" data-edit-standard="${esc(definition.id)}" data-context="${esc(context || definition.type)}">Editar configuração</button></div></article>`;
  }

  function renderAll() {
    const codeDefs = state.definitions.filter((item) => item.type === "code");
    const packageCodes = codeDefs.filter((item) => item.group === "Pacote de APK");
    const simpleCodes = codeDefs.filter((item) => item.group !== "Pacote de APK");
    const linkDefs = state.definitions.filter((item) => item.type === "link");

    $("simpleCodesGrid").innerHTML = simpleCodes.length ? simpleCodes.map((item) => tile(item, rowById(item.id), "code")).join("") : '<div class="empty">Nenhum gerador de código foi encontrado no HTML.</div>';
    $("extraCodesGrid").innerHTML = packageCodes.length ? packageCodes.map((item) => tile(item, rowById(item.id), "code")).join("") : '<div class="empty">Nenhum pacote APK foi encontrado no HTML.</div>';
    $("downloadLinksGrid").innerHTML = linkDefs.length ? linkDefs.map((item) => tile(item, rowById(item.id), "link")).join("") : '<div class="empty">Nenhum botão de link foi encontrado no HTML.</div>';

    const foundIds = new Set(state.definitions.map((item) => item.id));
    const historical = state.rows.filter((row) => isManagedRow(row) && !foundIds.has(String(row.id)));
    $("otherLinksGrid").innerHTML = historical.length ? historical.map((row) => tile({ id: row.id, name: row.name || row.id, group: "Removido do HTML", type: row.kind === "code_group" ? "code" : "link" }, row, row.kind === "code_group" ? "code" : "link")).join("") : '<div class="empty">Nenhuma configuração removida do HTML.</div>';

    document.querySelectorAll("[data-edit-standard]").forEach((button) => button.addEventListener("click", () => openEditor(button.dataset.editStandard, button.dataset.context)));
  }

  function editorText(context, id) {
    if (context === "code") {
      if (supportsNamedCodeOptions(id)) return {
        label: "Códigos ou opções — um por linha",
        placeholder: "8626721\n9531840\n\nou\n(VOD) | 8626721\n(LIVE) | 9531840",
        help: "Esta regra vale para todos os grupos de códigos atuais e futuros. Somente números usam rotação aleatória e exibem um código por clique. Use Nome | Código em todas as linhas para criar opções; uma opção vai direto e duas ou mais abrem o seletor.",
      };
      return {
        label: "Códigos — um por linha",
        placeholder: "1234567\n7654321",
        help: "Somente números. O sistema mostra um código por clique e alterna aleatoriamente entre os cadastrados.",
      };
    }
    return {
      label: "Opções — uma por linha",
      placeholder: "Nome ou versão | https://exemplo.com/arquivo.apk\nVersão teste | https://exemplo.com/teste.apk",
      help: "Uma opção abre diretamente. Duas ou mais abrem o seletor. Nomes contendo “teste” recebem o selo VERSÃO DE TESTE.",
    };
  }

  function openEditor(id, context) {
    const row = rowById(id);
    const definition = definitionById(id) || { id, name: row?.name || id, group: row?.group_name || "Histórico", type: context };
    const copy = editorText(context, id);
    $("editorId").value = id;
    $("editorKind").value = context;
    $("editorContext").value = state.definitions.some((item) => item.id === id) ? "standard" : "historical";
    $("editorTitle").textContent = definition.name;
    $("editorNameField").classList.add("hidden");
    $("editorModeField").classList.add("hidden");
    $("editorItems").value = itemsOf(row).join("\n");
    $("editorItems").placeholder = copy.placeholder;
    $("editorItemsLabel").textContent = copy.label;
    $("editorItemsHelp").textContent = copy.help;
    $("editorModeHelp").innerHTML = context === "link"
      ? "Todos os botões de download usam a mesma regra: <strong>1 opção abre direto; 2 ou mais abrem o seletor.</strong>"
      : supportsNamedCodeOptions(id)
        ? "<strong>Regra universal:</strong> sem |, os códigos entram em rotação aleatória. Com <strong>Nome | Código</strong>, uma opção vai direto e duas ou mais abrem o seletor. Vale para CONFIG download, Ativadores download, Extras e futuros grupos. Não misture formatos."
        : "Os códigos numéricos são mostrados um por clique, em rotação aleatória, sem abrir seletor.";
    $("editorActive").checked = row ? row.active !== false : false;
    $("deleteEditorBtn").classList.toggle("hidden", !row);
    showModal("editorModal");
  }

  async function saveEditor() {
    const id = $("editorId").value.trim();
    const context = $("editorKind").value;
    const definition = definitionById(id);
    const old = rowById(id);
    if (!id) throw new Error("Identificador inválido.");
    let items = uniq($("editorItems").value.split(/\r?\n/));
    if (context === "code") {
      const packageMode = supportsNamedCodeOptions(id);
      const labeledCount = items.filter((value) => value.includes("|")).length;
      if (packageMode && labeledCount > 0) {
        if (labeledCount !== items.length) {
          throw new Error("Não misture códigos simples com Nome | Código. Use um único formato nesta configuração.");
        }
        items = items.map((value) => {
          const separator = value.indexOf("|");
          const label = value.slice(0, separator).trim();
          const code = value.slice(separator + 1).trim();
          if (!label) throw new Error("Informe o nome antes de |. Exemplo: (VOD) | 8626721");
          if (!/^\d+$/.test(code)) throw new Error("Depois de | use somente o código numérico. Revise: " + value);
          return `${label} | ${code}`;
        });
      } else {
        const invalid = items.find((value) => !/^\d+$/.test(value));
        if (invalid) {
          const message = packageMode
            ? "Use somente números ou o formato Nome | Código em todas as linhas. Revise: "
            : "Os códigos aceitam somente números. Revise: ";
          throw new Error(message + invalid);
        }
      }
    } else {
      const invalid = items.find((value) => {
        const separator = value.indexOf("|");
        const url = separator >= 0 ? value.slice(separator + 1).trim() : value.trim();
        return !/^(https?:|intent:|market:|mailto:|tel:)/i.test(url);
      });
      if (invalid) throw new Error("Use o formato Nome ou versão | URL. Revise: " + invalid);
    }
    const active = $("editorActive").checked && items.length > 0;
    const row = {
      id,
      group_id: old?.group_id || (context === "code" ? "download_codes" : "html_buttons"),
      group_name: old?.group_name || definition?.group || (context === "code" ? "Códigos de download" : "Botões do HTML"),
      name: old?.name || definition?.name || id,
      kind: context === "code" ? "code_group" : "link_group",
      value: null,
      items,
      active,
      sort_order: Number(old?.sort_order || definition?.sort || 900),
    };
    const { error } = await A.client.from("links_catalog").upsert(row, { onConflict: "id" });
    if (error) throw error;
    closeModal("editorModal");
    toast(items.length ? "Configuração salva no Supabase." : "Configuração mantida vazia e inativa.");
    await loadAll(false);
  }

  async function deactivateEditor() {
    const id = $("editorId").value.trim();
    if (!id || !confirm("Desativar esta configuração sem apagar os dados salvos?")) return;
    const { error } = await A.client.from("links_catalog").update({ active: false }).eq("id", id);
    if (error) throw error;
    closeModal("editorModal");
    toast("Configuração desativada. Nenhum dado foi apagado.");
    await loadAll(false);
  }

  async function login(event) {
    event.preventDefault();
    $("loginMsg").textContent = "Entrando...";
    try {
      if (!A?.ready) throw new Error("Configure a conexão do Supabase em dados/supabase-config.js.");
      await A.login($("loginUser").value, $("loginPass").value);
      const access = await A.myAccess();
      if (access?.profile?.role !== "admin") throw new Error("Acesso exclusivo do administrador.");
      state.access = access;
      showApp();
      await loadAll(true);
    } catch (error) {
      $("loginMsg").textContent = error.message || "Não foi possível entrar.";
    }
  }

  function showApp() {
    $("loginView").classList.add("hidden");
    $("appView").classList.remove("hidden");
    $("logoutBtn").classList.remove("hidden");
    $("topStatus").textContent = "Administrador: " + (state.access?.profile?.full_name || state.access?.profile?.username || "ADM");
  }

  async function restore() {
    if (!A?.ready) return;
    const { data: { session } } = await A.client.auth.getSession();
    if (!session) return;
    try {
      const access = await A.myAccess();
      if (access?.profile?.role === "admin") {
        state.access = access;
        showApp();
        await loadAll(true);
      }
    } catch (error) { console.warn(error); }
  }

  function paintConnection(text, ok) {
    const el = $("connectionStatus");
    el.classList.remove("hidden");
    el.textContent = text;
    el.style.borderColor = ok ? "rgba(43,211,145,.35)" : "rgba(255,101,120,.38)";
    el.style.background = ok ? "rgba(43,211,145,.09)" : "rgba(255,101,120,.09)";
    el.style.color = ok ? "#dcffed" : "#ffd5dc";
  }

  document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => closeModal(button.dataset.close)));
  document.querySelectorAll(".modal").forEach((modal) => modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(modal.id); }));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") document.querySelectorAll(".modal.open").forEach((modal) => closeModal(modal.id)); });

  $("loginForm").addEventListener("submit", login);
  $("logoutBtn").addEventListener("click", async () => { await A.client.auth.signOut(); location.reload(); });
  $("testConnectionBtn").addEventListener("click", async () => {
    paintConnection("Testando conexão...", true);
    $("testConnectionBtn").disabled = true;
    try { const result = await A.testConnection(); paintConnection(`Conexão confirmada em ${result.elapsed} ms.`, true); }
    catch (error) { paintConnection(error.message || "Não foi possível conectar.", false); }
    finally { $("testConnectionBtn").disabled = false; }
  });
  $("saveEditorBtn").addEventListener("click", () => saveEditor().catch((error) => toast(error.message, "error")));
  $("deleteEditorBtn").addEventListener("click", () => deactivateEditor().catch((error) => toast(error.message, "error")));
  $("syncButtonsBtn").addEventListener("click", async () => {
    $("syncButtonsBtn").disabled = true;
    try {
      const result = await scanAndSync();
      renderAll();
      const suffix = result.emergency ? " A lista de emergência foi usada; nenhum item existente foi desativado." : " Botões removidos foram apenas desativados, sem apagar dados.";
      toast(`${result.found} configuração(ões) reconhecida(s), ${result.created} nova(s) vazia(s) e ${result.deactivated} desativada(s).${suffix}`);
    } catch (error) { toast(error.message, "error"); }
    finally { $("syncButtonsBtn").disabled = false; }
  });
  $("reloadBtn").addEventListener("click", () => loadAll(false).then(() => toast("Dados atualizados.")).catch((error) => toast(error.message, "error")));

  // Recursos antigos de opções separadas deixam de criar linhas paralelas.
  $("newOtherLinkBtn")?.classList.add("hidden");
  $("newOptionBtn")?.classList.add("hidden");
  $("optionsModal")?.setAttribute("aria-hidden", "true");
  $("optionEditorModal")?.setAttribute("aria-hidden", "true");

  restore();
})();
