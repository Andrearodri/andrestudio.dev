const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const root=path.resolve(__dirname, '..');
const base=process.env.PUBLIC_TEST_BASE || 'http://127.0.0.1:8877';
const cdp=process.env.CDP_ENDPOINT || 'http://127.0.0.1:9224';
async function main(){
 const targets=await (await fetch(cdp+'/json/list')).json();
 const ws=new WebSocket(targets.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let id=0;const pending=new Map();
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}});
 const cmd=(method,params={})=>new Promise((resolve,reject)=>{const i=++id;pending.set(i,m=>m.error?reject(Error(JSON.stringify(m.error))):resolve(m.result));ws.send(JSON.stringify({id:i,method,params}));});
 const ev=async expression=>{const r=await cmd('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||'evaluation failed');return r.result.value;};
 await cmd('Page.enable');await cmd('Runtime.enable');
 const files=JSON.parse(fs.readFileSync(root+'/build/public-inventory.json')).files.map(x=>x.path).filter(p=>p.endsWith('.html')&&fs.readFileSync(root+'/build/public/'+p,'utf8').includes('id="primary-nav"'));
 const results=[];
 for(const width of [1440,1180,390]){
  await cmd('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  for(const file of files){
   const url=base+'/'+file.replace(/index.html$/,'');
   await cmd('Page.navigate',{url});
   for(let i=0;i<60;i++){await new Promise(r=>setTimeout(r,50));if(await ev(`location.href===${JSON.stringify(url)} && document.readyState==='complete'`))break;}
   const result=await ev(`(()=>{const nav=document.querySelector('#primary-nav'),toggle=document.querySelector('.nav-toggle');if(!nav||!toggle)throw Error('missing navigation');const mobile=getComputedStyle(toggle).display!=='none';if(mobile){toggle.click();if(toggle.getAttribute('aria-expanded')!=='true'||getComputedStyle(nav).display==='none')throw Error('menu did not open');}const anchors=[...nav.querySelectorAll('a')];if(anchors.length!==10)throw Error('wrong link count');const visible=anchors.every(a=>{const r=a.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth;});if(!visible)throw Error('menu link clipped');if(mobile){anchors[0].addEventListener('click',e=>e.preventDefault(),{once:true});anchors[0].click();if(toggle.getAttribute('aria-expanded')!=='false')throw Error('menu did not close');}return {width:innerWidth,mobile,headerOverflow:Math.max(0,document.querySelector('.site-header').scrollWidth-document.documentElement.clientWidth)};})()`);
   assert.equal(result.headerOverflow,0,file+' header overflow');results.push({file,...result});
   if(file==='sobre/index.html'&&(width===1440||width===390)){
    if(width===390)await ev("document.querySelector('.nav-toggle').click()");
    const shot=await cmd('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/private/tmp/navigation-about-'+width+'.png',Buffer.from(shot.data,'base64'));
   }
  }
 }
 fs.writeFileSync('/private/tmp/navigation-browser-results.json',JSON.stringify(results,null,2));
 console.log('PASS: '+results.length+' browser checks across '+files.length+' public pages at 1440, 1180 and 390px; links visible; mobile open/close; no header overflow');
 await cmd('Emulation.clearDeviceMetricsOverride');ws.close();
}
main().catch(e=>{console.error(e);process.exit(1)});
