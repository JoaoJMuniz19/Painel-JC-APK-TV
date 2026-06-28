(function(){
'use strict';

const queues={};
let originalGenerate16=null;
function cssEscape(value){if(window.CSS&&typeof window.CSS.escape==='function')return window.CSS.escape(String(value));return String(value).replace(/[^a-zA-Z0-9_-]/g,'\\$&');}

function isTest(){
  try{return String(sessionStorage.getItem('jc_apk_tipo_usuario')||'').toLowerCase()==='teste';}catch(e){return false;}
}
function digitsDemo(){const d=()=>String(Math.floor(Math.random()*10));return d()+'X'+d()+d()+'X'+d()+d();}
function cleanCodes(values){return Array.isArray(values)?values.map(v=>String(v||'').trim()).filter(v=>/^\d+$/.test(v)):[];}
function shuffle(values){const copy=values.slice();for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
function pick(config,key){
  const codes=cleanCodes(config&&config.codes);if(!codes.length)return '';
  if((config&&config.mode)!=='random'||codes.length===1)return codes[0];
  const signature=codes.join('\u001f');
  if(!queues[key]||queues[key].signature!==signature||!queues[key].values.length)queues[key]={signature,values:shuffle(codes)};
  return queues[key].values.pop()||codes[0];
}
function copyText(text){
  if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(text);
  return new Promise((resolve,reject)=>{try{const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();resolve();}catch(error){reject(error);}});
}
function simpleConfig(type){
  const source=window.JC_SIMPLE_DOWNLOAD_CODES||{};return source[type]||{mode:'unique',codes:[]};
}
function setText(id,value){const el=document.getElementById(id);if(el){el.textContent=value||'';el.dataset.codigoAtual=value||'';}return el;}
function setStatus(id,message,ok){const el=document.getElementById(id);if(el){el.textContent=message||'';el.style.color=ok?'#8fffc8':'#ffd5d5';}}
function revealCode(type,code,label){
  const panel=document.querySelector(`.jc-package-submenu[data-package="${cssEscape(type)}"]`);
  if(!panel)return false;
  const field=panel.querySelector('.jc-package-code-display');const status=panel.querySelector('.jc-package-code-status');
  if(field){field.textContent=code;field.dataset.codigoAtual=code;field.style.color='#dffcff';}
  if(status){status.textContent=label?`Código gerado: ${label}.`:'Código de download gerado.';status.style.color='#8fffc8';}
  return false;
}
function packagePanel(type){return document.querySelector(`.jc-package-submenu[data-package="${cssEscape(type)}"]`);}
function activeOptions(type){
  const options=(window.JC_EXTRA_DOWNLOAD_OPTIONS&&window.JC_EXTRA_DOWNLOAD_OPTIONS[type])||[];
  return options.filter(option=>option&&option.active!==false&&cleanCodes(option.codes).length);
}
function generateOption(type,option){const code=pick(option,'extra:'+type+':'+option.id);if(!code)return false;return revealCode(type,code,option.name);}

function ensureChoiceModal(){
  if(document.getElementById('jc_download_choice_overlay'))return;
  const style=document.createElement('style');style.id='jc_download_choice_style';style.textContent=`
  #jc_download_choice_overlay{position:fixed;inset:0;z-index:2147483640;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.82);backdrop-filter:blur(8px)}
  #jc_download_choice_overlay.open{display:flex}#jc_download_choice_box{width:min(560px,96vw);max-height:86vh;overflow:auto;padding:20px;border-radius:24px;background:linear-gradient(145deg,#091b2b,#030a11);border:1px solid rgba(79,193,255,.35);box-shadow:0 28px 90px rgba(0,0,0,.62);color:#fff;font-family:Arial,sans-serif}
  #jc_download_choice_head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:15px}#jc_download_choice_head h3{margin:0;font-size:22px}#jc_download_choice_head p{margin:6px 0 0;color:#9fb4c2;font-size:13px;line-height:1.45}
  #jc_download_choice_close{width:42px;height:42px;border:0;border-radius:12px;background:rgba(255,255,255,.09);color:#fff;font-size:22px;cursor:pointer}
  #jc_download_choice_grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.jc-download-choice-option{min-height:62px;padding:12px;border:1px solid rgba(67,178,255,.35);border-radius:15px;background:linear-gradient(135deg,rgba(34,122,225,.95),rgba(14,68,143,.96));color:#fff;font-weight:900;cursor:pointer}.jc-download-choice-option:hover{filter:brightness(1.12);transform:translateY(-1px)}
  @media(max-width:520px){#jc_download_choice_grid{grid-template-columns:1fr}#jc_download_choice_box{padding:16px;border-radius:20px}}
  `;document.head.appendChild(style);
  const overlay=document.createElement('div');overlay.id='jc_download_choice_overlay';overlay.setAttribute('aria-hidden','true');overlay.innerHTML='<div id="jc_download_choice_box" role="dialog" aria-modal="true"><div id="jc_download_choice_head"><div><h3 id="jc_download_choice_title">Escolha uma opção</h3><p>Este botão possui mais de uma opção de código.</p></div><button id="jc_download_choice_close" type="button" aria-label="Fechar">×</button></div><div id="jc_download_choice_grid"></div></div>';
  document.body.appendChild(overlay);
  const close=()=>{overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true');};
  overlay.addEventListener('click',event=>{if(event.target===overlay)close();});overlay.querySelector('#jc_download_choice_close').addEventListener('click',close);
  document.addEventListener('keydown',event=>{if(event.key==='Escape')close();});
}
function chooseOption(type,options){
  ensureChoiceModal();const overlay=document.getElementById('jc_download_choice_overlay');const grid=document.getElementById('jc_download_choice_grid');const title=document.getElementById('jc_download_choice_title');
  const main=document.querySelector(`[data-jc-function-id="package.${cssEscape(type)}.open"]`);title.textContent=(main?.getAttribute('data-jc-function-name')||type.toUpperCase())+' — escolha uma opção';grid.innerHTML='';
  options.forEach(option=>{const button=document.createElement('button');button.type='button';button.className='jc-download-choice-option';button.textContent=option.name||'Opção';button.addEventListener('click',()=>{overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true');generateOption(type,option);});grid.appendChild(button);});
  overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');return false;
}

window.gerarCodigoDownloadPacote=function(type,event){
  if(event){event.preventDefault();event.stopPropagation();}
  const panel=packagePanel(type);const tools=panel&&panel.querySelector('.jc-package-tools');if(!panel||!tools||tools.classList.contains('jc-package-tools-locked'))return false;
  if(isTest())return revealCode(type,digitsDemo(),'DEMO');
  const options=activeOptions(type);
  if(!options.length){const status=panel.querySelector('.jc-package-code-status');const field=panel.querySelector('.jc-package-code-display');if(field){field.textContent='';field.dataset.codigoAtual='';}if(status){status.textContent='Nenhum código cadastrado para este botão.';status.style.color='#ffd5d5';}return false;}
  if(options.length===1)return generateOption(type,options[0]);
  return chooseOption(type,options);
};
window.copiarCodigoDownloadPacote=function(type,event){
  if(event){event.preventDefault();event.stopPropagation();}
  const panel=packagePanel(type),field=panel&&panel.querySelector('.jc-package-code-display'),status=panel&&panel.querySelector('.jc-package-code-status');const code=String(field?.dataset.codigoAtual||field?.textContent||'').trim();
  if(!/^[0-9X]+$/.test(code)){if(status){status.textContent='Gere um código antes de copiar.';status.style.color='#ffd5d5';}return false;}
  copyText(code).then(()=>{if(status){status.textContent='Código copiado: '+code;status.style.color='#8fffc8';}}).catch(()=>{if(status){status.textContent='Não foi possível copiar automaticamente.';status.style.color='#ffd5d5';}});return false;
};

window.gerarCodigoDownloadConfig=function(event){
  if(event){event.preventDefault();event.stopPropagation();}
  if(isTest()){const code=digitsDemo();setText('config_download_code',code);setStatus('config_download_status','Código DEMO gerado.',true);return false;}
  const config=simpleConfig('config');const code=pick(config,'simple:config');
  if(!code){setText('config_download_code','');setStatus('config_download_status','Nenhum código foi cadastrado para o CONFIG.',false);return false;}
  setText('config_download_code',code);setStatus('config_download_status','Código de download gerado.',true);return false;
};
window.copiarCodigoDownloadConfig=function(event){
  if(event){event.preventDefault();event.stopPropagation();}const field=document.getElementById('config_download_code');const code=String(field?.dataset.codigoAtual||field?.textContent||'').trim();
  if(!/^[0-9X]+$/.test(code)){setStatus('config_download_status','Gere um código antes de copiar.',false);return false;}
  copyText(code).then(()=>setStatus('config_download_status','Código copiado: '+code,true)).catch(()=>setStatus('config_download_status','Não foi possível copiar automaticamente.',false));return false;
};

window.gerarCodigoDownload11=function(){
  if(isTest()){const code=digitsDemo();setText('download_code_11_right',code);setStatus('download_status_msg_11','Código DEMO de download gerado.',true);return false;}
  const config=simpleConfig('activator11');const code=pick(config,'simple:activator11');
  if(!code){setText('download_code_11_right','');setStatus('download_status_msg_11','Nenhum código de download foi cadastrado.',false);return false;}
  setText('download_code_11_right',code);setStatus('download_status_msg_11','Código de download gerado.',true);return false;
};
window.copiarCodigoDownload11=function(){
  const field=document.getElementById('download_code_11_right');const code=String(field?.dataset.codigoAtual||field?.textContent||'').trim();
  if(!/^[0-9X]+$/.test(code)){setStatus('download_status_msg_11','Gere um código de download antes de copiar.',false);return false;}
  copyText(code).then(()=>setStatus('download_status_msg_11','Código de download copiado.',true)).catch(()=>setStatus('download_status_msg_11','Não foi possível copiar automaticamente.',false));return false;
};

function installGenerate16(){
  if(!originalGenerate16&&typeof window.gerarCodigoDownload16==='function')originalGenerate16=window.gerarCodigoDownload16;
  window.gerarCodigoDownload16=function(){
    if(isTest()){const code=digitsDemo();setText('download_code_16_right',code);setStatus('status_msg','Código DEMO de download gerado.',true);return false;}
    try{if(originalGenerate16)originalGenerate16.apply(this,arguments);}catch(error){console.warn(error);}
    const config=simpleConfig('activator16');const code=pick(config,'simple:activator16');
    if(!code){setText('download_code_16_right','');setStatus('status_msg','Nenhum código de download foi cadastrado.',false);return false;}
    setText('download_code_16_right',code);setStatus('status_msg','Código de download gerado.',true);return false;
  };
  window.copiarCodigoDownload16=function(){
    const field=document.getElementById('download_code_16_right');const code=String(field?.dataset.codigoAtual||field?.textContent||'').trim();
    if(!/^[0-9X]+$/.test(code)){setStatus('status_msg','Gere um código de download antes de copiar.',false);return false;}
    copyText(code).then(()=>setStatus('status_msg','Código de download copiado.',true)).catch(()=>setStatus('status_msg','Não foi possível copiar automaticamente.',false));return false;
  };
}
function captureButton(id,handler){
  const button=document.getElementById(id);if(!button||button.dataset.jcDownloadRuntime==='1')return;button.dataset.jcDownloadRuntime='1';
  button.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();handler(event);return false;},true);
}
function installButtons(){
  installGenerate16();
  captureButton('btn_config_download_gerar_codigo',event=>window.gerarCodigoDownloadConfig(event));
  captureButton('btn_config_download_copiar_codigo',event=>window.copiarCodigoDownloadConfig(event));
  captureButton('btn_gerar_codigo_download_11',()=>window.gerarCodigoDownload11());
  captureButton('btn_copiar_codigo_download_11',()=>window.copiarCodigoDownload11());
  captureButton('btn_gerar_codigo_download',()=>window.gerarCodigoDownload16());
  captureButton('btn_copiar_codigo_download',()=>window.copiarCodigoDownload16());
}
function installFutureExtraLinks(){
  const legacyIds={btv:'btv_apk',stv:'stv_apk',xplus:'xplus_apk',eaigo:'eaigo_apk'};
  document.addEventListener('click',function(event){
    const button=event.target.closest('.jc-package-access-btn[data-package]');if(!button||isTest())return;
    const type=String(button.dataset.package||'').trim();if(!type)return;
    const id=legacyIds[type]||('extra_link__'+type);let url='';try{if(typeof window.JC_getLink==='function')url=window.JC_getLink(id)||'';}catch(e){}
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    if(!url){
      const message='Nenhum link foi configurado no Supabase para este botão.';
      try{if(window.JC_APP&&typeof window.JC_APP.toast==='function')window.JC_APP.toast(message,'error');}catch(e){}
      return false;
    }
    if(typeof window.abrirLinkOculto==='function')window.abrirLinkOculto(url);else window.open(url,'_blank','noopener,noreferrer');
    return false;
  },true);
}
function install(){ensureChoiceModal();installButtons();installFutureExtraLinks();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.addEventListener('jc-links-loaded',installButtons);
})();
