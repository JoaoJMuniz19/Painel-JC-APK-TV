(function(){
  'use strict';
  const A=window.JC_APP;
  const DEFAULT_MESSAGE='Estamos trabalhando o mais rápido possível para atualizar esta função e trazer melhorias. Agradecemos pela compreensão. Tente novamente mais tarde.';
  const state={statuses:new Map(),loaded:false};

  function escapeHtml(value){
    return String(value||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});
  }

  function injectStyles(){
    if(document.getElementById('jc-panel-maintenance-style'))return;
    const style=document.createElement('style');
    style.id='jc-panel-maintenance-style';
    style.textContent=`
      .jc-panel-maintenance{position:relative!important;filter:grayscale(.32)!important;cursor:not-allowed!important;box-shadow:0 0 0 2px rgba(255,191,71,.34),0 12px 28px rgba(0,0,0,.3)!important}
      .jc-panel-maintenance::after{content:'MANUTENÇÃO';position:absolute;right:8px;top:8px;z-index:5;padding:4px 7px;border-radius:999px;background:#ffbf47;color:#261800;font-size:9px;font-weight:1000;letter-spacing:.05em;pointer-events:none}
      #jc-panel-maintenance-modal{display:none;position:fixed;inset:0;z-index:2147483600;align-items:center;justify-content:center;padding:14px;background:rgba(0,0,0,.78);backdrop-filter:blur(8px)}
      #jc-panel-maintenance-modal.show{display:flex}
      .jc-panel-maintenance-box{width:min(460px,100%);padding:24px;border:1px solid rgba(255,191,71,.35);border-radius:22px;background:linear-gradient(145deg,#102638,#071721);color:#fff;text-align:center;box-shadow:0 28px 90px rgba(0,0,0,.62)}
      .jc-panel-maintenance-box .icon{font-size:42px}.jc-panel-maintenance-box h3{margin:10px 0 8px;font-size:23px}.jc-panel-maintenance-box p{margin:0;color:#c6d6df;line-height:1.6}
      .jc-panel-maintenance-box button{margin-top:18px;padding:11px 18px;border:0;border-radius:11px;background:#29d391;color:#052117;font-weight:1000;cursor:pointer}
    `;
    document.head.appendChild(style);
  }

  function getLabelElement(el){
    return el.querySelector('[data-jc-button-label],.btn-title,.brand-text')||el;
  }

  function applyMaintenance(el,config){
    const label=getLabelElement(el);
    if(!el.dataset.jcMaintenanceApplied){
      el.dataset.jcMaintenanceApplied='1';
      el.dataset.jcMaintenanceOriginalLabel=label.textContent||'';
      el.dataset.jcMaintenanceOriginalTitle=el.getAttribute('title')||'';
      el.dataset.jcMaintenanceOriginalAriaDisabled=el.getAttribute('aria-disabled')||'';
    }
    el.classList.add('jc-panel-maintenance');
    el.setAttribute('aria-disabled','true');
    el.setAttribute('title','Função temporariamente em manutenção');
    label.textContent='🛠️ EM MANUTENÇÃO';
    el.dataset.jcMaintenanceMessage=config.message||DEFAULT_MESSAGE;
    el.dataset.jcMaintenanceFunctionName=config.name||el.dataset.jcFunctionName||'Função';
  }

  function restoreActive(el){
    if(!el.dataset.jcMaintenanceApplied)return;
    const label=getLabelElement(el);
    label.textContent=el.dataset.jcMaintenanceOriginalLabel||label.textContent;
    const oldTitle=el.dataset.jcMaintenanceOriginalTitle||'';
    if(oldTitle)el.setAttribute('title',oldTitle);else el.removeAttribute('title');
    const oldAria=el.dataset.jcMaintenanceOriginalAriaDisabled||'';
    if(oldAria)el.setAttribute('aria-disabled',oldAria);else el.removeAttribute('aria-disabled');
    el.classList.remove('jc-panel-maintenance');
    delete el.dataset.jcMaintenanceApplied;
    delete el.dataset.jcMaintenanceOriginalLabel;
    delete el.dataset.jcMaintenanceOriginalTitle;
    delete el.dataset.jcMaintenanceOriginalAriaDisabled;
    delete el.dataset.jcMaintenanceMessage;
    delete el.dataset.jcMaintenanceFunctionName;
  }

  function applyPanelButtonStatuses(){
    injectStyles();
    document.querySelectorAll('[data-jc-function-id]').forEach(function(el){
      const config=state.statuses.get(el.dataset.jcFunctionId);
      if(config&&config.status==='maintenance')applyMaintenance(el,config);else restoreActive(el);
    });
  }

  function ensureModal(){
    let modal=document.getElementById('jc-panel-maintenance-modal');
    if(modal)return modal;
    modal=document.createElement('section');
    modal.id='jc-panel-maintenance-modal';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.innerHTML='<div class="jc-panel-maintenance-box"><div class="icon">🛠️</div><h3 id="jc-panel-maintenance-title">Função em manutenção</h3><p id="jc-panel-maintenance-message"></p><button type="button" id="jc-panel-maintenance-close">Entendi</button></div>';
    document.body.appendChild(modal);
    modal.querySelector('#jc-panel-maintenance-close').onclick=function(){modal.classList.remove('show');};
    modal.onclick=function(e){if(e.target===modal)modal.classList.remove('show');};
    return modal;
  }

  function showPanelButtonMaintenanceMessage(config){
    injectStyles();
    const modal=ensureModal();
    modal.querySelector('#jc-panel-maintenance-title').textContent=(config&&config.name?config.name+' — ':'')+'Em manutenção';
    modal.querySelector('#jc-panel-maintenance-message').textContent=(config&&config.message)||DEFAULT_MESSAGE;
    modal.classList.add('show');
  }

  async function loadPanelButtonStatuses(){
    if(!A||!A.client)return;
    try{
      const result=await A.client.rpc('get_panel_button_statuses');
      if(result.error)throw result.error;
      const rows=Array.isArray(result.data)?result.data:(result.data&&result.data.buttons)||[];
      state.statuses=new Map(rows.map(function(row){return [String(row.id),{status:String(row.status||row.panel_status||'active'),message:String(row.message||row.maintenance_message||''),name:String(row.name||'')}];}));
      state.loaded=true;
      applyPanelButtonStatuses();
    }catch(error){
      state.loaded=false;
      console.warn('[Gerenciador de Botões] Status administrativo ainda não disponível:',error.message||error);
    }
  }

  document.addEventListener('click',function(event){
    const el=event.target.closest('[data-jc-function-id]');
    if(!el)return;
    const config=state.statuses.get(el.dataset.jcFunctionId);
    if(!config||config.status!=='maintenance')return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    showPanelButtonMaintenanceMessage(config);
  },true);

  document.addEventListener('jc:access-ready',function(){loadPanelButtonStatuses();});
  window.addEventListener('jc-links-loaded',applyPanelButtonStatuses);
  window.JC_PANEL_BUTTON_RUNTIME={loadPanelButtonStatuses,applyPanelButtonStatuses,showPanelButtonMaintenanceMessage};
})();
