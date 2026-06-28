(function(){
'use strict';

const legacy={
  'https://api.whatsapp.com/send/?phone=5555997234936&text=Ol%C3%A1%21+%EF%BF%BD%0A%0ABem-vindo+%C3%A0+JC-APK+TV.%0AConsulte+valores+de+atualiza%C3%A7%C3%A3o+e+suporte+do+sistema.%0AManter+a+plataforma+atualizada+garante+mais+estabilidade%2C+seguran%C3%A7a%2C+compatibilidade+e+m%C3%A1xima+performance.&type=phone_number&app_absent=0':'suporte_whatsapp',
  'https://app.mediafire.com/folder/ujnzmwcxzpoi8/Atualiza%C3%A7%C3%A3o+Sistema':'atualizacao_sistema',
  'https://app.mediafire.com/folder/sk95cjtacuy56/Gerenciador+de+Arquivos':'gerenciador_arquivos',
  'https://app.mediafire.com/folder/95c7gb6688adu/UniTV+Free':'unitv_free',
  'https://www.mediafire.com/folder/em6uvwq3v0ge1/BTV':'btv_apk',
  'https://app.mediafire.com/folder/z9o69fhnv7yin/Xplus':'xplus_apk',
  'https://app.mediafire.com/folder/913w1s0he40ah':'eaigo_apk'
};

const state={rows:[],direct:{},groups:{},codes:{},extraOptions:{},simpleCodes:{}};
const queues={};

function has(obj,key){return Object.prototype.hasOwnProperty.call(obj,key);}
function cleanKey(value){return String(value||'').trim().replace(/^jc-link:\/\//i,'').toLowerCase();}
function list(value){
  if(!Array.isArray(value))return [];
  return value.map(function(item){
    if(item&&typeof item==='object')return String(item.url||item.link||item.value||item.codigo||item.code||'').trim();
    return String(item||'').trim();
  }).filter(Boolean);
}
function mode(row){return row&&row.value==='random'?'random':'unique';}
function shuffle(values){
  const copy=values.slice();
  for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
  return copy;
}
function pick(values,pickMode,key){
  const clean=list(values);if(!clean.length)return '';
  if(pickMode!=='random'||clean.length===1)return clean[0];
  const signature=clean.join('\u001f');const current=queues[key];
  if(!current||current.signature!==signature||!current.values.length)queues[key]={signature,values:shuffle(clean)};
  return queues[key].values.pop()||clean[0];
}
function linkFromEntry(value){
  if(value&&typeof value==='object')return String(value.url||value.link||value.value||'').trim();
  const text=String(value||'').trim();if(!text)return '';
  if(/^(https?:\/\/|intent:|market:|mailto:|tel:)/i.test(text))return text;
  const parts=text.split(/\s*[|=]\s*/).map(v=>v.trim()).filter(Boolean);
  for(let i=parts.length-1;i>=0;i--)if(/^(https?:\/\/|intent:|market:|mailto:|tel:)/i.test(parts[i]))return parts[i];
  const found=text.match(/https?:\/\/[^\s]+/i);return found?found[0]:'';
}
function firstLink(items){
  const values=Array.isArray(items)?items:[];
  for(let i=0;i<values.length;i++){const url=linkFromEntry(values[i]);if(url)return url;}
  return '';
}
function selectedLink(row){
  if(!row)return '';
  if(row.kind==='direct')return String(row.value||'').trim();
  if(row.kind==='link_group')return linkFromEntry(pick(row.items,mode(row),'link:'+row.id));
  return '';
}
function setArray(target,items){if(!Array.isArray(target))return false;target.splice(0,target.length,...list(items));return true;}
function findRow(ref){
  const key=cleanKey(ref);
  return state.rows.find(row=>cleanKey(row&&row.id)===key||cleanKey(row&&row.name)===key)||null;
}
function resolveLink(ref){
  const original=String(ref||'').trim();const key=cleanKey(original);const row=findRow(key);
  if(row){const result=selectedLink(row);if(result)return result;}
  if(has(state.direct,key))return String(state.direct[key]||'').trim();
  if(has(state.groups,key))return firstLink(state.groups[key]);
  return '';
}
function showMissingLink(ref){
  const label=String(ref||'link').replace(/^extra_link__/,'').replace(/_/g,' ').toUpperCase();
  const message=`Nenhum link foi configurado no Supabase para ${label}.`;
  try{if(window.JC_APP&&typeof window.JC_APP.toast==='function'){window.JC_APP.toast(message,'error');return false;}}catch(e){}
  console.warn(message);return false;
}
function codeConfig(id,aliases){
  const candidates=[id].concat(aliases||[]);
  for(const candidate of candidates){
    const row=findRow(candidate);
    if(row&&row.kind==='code_group')return {id:row.id,name:row.name||row.id,mode:mode(row),codes:list(row.items),active:row.active!==false};
    if(has(state.codes,candidate))return {id:candidate,name:candidate,mode:'random',codes:list(state.codes[candidate]),active:true};
  }
  return {id,name:id,mode:'unique',codes:[],active:true};
}
function buildDownloadCodeState(){
  state.simpleCodes={
    config:codeConfig('config_download_codes'),
    activator11:codeConfig('download_11_codes'),
    activator16:codeConfig('download_16_codes')
  };
  state.extraOptions={};
  state.rows.forEach(function(row){
    const id=String(row.id||'');if(row.kind!=='code_group'||!id.startsWith('extra_code__'))return;
    const parts=id.split('__');if(parts.length<3)return;
    const buttonSlug=parts[1];
    (state.extraOptions[buttonSlug]||(state.extraOptions[buttonSlug]=[])).push({id:row.id,name:row.name||parts.slice(2).join(' '),mode:mode(row),codes:list(row.items),active:row.active!==false,sort_order:Number(row.sort_order)||0});
  });
  Object.keys(state.extraOptions).forEach(key=>state.extraOptions[key].sort((a,b)=>a.sort_order-b.sort_order||a.name.localeCompare(b.name)));

  const legacyAliases={btv:['btv_download_codes','btv_codes','codigos_btv'],stv:['stv_download_codes','stv_codes','codigos_stv'],xplus:['xplus_download_codes','xplus_codes','codigos_xplus'],eaigo:['eaigo_download_codes','eaigo_codes','codigos_eaigo']};
  Object.keys(legacyAliases).forEach(function(type){
    if(state.extraOptions[type]?.length)return;
    const candidate=legacyAliases[type].find(id=>has(state.codes,id));
    if(candidate&&state.codes[candidate].length)state.extraOptions[type]=[{id:candidate,name:'Padrão',mode:'random',codes:list(state.codes[candidate]),active:true,sort_order:0}];
  });

  window.JC_SIMPLE_DOWNLOAD_CODES=state.simpleCodes;
  window.JC_EXTRA_DOWNLOAD_OPTIONS=state.extraOptions;
}
function applyPackageCodes(){
  const store=window.JC_PACKAGE_DOWNLOAD_CODES=window.JC_PACKAGE_DOWNLOAD_CODES||{btv:[],stv:[],xplus:[],eaigo:[]};
  ['btv','stv','xplus','eaigo'].forEach(function(type){
    const options=(state.extraOptions[type]||[]).filter(option=>option.active!==false);
    const flattened=[];options.forEach(option=>flattened.push(...option.codes));
    setArray(store[type]||(store[type]=[]),flattened);
  });
}
function apply(){
  const oldOpen=window.abrirLinkOculto;
  if(typeof oldOpen==='function'&&!oldOpen.__jcDynamic){
    const wrapped=function(url){
      const raw=String(url||'').trim();
      const legacyId=legacy[raw]||(/^jc-link:\/\//i.test(raw)?cleanKey(raw):'');
      if(legacyId){
        const dynamic=resolveLink(legacyId);
        if(!dynamic)return showMissingLink(legacyId);
        return oldOpen.call(this,dynamic);
      }
      return oldOpen.call(this,raw);
    };
    wrapped.__jcDynamic=true;window.abrirLinkOculto=wrapped;
  }

  // O Supabase substitui integralmente o armazenamento antigo.
  // Nenhum link ou código estático do HTML/links.js permanece como fallback.
  window.JC_LINKS=window.JC_LINKS||{};
  window.JC_LINKS.diretos=Object.assign({},state.direct);
  window.JC_LINKS.links_diretos=Object.entries(state.direct).map(function(pair){
    const id=pair[0],link=pair[1],row=state.rows.find(item=>item.id===id)||{};return {id,nome:row.name||id,link};
  });
  window.JC_LINKS.grupos=Object.assign({},state.groups);
  window.JC_LINKS.codigos=Object.assign({},state.codes);
  window.JC_getLink=resolveLink;
  window.JC_getLinkGroup=function(ref){const row=findRow(ref),key=cleanKey(ref);if(row&&row.kind==='link_group')return list(row.items);return has(state.groups,key)?list(state.groups[key]):[];};
  window.JC_getCodeGroup=function(ref){const row=findRow(ref),key=cleanKey(ref);if(row&&row.kind==='code_group')return list(row.items);return has(state.codes,key)?list(state.codes[key]):[];};
  window.JC_getCatalogRow=function(ref){return findRow(ref);};
  window.JC_pickCatalogItem=function(ref){const row=findRow(ref);if(!row)return '';return row.kind==='code_group'?pick(row.items,mode(row),'code:'+row.id):selectedLink(row);};

  try{
    if(typeof mappings!=='undefined'&&Array.isArray(mappings)){
      const map={btn_tutorial:'gerenciador_arquivos',btn_atualizacao:'atualizacao_sistema',btn_versao:'unitv_free'};
      mappings.forEach(item=>{const key=map[item&&item.id];if(key)item.url='jc-link://'+key;});
    }
  }catch(e){}
  try{if(typeof linksAtivador5100!=='undefined')setArray(linksAtivador5100,state.groups.ativador_16_digitos||[]);}catch(e){}
  try{if(typeof linksAtivador5100_11!=='undefined')setArray(linksAtivador5100_11,state.groups.ativador_11_digitos||[]);}catch(e){}

  buildDownloadCodeState();applyPackageCodes();
  try{window.dispatchEvent(new CustomEvent('jc-links-loaded',{detail:{rows:state.rows.length,extras:Object.keys(state.extraOptions).length}}));}catch(e){}
}

async function load(){
  state.rows=[];state.direct={};state.groups={};state.codes={};apply();
  const app=window.JC_APP;if(!app||!app.client)return;
  const result=await app.client.from('links_catalog').select('*').eq('active',true).order('sort_order');
  if(result.error){console.warn('Links dinâmicos:',result.error.message);return;}
  state.rows=result.data||[];state.direct={};state.groups={};state.codes={};
  state.rows.forEach(function(row){
    const id=String(row.id||'').trim();if(!id)return;
    if(row.kind==='direct')state.direct[id]=String(row.value||'').trim();
    else if(row.kind==='link_group')state.groups[id]=list(row.items);
    else if(row.kind==='code_group'&&!['rotacao_11','rotacao_16'].includes(id))state.codes[id]=list(row.items);
  });
  apply();
}

window.JC_DYNAMIC_LINKS={load,state,apply,resolveLink,pick};
})();
