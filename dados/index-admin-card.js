(function(){
  'use strict';
  const A=window.JC_APP;
  const card=document.getElementById('card-gerenciador-botoes-painel');
  if(!card||!A||!A.ready||!A.client)return;
  async function updateVisibility(){
    try{
      const access=await A.requireAdmin();
      card.hidden=!Boolean(access);
    }catch(_error){card.hidden=true;}
  }
  updateVisibility();
  A.client.auth.onAuthStateChange(function(){setTimeout(updateVisibility,0);});
})();
