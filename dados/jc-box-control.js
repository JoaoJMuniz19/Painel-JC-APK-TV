(function(){
  'use strict';

  const A=window.JC_APP||{};
  const $=id=>document.getElementById(id);
  const $$=selector=>Array.from(document.querySelectorAll(selector));
  const PREVIEW_KEY='jcboxControlPreviewV1';

  const MESSAGE_DEFINITIONS=[
    {key:'billing_available',title:'Mensalidade disponível',message:'Sua mensalidade da JC Launcher está disponível para pagamento.'},
    {key:'billing_overdue',title:'Mensalidade vencida',message:'Sua mensalidade está vencida. Regularize o pagamento para manter os aplicativos contratados liberados.'},
    {key:'billing_apps_blocked',title:'Aplicativos bloqueados',message:'Os aplicativos vinculados à mensalidade foram temporariamente bloqueados. Após a confirmação do pagamento, a liberação poderá ocorrer automaticamente.'},
    {key:'equipment_return',title:'Devolução do equipamento',message:'Este equipamento foi cedido em regime de aluguel ou empréstimo. Caso não deseje continuar com o serviço, entre em contato para combinar a devolução do aparelho.'},
    {key:'equipment_return_blocked',title:'Equipamento aguardando devolução',message:'O uso deste equipamento está temporariamente bloqueado porque foi solicitada a devolução do aparelho cedido em aluguel ou empréstimo. Entre em contato para regularizar ou combinar a entrega.'}
  ];

  const DEMO_DEVICES=[
    {id:'demo-sala',owner_id:'demo-owner',label:'Box Sala',edition:'pro',model:'Android TV 13',android_version:'13',status:'online',blocked:false,configuration_version:5,last_seen_at:new Date().toISOString(),license_status:'active',license_expires_at:new Date(Date.now()+45*864e5).toISOString()},
    {id:'demo-quarto',owner_id:'demo-owner',label:'Box Quarto',edition:'lite',model:'TV Box Lite',android_version:'11',status:'offline',blocked:false,configuration_version:2,last_seen_at:new Date(Date.now()-2*864e5).toISOString(),license_status:'active',license_expires_at:new Date(Date.now()+18*864e5).toISOString()}
  ];

  const state={
    real:false,
    access:null,
    devices:[],
    selected:null,
    filter:'all',
    activeTab:'overview',
    config:null,
    dashboard:null,
    tokenStatus:null,
    commandDashboard:null,
    syncAudit:null,
    automation:null,
    pendingCommand:'',
    lastError:null
  };

  function esc(value){return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));}
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function asArray(value){return Array.isArray(value)?value:[];}
  function bool(value,fallback=false){return typeof value==='boolean'?value:fallback;}
  function number(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback;}
  function money(value){try{return Number(value||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}catch(e){return 'R$ 0,00';}}
  function dateText(value){if(!value)return '—';const d=new Date(value);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('pt-BR');}
  function dateTime(value){if(!value)return '—';const d=new Date(value);return Number.isNaN(d.getTime())?'—':d.toLocaleString('pt-BR');}
  function relativeTime(value){if(!value)return 'Nunca';const d=new Date(value);if(Number.isNaN(d.getTime()))return '—';const diff=Date.now()-d.getTime();if(diff<60000)return 'Agora';if(diff<3600000)return Math.max(1,Math.floor(diff/60000))+' min atrás';if(diff<86400000)return Math.max(1,Math.floor(diff/3600000))+' h atrás';return dateText(value);}
  function monthStart(){const d=new Date();return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1)).toISOString().slice(0,10);}
  function slug(value){return String(value||'app').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,45)||'app';}
  function ownerId(){return state.selected?.owner_id||state.access?.profile?.id||null;}
  function selectedId(){return state.selected?.id||null;}
  function errorText(error){
    const raw=String(error?.message||error||'Erro desconhecido');
    const map={AUTH_REQUIRED:'Faça login novamente.',FORBIDDEN:'Esta conta não tem permissão para esta ação.',DEVICE_NOT_FOUND:'A Box selecionada não foi encontrada.',EQUIPMENT_NOT_FOUND:'Cadastre o equipamento antes de solicitar a devolução.',RETURN_ONLY_FOR_RENTED_OR_LOANED_EQUIPMENT:'A devolução só pode ser solicitada para aparelho alugado ou emprestado.',BILLING_CYCLE_NOT_FOUND:'O ciclo mensal não foi encontrado.'};
    for(const key of Object.keys(map)){if(raw.includes(key))return map[key];}
    return raw;
  }
  function toast(text,type='ok'){if(typeof A.toast==='function')A.toast(text,type);else alert(text);}
  function loading(show,text='Carregando'){const el=$('loadingOverlay');if(!el)return;$('loadingText').textContent=text;el.classList.toggle('show',Boolean(show));}
  function setMode(text,kind){const el=$('modeBadge');el.textContent=text;el.className='mode '+kind;}
  function openModal(id){const el=$(id);if(el)el.classList.add('open');}
  function closeModals(){$$('.modal').forEach(el=>el.classList.remove('open'));}
  function requireSelected(){if(!state.selected){toast('Selecione uma Box.','error');return false;}return true;}

  async function rpc(name,args){
    if(!A.client)throw new Error('Supabase não configurado.');
    const result=await A.client.rpc(name,args||{});
    if(result.error)throw result.error;
    return result.data;
  }

  function buildDemoConfig(device){
    const isSala=device.id==='demo-sala';
    const messages=MESSAGE_DEFINITIONS.map(item=>({owner_id:'demo-owner',template_key:item.key,title:item.title,message:item.message,enabled:true}));
    return {
      ok:true,
      owner_id:'demo-owner',
      device_id:device.id,
      billing_profile:isSala?{
        id:'demo-profile',owner_id:'demo-owner',device_id:device.id,title:'Mensalidade JC Launcher',amount:30,message:'Use o PIX abaixo para regularizar sua mensalidade.',pix_key:'(31) 99999-9999',pix_key_type:'phone',pix_copy_paste:'',qr_code_payload:'',receiver_name:'João da Silva',bank_name:'Banco Digital',account_label:'Conta principal',payment_url:'',whatsapp_contact:'(31) 99760-9439',display_from_day:5,due_day:10,allow_dismiss:true,repeat_monthly:true,enabled:true,reminder_enabled:true,block_after_days:1,automatic_block_mode:'apps_only',auto_release_after_payment:true
      }:null,
      message_templates:messages,
      billing_app_targets:isSala?[
        {id:'demo-app-1',owner_id:'demo-owner',device_id:device.id,package_name:'com.google.android.youtube.tv',app_name:'YouTube',enabled:true,block_on_overdue:true},
        {id:'demo-app-2',owner_id:'demo-owner',device_id:device.id,package_name:'com.netflix.ninja',app_name:'Netflix',enabled:true,block_on_overdue:true}
      ]:[],
      equipment:{id:'demo-equipment',owner_id:'demo-owner',device_id:device.id,equipment_type:'tv_box',ownership_mode:'customer_owned',serial_number:'',asset_tag:'',notes:'',status:'active',return_required:false,launcher_full_block_enabled:false,return_message_template_key:'equipment_return'},
      current_cycle:isSala?{id:'demo-cycle',reference_month:monthStart(),due_date:monthStart().slice(0,8)+'10',amount:30,status:'open',paid_at:null,blocked_at:null}:null,
      cycles:isSala?[{id:'demo-cycle',reference_month:monthStart(),due_date:monthStart().slice(0,8)+'10',amount:30,status:'open',paid_at:null,blocked_at:null}]:[],
      rules:{billing_full_launcher_block:false,billing_block_mode:'apps_only',equipment_full_launcher_block_available:true}
    };
  }

  function useDemo(reason){
    state.real=false;
    state.access={profile:{id:'demo-owner',role:'admin',full_name:'Demonstração'}};
    state.devices=clone(DEMO_DEVICES);
    state.selected=state.devices[0]||null;
    state.config=state.selected?buildDemoConfig(state.selected):null;
    state.dashboard={configured_apps:2,cycles_overdue:0,equipment_return_pending:0,pending_commands:0};
    state.tokenStatus={configured:false,credential:null};
    state.commandDashboard={summary:{total:0,pending:0,completed:0,failed:0},commands:[]};
    state.syncAudit={summary:{total:0,success:0,denied:0,failed:0},history:[]};
    state.automation=null;
    state.lastError=reason||null;
    setMode(reason?'DEMONSTRAÇÃO — SUPABASE INDISPONÍVEL':'DEMONSTRAÇÃO LOCAL',reason?'error':'demo');
    renderAll();
    activateHashTab();
    if(reason)toast('O painel abriu em demonstração: '+reason,'error');
  }

  async function loadDevices(){
    let result=await A.client.from('jc_launcher_devices').select('*,jc_launcher_licenses(status,expires_at,edition,created_at)').order('created_at',{ascending:false});
    if(result.error){
      result=await A.client.from('jc_launcher_devices').select('*').order('created_at',{ascending:false});
    }
    if(result.error)throw result.error;
    return asArray(result.data).map(row=>{
      const licenses=asArray(row.jc_launcher_licenses).slice().sort((a,b)=>new Date(b.created_at||b.expires_at||0)-new Date(a.created_at||a.expires_at||0));
      const license=licenses[0]||{};
      return Object.assign({},row,{
        label:row.label||row.device_name||'TV Box',
        edition:license.edition||row.edition||'lite',
        license_status:license.status||row.license_status||'inactive',
        license_expires_at:license.expires_at||row.license_expires_at||null
      });
    });
  }

  async function load(){
    loading(true,'Carregando JC Box Control');
    try{
      if(!A.client)throw new Error('Supabase não configurado.');
      const access=await A.myAccess();
      if(!access?.profile)throw new Error('Faça login no painel antes de abrir o JC Box Control.');
      const isAdmin=access.profile.role==='admin';
      const permissions=access.permissions||{};
      const allowed=isAdmin||Boolean(permissions['launcher.control.open'])||Boolean(permissions['launcher.open']);
      if(!allowed)throw new Error('O módulo JC Launcher não está liberado para esta conta.');
      state.access=access;
      const previousId=state.selected?.id;
      state.devices=await loadDevices();
      state.real=true;
      state.selected=state.devices.find(item=>item.id===previousId)||state.devices[0]||null;
      setMode('CONECTADO AO SUPABASE','real');
      renderDeviceList();
      if(state.selected)await loadSelectedData();else renderAll();
      activateHashTab();
    }catch(error){
      console.error('JC Box Control:',error);
      useDemo(errorText(error));
    }finally{
      loading(false);
    }
  }

  async function settledRpc(name,args){
    try{return await rpc(name,args);}catch(error){console.warn(name,error);return {__error:errorText(error)};}
  }

  async function loadSelectedData(){
    if(!state.selected){renderAll();return;}
    loading(true,'Carregando configurações da Box');
    const owner=ownerId(),device=selectedId(),isAdmin=state.access?.profile?.role==='admin';
    try{
      const calls=[
        settledRpc('jc_launcher_get_billing_configuration',{p_owner_id:owner,p_device_id:device}),
        settledRpc('jc_launcher_get_billing_dashboard',{p_owner_id:owner}),
        settledRpc('jc_launcher_get_device_sync_token_status',{p_device_id:device,p_owner_id:owner}),
        settledRpc('jc_launcher_get_billing_command_dashboard',{p_owner_id:owner,p_device_id:device,p_limit:50}),
        settledRpc('jc_launcher_get_device_sync_audit',{p_owner_id:owner,p_device_id:device,p_limit:50}),
        isAdmin?settledRpc('jc_launcher_get_billing_automation_status',{p_limit:10}):Promise.resolve(null)
      ];
      const [config,dashboard,tokenStatus,commandDashboard,syncAudit,automation]=await Promise.all(calls);
      state.config=config?.__error?buildDemoConfig(state.selected):config;
      state.dashboard=dashboard?.__error?null:dashboard;
      state.tokenStatus=tokenStatus?.__error?null:tokenStatus;
      state.commandDashboard=commandDashboard?.__error?null:commandDashboard;
      state.syncAudit=syncAudit?.__error?null:syncAudit;
      state.automation=automation?.__error?null:automation;
      renderAll();
    }finally{
      loading(false);
    }
  }

  async function selectDevice(id){
    const found=state.devices.find(item=>String(item.id)===String(id));
    if(!found)return;
    state.selected=found;
    renderDeviceList();
    if(state.real)await loadSelectedData();
    else{
      state.config=buildDemoConfig(found);
      state.dashboard={configured_apps:asArray(state.config.billing_app_targets).length,cycles_overdue:0,equipment_return_pending:0,pending_commands:0};
      renderAll();
    }
  }

  function filteredDevices(){
    return state.devices.filter(device=>{
      if(state.filter==='all')return true;
      if(state.filter==='online')return String(device.status).toLowerCase()==='online';
      return String(device.edition).toLowerCase()===state.filter;
    });
  }

  function renderDeviceList(){
    const list=$('deviceList');
    const devices=filteredDevices();
    list.innerHTML=devices.length?devices.map(device=>{
      const online=String(device.status).toLowerCase()==='online';
      const active=state.selected&&String(state.selected.id)===String(device.id);
      return `<button class="device${active?' active':''}" data-device-id="${esc(device.id)}" type="button"><span class="device-icon">📺</span><span><b>${esc(device.label||device.device_name||'TV Box')}</b><small>${esc(String(device.edition||'lite').toUpperCase())} • ${esc(device.model||device.android_version||'Android TV')}</small></span><span class="pill ${online?'online':'offline'}">${online?'ONLINE':'OFFLINE'}</span></button>`;
    }).join(''):'<div class="empty">Nenhuma Box encontrada neste filtro.</div>';
    list.querySelectorAll('[data-device-id]').forEach(button=>button.addEventListener('click',()=>selectDevice(button.dataset.deviceId)));
  }

  function renderStats(){
    const devices=state.devices;
    $('statDevices').textContent=devices.length;
    $('statOnline').textContent=devices.filter(d=>String(d.status).toLowerCase()==='online').length;
    $('statLite').textContent=devices.filter(d=>String(d.edition).toLowerCase()==='lite').length;
    $('statPro').textContent=devices.filter(d=>String(d.edition).toLowerCase()==='pro').length;
    $('statConfiguredApps').textContent=number(state.dashboard?.configured_apps,asArray(state.config?.billing_app_targets).filter(t=>t.enabled!==false).length);
    $('statOverdue').textContent=number(state.dashboard?.cycles_overdue,0);
    $('statReturns').textContent=number(state.dashboard?.equipment_return_pending,0);
    $('statPendingCommands').textContent=number(state.dashboard?.pending_commands,0);
  }

  function renderHeader(){
    const empty=$('detailEmpty'),detail=$('detail');
    if(!state.selected){empty.style.display='grid';detail.classList.remove('active');return;}
    empty.style.display='none';detail.classList.add('active');
    const d=state.selected,online=String(d.status).toLowerCase()==='online';
    $('detailEdition').textContent=String(d.edition||'lite').toUpperCase();
    $('detailName').textContent=d.label||d.device_name||'TV Box';
    $('detailModel').textContent=d.model||d.device_name||'Android TV';
    $('detailStatus').textContent=online?'ONLINE':'OFFLINE';
    $('detailStatus').className='pill '+(online?'online':'offline');
    $('detailOwner').textContent='Proprietário: '+String(d.owner_id||'—');
    $('detailSeen').textContent=relativeTime(d.last_seen_at);
    $('detailAndroid').textContent=d.android_version||d.api_level||'—';
    $('detailLicense').textContent=String(d.license_status||'inactive').toLowerCase()==='active'?'Ativa':'Inativa';
    $('detailExpires').textContent=dateText(d.license_expires_at);
    $('detailConfigVersion').textContent=number(d.configuration_version,0);
  }

  function equipmentLabel(mode){return mode==='rented'?'ALUGADO':mode==='loaned'?'EMPRESTADO':'PRÓPRIO';}
  function cycleLabel(status){const map={open:'ABERTO',overdue:'VENCIDO',paid:'PAGO',cancelled:'CANCELADO'};return map[String(status||'').toLowerCase()]||String(status||'—').toUpperCase();}
  function cyclePill(status){return status==='paid'?'success':status==='overdue'?'failed':status==='open'?'pending':'info';}

  function renderOverview(){
    if(!state.selected)return;
    const profile=state.config?.billing_profile||null;
    const targets=asArray(state.config?.billing_app_targets).filter(item=>item.enabled!==false&&item.block_on_overdue!==false);
    const cycle=state.config?.current_cycle||null;
    const equipment=state.config?.equipment||null;
    const credential=state.tokenStatus?.credential||null;
    $('summaryBilling').textContent=profile&&profile.enabled!==false?'ON':'OFF';
    $('summaryBillingText').textContent=profile?`${money(profile.amount)} • vence dia ${profile.due_day||10}`:'Não configurada';
    $('summaryApps').textContent=targets.length;
    $('summaryCycle').textContent=cycle?cycleLabel(cycle.status):'—';
    $('summaryCycleText').textContent=cycle?`${dateText(cycle.due_date)} • ${money(cycle.amount)}`:'Sem ciclo neste mês';
    $('summaryEquipment').textContent=equipmentLabel(equipment?.ownership_mode);
    $('summaryEquipmentText').textContent=equipment?.return_required?'Devolução solicitada':'Sem devolução pendente';
    $('summarySync').textContent=state.tokenStatus?.configured?(credential?.status||'ATIVA').toUpperCase():'—';
    $('summarySyncText').textContent=state.tokenStatus?.configured?`Final ${credential?.token_last4||'—'} • último uso ${relativeTime(credential?.last_used_at)}`:'Credencial ainda não emitida';
  }

  function setInput(id,value){const el=$(id);if(el)el.value=value??'';}
  function setCheck(id,value){const el=$(id);if(el)el.checked=Boolean(value);}

  function fillBillingForm(){
    const p=state.config?.billing_profile||{};
    setInput('billingTitle',p.title||'Mensalidade JC Launcher');
    setInput('billingAmount',p.amount==null?'':String(p.amount).replace('.',','));
    setInput('billingWhatsapp',p.whatsapp_contact||'');
    setInput('billingDisplayFrom',p.display_from_day||5);
    setInput('billingDueDay',p.due_day||10);
    setInput('billingBlockAfter',p.block_after_days==null?1:p.block_after_days);
    setInput('billingReceiver',p.receiver_name||'');
    setInput('billingBank',p.bank_name||'');
    setInput('billingAccount',p.account_label||'');
    setInput('billingPixType',p.pix_key_type||'');
    setInput('billingPixKey',p.pix_key||'');
    setInput('billingPixCopy',p.pix_copy_paste||'');
    setInput('billingQrPayload',p.qr_code_payload||'');
    setInput('billingPaymentUrl',p.payment_url||'');
    setInput('billingMessage',p.message||'Sua mensalidade da JC Launcher está disponível para pagamento.');
    setCheck('billingEnabled',p.id?bool(p.enabled,true):false);
    setCheck('billingReminder',p.id?bool(p.reminder_enabled,true):true);
    setCheck('billingAllowDismiss',p.id?bool(p.allow_dismiss,true):true);
    setCheck('billingRepeat',p.id?bool(p.repeat_monthly,true):true);
    setCheck('billingAutoRelease',p.id?bool(p.auto_release_after_payment,true):true);
    renderCycleBox();
  }

  function readBillingForm(){
    return {
      id:state.config?.billing_profile?.id||null,
      owner_id:ownerId(),device_id:selectedId(),
      title:$('billingTitle').value.trim()||'Mensalidade JC Launcher',
      amount:String($('billingAmount').value||'0').trim().replace(',','.'),
      whatsapp_contact:$('billingWhatsapp').value.trim(),
      display_from_day:Math.max(1,Math.min(28,number($('billingDisplayFrom').value,5))),
      due_day:Math.max(1,Math.min(28,number($('billingDueDay').value,10))),
      block_after_days:Math.max(0,Math.min(30,number($('billingBlockAfter').value,1))),
      receiver_name:$('billingReceiver').value.trim(),
      bank_name:$('billingBank').value.trim(),
      account_label:$('billingAccount').value.trim(),
      pix_key_type:$('billingPixType').value,
      pix_key:$('billingPixKey').value.trim(),
      pix_copy_paste:$('billingPixCopy').value.trim(),
      qr_code_payload:$('billingQrPayload').value.trim(),
      payment_url:$('billingPaymentUrl').value.trim(),
      message:$('billingMessage').value.trim()||'Sua mensalidade da JC Launcher está disponível para pagamento.',
      enabled:$('billingEnabled').checked,
      reminder_enabled:$('billingReminder').checked,
      allow_dismiss:$('billingAllowDismiss').checked,
      repeat_monthly:$('billingRepeat').checked,
      auto_release_after_payment:$('billingAutoRelease').checked,
      automatic_block_mode:'apps_only'
    };
  }

  function renderCycleBox(){
    const cycle=state.config?.current_cycle||null;
    if(!cycle){$('cycleTitle').textContent='Ciclo atual: não criado';$('cycleDescription').textContent='A rotina diária criará o ciclo automaticamente; também é possível confirmar o pagamento agora.';$('confirmPaymentBtn').disabled=false;return;}
    $('cycleTitle').textContent=`Ciclo atual: ${cycleLabel(cycle.status)} • ${money(cycle.amount)}`;
    $('cycleDescription').textContent=`Vencimento ${dateText(cycle.due_date)}${cycle.paid_at?' • pago em '+dateTime(cycle.paid_at):''}`;
    $('confirmPaymentBtn').disabled=String(cycle.status).toLowerCase()==='paid';
  }

  function renderApps(){
    const list=$('appTargetList');
    const targets=asArray(state.config?.billing_app_targets);
    if(!targets.length){list.innerHTML='<div class="empty">Nenhum aplicativo vinculado. Sem aplicativos selecionados, a cobrança não bloqueará nada.</div>';return;}
    list.innerHTML=targets.map(target=>{
      const active=target.enabled!==false&&target.block_on_overdue!==false;
      const scope=target.device_id?'Somente esta Box':'Todas as Boxes da conta';
      return `<div class="app-row"><div><b>${esc(target.app_name||target.package_name)}</b><small>${esc(target.package_name)} • ${esc(scope)}</small></div><div class="row-actions"><span class="pill ${active?'success':'offline'}">${active?'ATIVO':'INATIVO'}</span><button class="btn small ghost" data-app-toggle="${esc(target.id)}" type="button">${active?'Desativar':'Ativar'}</button><button class="btn small red" data-app-remove="${esc(target.id)}" type="button">Remover</button></div></div>`;
    }).join('');
    list.querySelectorAll('[data-app-toggle]').forEach(button=>button.addEventListener('click',()=>toggleAppTarget(button.dataset.appToggle)));
    list.querySelectorAll('[data-app-remove]').forEach(button=>button.addEventListener('click',()=>removeAppTarget(button.dataset.appRemove)));
  }

  function messageMap(){const map={};asArray(state.config?.message_templates).forEach(item=>{map[item.template_key]=item;});return map;}

  function fillEquipment(){
    const e=state.config?.equipment||{};
    setInput('equipmentOwnership',e.ownership_mode||'customer_owned');
    setInput('equipmentType',e.equipment_type||'tv_box');
    setInput('equipmentSerial',e.serial_number||'');
    setInput('equipmentAsset',e.asset_tag||'');
    setInput('equipmentNotes',e.notes||'');
    setCheck('equipmentFullBlock',bool(e.launcher_full_block_enabled,false));
    const messages=messageMap();
    setInput('equipmentReturnMessage',messages.equipment_return?.message||MESSAGE_DEFINITIONS.find(x=>x.key==='equipment_return').message);
    setCheck('equipmentRequestBlock',bool(e.launcher_full_block_enabled,false));
    updateEquipmentControls();
    renderEquipmentStatus();
  }

  function updateEquipmentControls(){
    const mode=$('equipmentOwnership').value;
    const ceded=mode==='rented'||mode==='loaned';
    $('equipmentFullBlock').disabled=!ceded;
    if(!ceded)$('equipmentFullBlock').checked=false;
    $('equipmentRequestBlock').disabled=!ceded||!$('equipmentFullBlock').checked;
    if($('equipmentRequestBlock').disabled)$('equipmentRequestBlock').checked=false;
    $('equipmentModeBadge').textContent=equipmentLabel(mode);
  }

  function renderEquipmentStatus(){
    const e=state.config?.equipment||null;
    if(!e){$('equipmentStatusTitle').textContent='Equipamento ainda não cadastrado';$('equipmentStatusText').textContent='Salve o tipo de propriedade para liberar as ações de devolução.';$('equipmentStatusBadge').textContent='NÃO CADASTRADO';$('equipmentStatusBadge').className='pill info';$('requestReturnBtn').disabled=true;$('markReturnedBtn').disabled=true;return;}
    const returnPending=Boolean(e.return_required)&&!e.returned_at;
    $('equipmentStatusTitle').textContent=`${equipmentLabel(e.ownership_mode)} • ${String(e.status||'active').toUpperCase()}`;
    $('equipmentStatusText').textContent=returnPending?`Devolução solicitada em ${dateTime(e.return_requested_at)}${state.selected?.blocked?' • Launcher bloqueada':''}`:'Sem devolução pendente.';
    $('equipmentStatusBadge').textContent=returnPending?'DEVOLUÇÃO PENDENTE':'ATIVO';
    $('equipmentStatusBadge').className='pill '+(returnPending?'failed':'success');
    const ceded=e.ownership_mode==='rented'||e.ownership_mode==='loaned';
    $('requestReturnBtn').disabled=!ceded||returnPending;
    $('markReturnedBtn').disabled=!returnPending;
  }

  function renderMessages(){
    const map=messageMap();
    $('messageList').innerHTML=MESSAGE_DEFINITIONS.map(def=>{
      const item=map[def.key]||def;
      return `<article class="message-card" data-message-key="${esc(def.key)}"><header><div><b>${esc(def.title)}</b><small>${esc(def.key)}</small></div><span class="pill ${item.enabled===false?'offline':'success'}">${item.enabled===false?'DESATIVADA':'ATIVA'}</span></header><div class="form-grid"><div><div class="field"><label>Título</label><input data-message-title value="${esc(item.title||def.title)}"></div><div class="field" style="margin-top:8px"><label>Mensagem</label><textarea data-message-text>${esc(item.message||def.message)}</textarea></div></div><div class="enabled-box"><div class="check-row"><input data-message-enabled id="msg_enabled_${esc(def.key)}" type="checkbox" ${item.enabled===false?'':'checked'}><label for="msg_enabled_${esc(def.key)}">Ativa</label></div><button class="btn small green" data-message-save type="button" style="margin-top:8px;width:100%">Salvar</button></div></div></article>`;
    }).join('');
    $('messageList').querySelectorAll('[data-message-save]').forEach(button=>button.addEventListener('click',()=>saveMessage(button.closest('[data-message-key]'))));
  }

  function renderCycles(){
    const cycles=asArray(state.config?.cycles);
    $('cycleHistory').innerHTML=cycles.length?cycles.map(cycle=>`<div class="timeline-row"><div><b>${dateText(cycle.reference_month)} • ${money(cycle.amount)}</b><small>Vencimento ${dateText(cycle.due_date)}${cycle.paid_at?' • pago '+dateTime(cycle.paid_at):''}</small></div><span class="pill ${cyclePill(cycle.status)}">${esc(cycleLabel(cycle.status))}</span></div>`).join(''):'<div class="empty">Nenhum ciclo mensal registrado.</div>';
  }

  function renderCommands(){
    const commands=asArray(state.commandDashboard?.commands);
    $('commandHistory').innerHTML=commands.length?commands.map(command=>`<div class="timeline-row"><div><b>${esc(command.command_type||'comando')}</b><small>${dateTime(command.created_at)} • tentativas ${number(command.delivery_attempts,0)}</small><code>${esc(JSON.stringify(command.payload||{}))}</code></div><span class="pill ${command.status==='completed'?'success':command.status==='failed'?'failed':'pending'}">${esc(String(command.status||'pending').toUpperCase())}</span></div>`).join(''):'<div class="empty">Nenhum comando de cobrança ou equipamento.</div>';
  }

  function renderAudit(){
    const history=asArray(state.syncAudit?.history);
    $('syncAuditHistory').innerHTML=history.length?history.map(item=>`<div class="timeline-row"><div><b>${esc(String(item.action||'sync').toUpperCase())}</b><small>${dateTime(item.started_at)}${item.error_message?' • '+esc(item.error_message):''}</small></div><span class="pill ${item.status==='success'?'success':item.status==='failed'||item.status==='denied'?'failed':'pending'}">${esc(String(item.status||'running').toUpperCase())}</span></div>`).join(''):'<div class="empty">Nenhuma sincronização registrada. O teste definitivo será feito pelo APK.</div>';
  }

  function renderAutomation(){
    const box=$('automationStatus');
    if(!state.automation){box.innerHTML='<div class="empty">Informação disponível ao ADM quando a função de automação estiver acessível.</div>';return;}
    const job=state.automation.job||null,last=state.automation.last_run||null;
    box.innerHTML=`<div class="timeline-row"><div><b>${job?.active?'ROTINA ATIVA':'ROTINA INATIVA'}</b><small>${job?`Agenda ${esc(job.schedule||'—')} • America/Sao_Paulo`:'Job não encontrado'}</small>${last?`<small>Última execução: ${dateTime(last.started_at)} • ${esc(String(last.status||'—').toUpperCase())}</small>`:''}</div><span class="pill ${job?.active?'success':'failed'}">${job?.active?'ON':'OFF'}</span></div>`;
  }

  function renderAll(){
    renderDeviceList();
    renderStats();
    renderHeader();
    if(!state.selected)return;
    renderOverview();
    fillBillingForm();
    renderApps();
    fillEquipment();
    renderMessages();
    renderCycles();
    renderCommands();
    renderAudit();
    renderAutomation();
    activateTab(state.activeTab,false);
  }

  function activateTab(name,updateHash=true){
    const valid=['overview','billing','apps','equipment','messages','history'];
    const tab=valid.includes(name)?name:'overview';
    state.activeTab=tab;
    $$('[data-tab]').forEach(el=>el.classList.toggle('active',el.dataset.tab===tab));
    $$('[data-pane]').forEach(el=>el.classList.toggle('active',el.dataset.pane===tab));
    if(updateHash){history.replaceState(null,'','#'+tab);}
  }

  function activateHashTab(){const hash=location.hash.replace('#','');if(hash)activateTab(hash,false);}

  function syncPreview(showBilling,billingData){
    if(!state.selected)return;
    const profile=billingData||readBillingForm();
    const defaultApps=[
      {id:'jc',name:'JC APK TV',icon:'JC'},
      {id:'youtube',name:'YouTube',icon:'▶'},
      {id:'netflix',name:'Netflix',icon:'N'},
      {id:'playstore',name:'Play Store',icon:'PS'},
      {id:'files',name:'Arquivos',icon:'FM'},
      {id:'settings',name:'Ajustes',icon:'⚙'}
    ];
    const known=new Set(defaultApps.map(app=>app.name.toLowerCase()));
    asArray(state.config?.billing_app_targets).filter(t=>t.enabled!==false).forEach(target=>{
      const name=target.app_name||target.package_name;
      if(!known.has(String(name).toLowerCase())){defaultApps.push({id:slug(target.package_name),name,icon:String(name).slice(0,2).toUpperCase()});known.add(String(name).toLowerCase());}
    });
    const qr=String(profile.qr_code_payload||'');
    const preview={
      deviceName:state.selected.label||state.selected.device_name||'TV Box',
      edition:state.selected.edition||'pro',
      status:state.selected.status||'offline',
      boxBlocked:Boolean(state.selected.blocked),
      blockReason:state.selected.block_message||'Entre em contato com o responsável para combinar a devolução do equipamento.',
      apps:defaultApps,
      billing:{
        enabled:Boolean(profile.enabled),displayFromDay:number(profile.display_from_day,5),dueDay:number(profile.due_day,10),amount:String(profile.amount||'0').replace('.',','),recipientName:profile.receiver_name||'',pixKey:profile.pix_key||profile.pix_copy_paste||'',accountLabel:[profile.bank_name,profile.account_label].filter(Boolean).join(' • '),qrCodeUrl:/^(https?:|data:image)/i.test(qr)?qr:'',message:profile.message||'',allowDismiss:Boolean(profile.allow_dismiss),repeatMonthly:Boolean(profile.repeat_monthly)
      },
      billingPreview:Boolean(showBilling)
    };
    try{localStorage.setItem(PREVIEW_KEY,JSON.stringify(preview));}catch(e){}
    try{const channel=new BroadcastChannel('jc-box-control');channel.postMessage({type:'state',state:preview});channel.close();}catch(e){}
    if(showBilling)toast('Prévia enviada para a demonstração no início do painel.');
  }

  async function saveBilling(){
    if(!requireSelected())return;
    const payload=readBillingForm();
    loading(true,'Salvando cobrança');
    try{
      if(state.real){await rpc('jc_launcher_save_billing_configuration',{p_payload:payload});await loadSelectedData();}
      else{state.config.billing_profile=Object.assign({id:'demo-profile'},payload);renderAll();}
      syncPreview(false,payload);
      toast('Cobrança salva. O bloqueio permanece limitado aos aplicativos selecionados.');
    }catch(error){toast(errorText(error),'error');}
    finally{loading(false);}
  }

  async function addAppTarget(){
    if(!requireSelected())return;
    const packageName=$('appTargetPackage').value.trim().toLowerCase(),appName=$('appTargetName').value.trim();
    if(!/^[a-z0-9_]+(?:\.[a-z0-9_]+)+$/i.test(packageName)){toast('Digite um nome de pacote válido, por exemplo com.exemplo.app.','error');return;}
    const payload={owner_id:ownerId(),device_id:$('appTargetAllDevices').checked?null:selectedId(),package_name:packageName,app_name:appName||packageName,enabled:true,block_on_overdue:true};
    loading(true,'Salvando aplicativo');
    try{
      if(state.real){await rpc('jc_launcher_save_billing_app_target',{p_payload:payload});await loadSelectedData();}
      else{state.config.billing_app_targets=asArray(state.config.billing_app_targets).filter(t=>!(t.package_name===packageName&&String(t.device_id||'')===String(payload.device_id||''))).concat([Object.assign({id:'demo-'+Date.now()},payload)]);renderAll();}
      $('appTargetName').value='';$('appTargetPackage').value='';toast('Aplicativo incluído na cobrança.');
    }catch(error){toast(errorText(error),'error');}
    finally{loading(false);}
  }

  async function toggleAppTarget(id){
    const target=asArray(state.config?.billing_app_targets).find(item=>String(item.id)===String(id));if(!target)return;
    const payload={owner_id:ownerId(),device_id:target.device_id||null,package_name:target.package_name,app_name:target.app_name,enabled:target.enabled===false,block_on_overdue:true};
    loading(true,'Atualizando aplicativo');
    try{
      if(state.real){await rpc('jc_launcher_save_billing_app_target',{p_payload:payload});await loadSelectedData();}
      else{target.enabled=payload.enabled;renderApps();renderOverview();}
      toast(payload.enabled?'Aplicativo ativado.':'Aplicativo retirado do bloqueio automático.');
    }catch(error){toast(errorText(error),'error');}
    finally{loading(false);}
  }

  async function removeAppTarget(id){
    const target=asArray(state.config?.billing_app_targets).find(item=>String(item.id)===String(id));if(!target)return;
    if(!confirm(`Remover ${target.app_name||target.package_name} da cobrança?`))return;
    loading(true,'Removendo aplicativo');
    try{
      if(state.real){await rpc('jc_launcher_remove_billing_app_target',{p_payload:{owner_id:ownerId(),id:target.id,device_id:target.device_id||null,package_name:target.package_name}});await loadSelectedData();}
      else{state.config.billing_app_targets=asArray(state.config.billing_app_targets).filter(item=>String(item.id)!==String(id));renderAll();}
      toast('Aplicativo removido da cobrança.');
    }catch(error){toast(errorText(error),'error');}
    finally{loading(false);}
  }

  function equipmentPayload(){
    const mode=$('equipmentOwnership').value;
    return {owner_id:ownerId(),device_id:selectedId(),equipment_type:$('equipmentType').value.trim()||'tv_box',ownership_mode:mode,serial_number:$('equipmentSerial').value.trim(),asset_tag:$('equipmentAsset').value.trim(),notes:$('equipmentNotes').value.trim(),launcher_full_block_enabled:(mode==='rented'||mode==='loaned')&&$('equipmentFullBlock').checked,return_message_template_key:'equipment_return'};
  }

  async function saveEquipment(showToast=true){
    if(!requireSelected())return null;
    const payload=equipmentPayload();
    try{
      if(state.real){const data=await rpc('jc_launcher_save_device_equipment',{p_payload:payload});if(showToast)await loadSelectedData();return data;}
      state.config.equipment=Object.assign({id:'demo-equipment',status:'active',return_required:false},payload);if(showToast)renderAll();return {ok:true,equipment:state.config.equipment};
    }catch(error){toast(errorText(error),'error');throw error;}
  }

  async function handleSaveEquipment(){
    loading(true,'Salvando equipamento');
    try{await saveEquipment(true);toast('Equipamento salvo.');}
    catch(e){}
    finally{loading(false);}
  }

  async function requestReturn(){
    if(!requireSelected())return;
    const mode=$('equipmentOwnership').value;
    if(mode!=='rented'&&mode!=='loaned'){toast('A devolução só pode ser solicitada para aparelho alugado ou emprestado.','error');return;}
    const wantsBlock=$('equipmentRequestBlock').checked&&$('equipmentFullBlock').checked;
    const message=$('equipmentReturnMessage').value.trim();
    const warning=wantsBlock?'A Launcher inteira será bloqueada para solicitar a devolução do aparelho cedido. Continuar?':'Será registrada uma solicitação de devolução sem bloquear a Launcher. Continuar?';
    if(!confirm(warning))return;
    loading(true,'Solicitando devolução');
    try{
      await saveEquipment(false);
      if(state.real){await rpc('jc_launcher_request_equipment_return',{p_payload:{owner_id:ownerId(),device_id:selectedId(),message,block_launcher:wantsBlock}});await load();}
      else{state.config.equipment.return_required=true;state.config.equipment.status='return_requested';state.config.equipment.return_requested_at=new Date().toISOString();state.selected.blocked=wantsBlock;state.selected.block_reason=wantsBlock?'equipment_return':null;state.selected.block_message=wantsBlock?message:null;renderAll();}
      syncPreview(false,readBillingForm());
      toast(wantsBlock?'Devolução solicitada e bloqueio de equipamento registrado.':'Devolução solicitada sem bloqueio total.');
    }catch(error){toast(errorText(error),'error');}
    finally{loading(false);}
  }

  async function markReturned(){
    if(!requireSelected()||!confirm('Confirmar que o equipamento foi devolvido? O bloqueio de devolução será retirado.'))return;
    loading(true,'Confirmando devolução');
    try{
      if(state.real){await rpc('jc_launcher_mark_equipment_returned',{p_payload:{owner_id:ownerId(),device_id:selectedId()}});await load();}
      else{state.config.equipment.status='returned';state.config.equipment.return_required=false;state.config.equipment.returned_at=new Date().toISOString();state.selected.blocked=false;state.selected.block_reason=null;state.selected.block_message=null;renderAll();}
      syncPreview(false,readBillingForm());toast('Equipamento marcado como devolvido e bloqueio de devolução retirado.');
    }catch(error){toast(errorText(error),'error');}
    finally{loading(false);}
  }

  async function saveMessage(card){
    if(!requireSelected()||!card)return;
    const key=card.dataset.messageKey,payload={owner_id:ownerId(),template_key:key,title:card.querySelector('[data-message-title]').value.trim(),message:card.querySelector('[data-message-text]').value.trim(),enabled:card.querySelector('[data-message-enabled]').checked};
    if(!payload.message){toast('A mensagem não pode ficar vazia.','error');return;}
    loading(true,'Salvando mensagem');
    try{
      if(state.real){await rpc('jc_launcher_save_message_template',{p_payload:payload});await loadSelectedData();}
      else{const list=asArray(state.config.message_templates),index=list.findIndex(item=>item.template_key===key);if(index>=0)list[index]=Object.assign(list[index],payload);else list.push(Object.assign({id:'demo-'+Date.now()},payload));renderAll();}
      toast('Mensagem salva.');
    }catch(error){toast(errorText(error),'error');}
    finally{loading(false);}
  }

  async function confirmPayment(){
    if(!requireSelected())return;
    const cycle=state.config?.current_cycle||null;
    if(cycle&&String(cycle.status).toLowerCase()==='paid'){toast('Este ciclo já está pago.');return;}
    if(!confirm('Confirmar o pagamento deste mês e gerar a liberação automática dos aplicativos?'))return;
    const reference=prompt('Referência do pagamento (opcional):','')||'';
    loading(true,'Confirmando pagamento');
    try{
      const payload={owner_id:ownerId(),device_id:selectedId(),cycle_id:cycle?.id||null,reference_month:cycle?.reference_month||monthStart(),payment_reference:reference,notes:'Pagamento confirmado pelo JC Box Control'};
      if(state.real){const result=await rpc('jc_launcher_confirm_billing_payment',{p_payload:payload});await loadSelectedData();toast(`Pagamento confirmado. ${number(result?.release_commands,0)} comando(s) de liberação criado(s).`);}
      else{if(!state.config.current_cycle)state.config.current_cycle={id:'demo-cycle',reference_month:monthStart(),due_date:monthStart().slice(0,8)+'10',amount:number(state.config.billing_profile?.amount,0)};state.config.current_cycle.status='paid';state.config.current_cycle.paid_at=new Date().toISOString();state.config.cycles=[state.config.current_cycle];renderAll();toast('Demonstração: pagamento confirmado e aplicativos liberados.');}
    }catch(error){toast(errorText(error),'error');}
    finally{loading(false);}
  }

  async function addDevice(){
    const row={label:$('deviceName').value.trim()||'Nova Box',edition:$('deviceEdition').value,model:$('deviceModel').value.trim()||'Android TV',status:'offline',blocked:false,configuration_version:0,metadata:{created_from:'jc-box-control'}};
    loading(true,'Adicionando Box');
    try{
      if(state.real){row.owner_id=state.access.profile.id;const result=await A.client.from('jc_launcher_devices').insert(row).select().single();if(result.error)throw result.error;closeModals();await load();}
      else{row.id='demo-'+Date.now();row.owner_id='demo-owner';row.license_status='inactive';state.devices.unshift(row);state.selected=row;state.config=buildDemoConfig(row);closeModals();renderAll();}
      toast('Box adicionada. O vínculo final será concluído pelo APK.');
    }catch(error){toast(errorText(error),'error');}
    finally{loading(false);}
  }

  async function saveLicense(){
    if(!requireSelected())return;
    const months=Math.max(1,number($('licenseMonths').value,1)),edition=$('licenseEdition').value;
    loading(true,'Atualizando licença');
    try{
      if(state.real){await rpc('admin_launcher_grant_license',{p_device_id:selectedId(),p_edition:edition,p_months:months});closeModals();await load();}
      else{state.selected.edition=edition;state.selected.license_status='active';state.selected.license_expires_at=new Date(Date.now()+months*30*864e5).toISOString();closeModals();renderAll();}
      toast(`${months} crédito(s) = ${months} mês(es) liberado(s).`);
    }catch(error){toast(errorText(error),'error');}
    finally{loading(false);}
  }

  async function sendCommand(){
    if(!requireSelected()||!state.pendingCommand)return;
    const payload={notes:$('commandPayload').value.trim()};
    loading(true,'Registrando comando');
    try{
      if(state.real){const result=await A.client.from('jc_launcher_commands').insert({owner_id:ownerId(),device_id:selectedId(),command_type:state.pendingCommand,payload,status:'pending',created_by:state.access.profile.id,created_at:new Date().toISOString()});if(result.error)throw result.error;}
      closeModals();$('commandPayload').value='';toast('Comando registrado. A entrega será concluída pelo APK autenticado.');
    }catch(error){toast(errorText(error),'error');}
    finally{loading(false);}
  }

  function bind(){
    $('reloadBtn').addEventListener('click',load);
    $('newDeviceBtn').addEventListener('click',()=>openModal('deviceModal'));
    $('saveDeviceBtn').addEventListener('click',addDevice);
    $('licenseBtn').addEventListener('click',()=>{if(!requireSelected())return;$('licenseEdition').value=state.selected.edition||'lite';openModal('licenseModal');});
    $('saveLicenseBtn').addEventListener('click',saveLicense);
    $('saveBillingBtn').addEventListener('click',saveBilling);
    $('previewBillingBtn').addEventListener('click',()=>syncPreview(true,readBillingForm()));
    $('confirmPaymentBtn').addEventListener('click',confirmPayment);
    $('addAppTargetBtn').addEventListener('click',addAppTarget);
    $('equipmentOwnership').addEventListener('change',updateEquipmentControls);
    $('equipmentFullBlock').addEventListener('change',updateEquipmentControls);
    $('saveEquipmentBtn').addEventListener('click',handleSaveEquipment);
    $('requestReturnBtn').addEventListener('click',requestReturn);
    $('markReturnedBtn').addEventListener('click',markReturned);
    $('refreshHistoryBtn').addEventListener('click',()=>state.real?loadSelectedData():renderAll());
    $('sendCommandBtn').addEventListener('click',sendCommand);
    $$('[data-close]').forEach(button=>button.addEventListener('click',closeModals));
    $$('.modal').forEach(modal=>modal.addEventListener('click',event=>{if(event.target===modal)closeModals();}));
    $$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{state.filter=button.dataset.filter;$$('[data-filter]').forEach(item=>item.classList.toggle('active',item===button));renderDeviceList();}));
    $$('[data-tab]').forEach(button=>button.addEventListener('click',()=>activateTab(button.dataset.tab)));
    $$('[data-open-tab]').forEach(button=>button.addEventListener('click',()=>activateTab(button.dataset.openTab)));
    $$('[data-command]').forEach(button=>button.addEventListener('click',()=>{if(!requireSelected())return;state.pendingCommand=button.dataset.command;$('commandTitle').textContent=button.textContent.trim();openModal('commandModal');}));
    window.addEventListener('hashchange',activateHashTab);
    window.addEventListener('beforeunload',()=>{if(state.selected)syncPreview(false,state.config?.billing_profile||readBillingForm());});
  }

  bind();
  load();
})();
