/** Standalone inquiry app. Keep separate from the full project intake. */
const SLV_NAMES = {'documentation-only':'Construction Documentation Only','level-1':'Visual Build — 3 Visits','level-2':'Extended Build Coverage — 6 Visits','level-3':'Detailed Build Coverage — 12 Visits','level-4':'Custom Build Coverage','existing-home-visual':'Existing Home Package','existing-home-luxury':'Custom Existing Home Coverage','interior-exterior-visualization':'Interior + Exterior Visualization','alternate-decor-style':'Alternate Décor Style','additional-room-image':'Additional Room or Image','home-intelligence-record':'Home Intelligence Record','home-intelligence-plus':'Home Intelligence Plus','annual-home-health-scan':'Annual Home Health Scan','annual-home-health-expanded':'Expanded Annual Home Checkup & Maintenance','model-standard':'Standard Scale Model','model-detailed':'Detailed Scale Model','model-premium':'Premium Scale Model'};
function slvInquiryConfig_() {
  const props=PropertiesService.getScriptProperties();
  const sheetId=props.getProperty('SLV_INQUIRY_SHEET_ID');
  const recipient=props.getProperty('SLV_INQUIRY_RECIPIENT');
  if(!sheetId||!recipient) throw new Error('Inquiry delivery is not configured. Please email info@sitelinevisuals3d.com.');
  return {sheetId,recipient};
}
function slvText_(value,max) { const s=String(value||'').trim(); if(s.length>max)throw new Error('Please shorten your message and try again.');return s; }
function slvSafeCell_(value) { const s=String(value||'');return /^[=+\-@]/.test(s)?"'"+s:s; }
function slvQuote_(raw,audience) {
  const catalog=SLV_QUOTE_CATALOGS[audience==='contractor'?'contractor':'public'];
  const entries=Array.isArray(raw)?raw:[];
  if(entries.length>20)throw new Error('Please review your package selections.');
  const seen={},lines=[];let total=0,custom=false,starting=false;
  entries.forEach(function(item){
    const id=String(item.id||'');
    const product=id==='existing-home-luxury'?{price:0,quote:true}:catalog[id];
    if(!product||seen[id])throw new Error('A selected service is no longer available. Please review your selections.');
    seen[id]=true;
    const extra=id==='alternate-decor-style'||id==='additional-room-image';
    const qty=extra?Number(item.quantity||1):1;
    if(!Number.isInteger(qty)||qty<1||qty>100||(id==='alternate-decor-style'&&qty>2))throw new Error('Please check the selected quantities.');
    const amount=(product.price||0)*qty;total+=amount;custom=custom||!!product.quote;starting=starting||!!product.starting;
    lines.push({id,name:SLV_NAMES[id]||product.name||id,quantity:qty,amount,quote:!!product.quote,starting:!!product.starting});
  });
  if((seen['alternate-decor-style']||seen['additional-room-image'])&&!seen['interior-exterior-visualization'])throw new Error('Select the visualization package before adding extra images or décor styles.');
  [['home-intelligence-record','home-intelligence-plus'],['annual-home-health-scan','annual-home-health-expanded'],['model-standard','model-detailed','model-premium']].forEach(function(group){if(group.filter(id=>seen[id]).length>1)throw new Error('Choose one option from each upgrade group.');});
  if(lines.filter(x=>/^(documentation-only|level-[1-4]|existing-home-)/.test(x.id)).length>1)throw new Error('Please choose one base package.');
  return {lines,total,custom,starting};
}
function doGet(e) {
  const p=e&&e.parameter||{};const template=HtmlService.createTemplateFromFile('Inquiry');
  let raw=[];try{raw=JSON.parse(p.selections||'[]');}catch(err){}
  let quote,error='';try{quote=slvQuote_(raw,p.audience);}catch(err){quote={lines:[],total:0};error=err.message;}
  template.bootstrap=JSON.stringify({kind:p.kind==='quote'?'quote':'contact',audience:p.audience==='contractor'?'contractor':'public',quote,error}).replace(/</g,'\\u003c');
  return template.evaluate().setTitle('Contact Site Line Visuals').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function slvSubmitWebsiteInquiry(payload) {
  const p=payload||{};if(p.website)throw new Error('Unable to submit this request.');
  const name=slvText_(p.name,120),email=slvText_(p.email,254),phone=slvText_(p.phone,40),message=slvText_(p.message,5000),zip=slvText_(p.zip,5);
  if(!name||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Please enter your name and a valid email address.');
  if(/[\r\n]/.test(email))throw new Error('Please enter a valid email address.');
  if(zip&&!/^\d{5}$/.test(zip))throw new Error('Please enter a five-digit ZIP code.');
  const kind=p.kind==='quote'?'quote':'contact',audience=p.audience==='contractor'?'contractor':'public';
  const quote=slvQuote_(p.selections,audience);if(kind==='quote'&&!quote.lines.length)throw new Error('Please choose services before requesting a quote.');
  if(kind==='contact'&&!message)throw new Error('Please include your question.');
  const requestId=slvText_(p.requestId,80);if(!/^[a-zA-Z0-9_-]{16,80}$/.test(requestId))throw new Error('Please reload the form and try again.');
  const cfg=slvInquiryConfig_(),lock=LockService.getScriptLock();lock.waitLock(20000);
  try {
    const ss=SpreadsheetApp.openById(cfg.sheetId);let sheet=ss.getSheetByName('Website_Inquiries');
    if(!sheet){sheet=ss.insertSheet('Website_Inquiries');sheet.appendRow(['Request ID','Received','Type','Audience','Name','Email','Phone','ZIP','Message','Selections','Estimated total','Starting/custom pricing','Notification']);sheet.setFrozenRows(1);}
    const prior=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,1).createTextFinder(requestId).matchEntireCell(true).findNext():null;
    if(prior)return {ok:true,reference:requestId};
    const cache=CacheService.getScriptCache();const key='slv-inquiry-'+Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,email.toLowerCase()));
    const count=Number(cache.get(key)||0);if(count>=5)throw new Error('Please wait a few minutes before sending another inquiry. You can also email info@sitelinevisuals3d.com.');
    const lines=quote.lines.map(x=>x.name+(x.quantity>1?' x'+x.quantity:'')+' — '+(x.quote?'Custom quote':(x.starting?'From ':'')+'$'+x.amount.toLocaleString('en-US'))).join('\n');
    const estimate='$'+quote.total.toLocaleString('en-US')+(quote.custom?' + custom quote':'');
    sheet.appendRow([requestId,new Date(),kind,audience,name,email,phone,zip,message,lines,quote.total,(quote.starting?'Starting prices; ':'')+(quote.custom?'Custom quote required':'Written proposal confirms scope and pricing'),'Pending'].map(slvSafeCell_));
    const row=sheet.getLastRow();SpreadsheetApp.flush();cache.put(key,String(count+1),900);
    try {
      MailApp.sendEmail({to:cfg.recipient,replyTo:email,subject:'SLV '+(kind==='quote'?'quote request':'website inquiry')+' — '+name.replace(/[\r\n]/g,' '),body:['Reference: '+requestId,'Name: '+name,'Email: '+email,'Phone: '+(phone||'Not provided'),'ZIP: '+(zip||'Not provided'),'Audience: '+audience,'',message,'',lines,quote.lines.length?'Estimated total: '+estimate:'','Pricing and scope require a written proposal.'].join('\n')});
      sheet.getRange(row,13).setValue('Sent');
    }catch(err){sheet.getRange(row,13).setValue('Email failed — review recorded inquiry');console.error(err);}
    return {ok:true,reference:requestId};
  }finally{lock.releaseLock();}
}
