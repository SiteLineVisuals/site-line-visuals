/* Activate only after the Google inquiry application passes a delivery test. */
(function(){'use strict';
 const endpoint='https://script.google.com/macros/s/AKfycbyN41vxXkm1sITIKE3tSOD8-bGfluWUo7l56V5vICZo0xcjSOjyBih_WpnuKbt4CFdbDg/exec';
 const host=document.getElementById('websiteInquiry');if(!host)return;
 if(endpoint==='DEPLOYMENT_URL_REQUIRED'){host.textContent='Direct inquiry setup is awaiting activation. Please email info@sitelinevisuals3d.com.';return;}
 const params=new URLSearchParams(location.search),quote=params.get('request')==='quote',audience=location.pathname.startsWith('/builders/')?'contractor':'public';
 let selections=[];
 if(quote){try{const saved=JSON.parse(localStorage.getItem('slv-package-build-v2')||'{}');selections=[saved.package].concat(Array.isArray(saved.addons)?saved.addons:[]).filter(Boolean).map(x=>({id:x.id,quantity:x.quantity||1}));}catch(e){}}
 const url=new URL(endpoint);url.searchParams.set('kind',quote?'quote':'contact');url.searchParams.set('audience',audience);url.searchParams.set('selections',JSON.stringify(selections));
 const iframe=document.createElement('iframe');iframe.src=url.href;iframe.title=quote?'Request a project quote':'Contact Site Line Visuals';iframe.style.cssText='width:100%;height:'+(quote?'1100':'820')+'px;border:0;border-radius:8px';host.replaceChildren(iframe);
})();
