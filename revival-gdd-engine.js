/* Revival v0.5: local prototype model. Reward-row values and task definitions remain placeholders. */
const GDD_WEIGHTS=[3,4,4,4,4,3,4];
const GDD_NAMES=['Buy 3 pets','Buy 5 pets','Paid upgrades','Online playtime','Activity task 5','Activity task 6','Activity task 7'];
const GDD_THRESHOLDS=[15,40,60,75,90];
const GDD_MILESTONES=['Cash15','Clover SS MutaGen','4h MoneyTime','Cash75','Thundered SS WeatherGen ×5'];
const SHOP_PETS=[{id:'reindeer',name:'Reindeer',currency:'coins',price:'260',stock:1},{id:'rhino',name:'Rhino',currency:'coins',price:'60',stock:4},{id:'ostrich',name:'Ostrich',currency:'coins',price:'135',stock:5},{id:'arcticfox',name:'Arctic Fox',currency:'cash',price:'3000000000000000000',stock:null},{id:'parrot',name:'Parrot',currency:'cash',price:'1900000000',stock:null},{id:'moodeng',name:'Moo Deng',currency:'cash',price:'1900000000000000000',stock:null}];
function initShop(s){if(!s.shop)s.shop={coins:'1000',cash:'3800000000000000000',capacity:20,inventory:[],stock:Object.fromEntries(SHOP_PETS.map(p=>[p.id,p.stock])),transactions:[]};return s.shop;}
function shopGuideTargets(s,context){const shop=initShop(s);if(context==='rebirth'){const configured=s.rebirthRequirements;if(Array.isArray(configured))return configured.filter(id=>SHOP_PETS.some(p=>p.id===id));return ['arcticfox','parrot','moodeng'];}const pets=SHOP_PETS.filter(p=>shop.stock[p.id]!==0&&BigInt(shop[p.currency])>=BigInt(p.price));const suggested=pets.find(p=>p.id==='rhino')||pets[0];return suggested?[suggested.id]:[];}
function buyPet(s,id,txid,now=Date.now()){
 const shop=initShop(s),pet=SHOP_PETS.find(p=>p.id===id);if(!pet)return {ok:false,reason:'Unavailable item'};
 if(shop.transactions.includes(txid))return {ok:false,reason:'Already purchased'};
 if(shop.stock[id]===0)return {ok:false,reason:'Sold out'};
 const price=BigInt(pet.price),balance=BigInt(shop[pet.currency]);if(balance<price)return {ok:false,reason:pet.currency==='coins'?'Not enough coins':'Not enough cash'};
 shop[pet.currency]=(balance-price).toString();if(shop.stock[id]!==null)shop.stock[id]--;shop.inventory.push({name:pet.name,level:1,source:'shop'});shop.transactions.push(txid);
 const points=action(s,'purchase',1,'shop-'+txid,now);return {ok:true,name:pet.name,points};
}
function newRevival(now=Date.now(),rb=6,inactiveDays=7,alreadyEntered=false){
 if(inactiveDays<7||rb<6||alreadyEntered)throw Error('Not eligible');
 return {version:5,entryRB:rb,currentRB:rb,row:{id:'return-RB'+rb,daily:['D1 Pet','D2 Pet','Spins','Dust','MutaGen','CashD6','Halloween Chick'],milestones:[...GDD_MILESTONES]},enteredAt:now,expiresAt:now+7*86400000,utcDay:Math.floor(now/86400000),eventDay:1,total:4,today:4,loginGranted:true,progress:Array(7).fill(0),done:Array(7).fill(false),activityClaimed:Array(7).fill(false),boardRB:null,claimedDaily:[],claimedMilestones:[],revealed:false,baseFull:false,events:[],income:8,wallet:0,moneyCap:200000000000,cash:{Cash15:null,Cash75:null,CashD6:null}};
}
function resetUtc(s,now){const utc=Math.floor(now/86400000);if(utc<=s.utcDay)return;s.utcDay=utc;s.today=0;s.loginGranted=false;s.progress=Array(7).fill(0);s.done=Array(7).fill(false);s.activityClaimed=Array(7).fill(false);s.boardRB=null;s.events=[];}
function grantLogin(s,now=Date.now()){resetUtc(s,now);if(now>=s.expiresAt||s.loginGranted)return 0;s.loginGranted=true;s.total+=4;s.today+=4;return 4;}
function openBoard(s){if(s.boardRB===null)s.boardRB=s.currentRB;return s.boardRB;}
function action(s,type,quantity=1,id=String(Date.now()),now=Date.now()){
 if(now>=s.expiresAt||s.events.includes(id))return 0;resetUtc(s,now);openBoard(s);s.events.push(id);
 const before=s.today,targets=[3,5,1,60,1,1,1];
 const indexes=type==='purchase'?[0,1]:type==='paidUpgrade'?[2]:type==='onlineSeconds'?[3]:type==='demoTask5'?[4]:type==='demoTask6'?[5]:type==='demoTask7'?[6]:[];
 for(const i of indexes){s.progress[i]=Math.min(targets[i],s.progress[i]+Math.max(0,quantity));if(s.progress[i]>=targets[i])s.done[i]=true;}
 return s.today-before;
}
function claimActivity(s,i,now=Date.now()){
 if(!s.activityClaimed)s.activityClaimed=s.done.slice();
 if(now>=s.expiresAt)return {ok:false,reason:'Event ended',points:0};
 if(i<0||i>=7||!s.done[i])return {ok:false,reason:'Task incomplete',points:0};
 if(s.activityClaimed[i])return {ok:false,reason:'Already claimed',points:0};
 const points=Math.min(GDD_WEIGHTS[i],Math.max(0,30-s.today));s.activityClaimed[i]=true;s.today+=points;s.total+=points;return {ok:true,points};
}
function setRevivalDay(s,day){s.eventDay=Math.max(s.eventDay,Math.min(7,day));if(s.eventDay>=2)s.revealed=true;}
function claim(s,kind,index,now=Date.now()){
 if(now>=s.expiresAt)return {ok:false,reason:'Event ended'};
 const list=kind==='daily'?s.claimedDaily:s.claimedMilestones;
 if(index<0||index>=(kind==='daily'?7:5))return {ok:false,reason:'Invalid reward'};
 if(list.includes(index))return {ok:false,reason:'Already claimed'};
 if(kind==='daily'&&index+1>s.eventDay)return {ok:false,reason:'Not available yet'};
 if(kind==='milestone'&&s.total<GDD_THRESHOLDS[index])return {ok:false,reason:'Not enough points'};
 const isPet=kind==='daily'&&[0,1,6].includes(index);
 const name=kind==='daily'?s.row.daily[index]:s.row.milestones[index];
 let receipt={ok:true,name,pet:isPet,state:isPet?'Lv1 · Normal · No Weather':null};
 if(name==='4h MoneyTime'){const amount=Math.min(Math.max(0,s.moneyCap-s.wallet),Math.max(0,s.income)*14400);receipt.amount=amount;receipt.hours=4;receipt.incomeAtClaim=s.income;}
 else if(Object.prototype.hasOwnProperty.call(s.cash,name)){const value=s.cash[name];if(value!==null){const amount=Math.min(Math.max(0,s.moneyCap-s.wallet),Math.max(0,value));receipt.amount=amount;}else receipt.configurationPending=true;}
 if(!s.mailbox)s.mailbox=[];s.mailbox.push({id:kind+'-'+index,reward:name,amount:receipt.amount??null,pet:isPet,state:receipt.state,source:'Revival Event',claimedAt:now});receipt.delivery='mail';
 list.push(index);return receipt;
}
if(typeof module!=='undefined')module.exports={newRevival,resetUtc,grantLogin,openBoard,action,setRevivalDay,claim,initShop,buyPet,claimActivity,shopGuideTargets};
if(typeof document!=='undefined'){
 const $=q=>document.querySelector(q),key='revival-gdd-v05-shared';let s;
 try{s=JSON.parse(localStorage.getItem(key));if(!s||s.version!==5)s=newRevival();}catch{s=newRevival();}
 if(!s.activityClaimed)s.activityClaimed=s.done.slice();if(s.row.daily[6]==='Configured Apex')s.row.daily[6]='Halloween Chick';
 grantLogin(s);let busy=false,showTasks=false;const targets=[3,5,1,60,1,1,1];
 const save=()=>{try{localStorage.setItem(key,JSON.stringify(s))}catch{}};
 document.querySelectorAll('.msnode,.msrow,.milestoneclaim,.claimed,.unlock').forEach(x=>x.remove());
 const layer=document.createElement('div');layer.id='gddMilestoneLayer';$('#scene').append(layer);
 function resize(){const scale=$('#viewport').clientWidth/1844;$('#scene').style.transform=`scale(${scale})`;$('#viewport').style.height=853*scale+'px'}new ResizeObserver(resize).observe($('#viewport'));
 function pointY(p){const a=[[0,728],[15,682],[40,594],[60,506],[75,418],[90,330]];for(let i=1;i<a.length;i++)if(p<=a[i][0])return a[i-1][1]+(a[i][1]-a[i-1][1])*(p-a[i-1][0])/(a[i][0]-a[i-1][0]);return 330;}
 function button(text,fn,disabled=false){const b=document.createElement('button');b.textContent=text;b.onclick=fn;b.disabled=disabled;return b;}
 function receipt(r){const box=$('#reward .rewardbox');box.replaceChildren();const title=document.createElement('h2');title.textContent=r.ok?'SENT TO MAIL':'UNAVAILABLE';const p=document.createElement('p');p.textContent=r.ok?'Rewards have been sent to your mailbox.':r.reason;box.append(title,p);box.append(button('CONTINUE',()=>$('#reward').style.display='none'));$('#reward').style.display='grid';}
 const effectiveNow=()=>Math.max(Date.now(),s.utcDay*86400000);
 function getClaim(kind,i){const r=claim(s,kind,i,effectiveNow());save();draw();receipt(r);}
 function draw(){
  $('#total').textContent=s.total+' / 90';$('#today').textContent=s.today+' / 30';$('#daily').textContent='Today '+s.today+' / 30';$('#fill').style.height=(728-pointY(s.total))+'px';
  const scroll=$('#rows').scrollTop;$('#rows').replaceChildren();
  for(let j=0;j<8;j++){const i=j-1,row=document.createElement('div');row.className='row';row.dataset.taskIndex=i;const title=document.createElement('div');title.className='name';title.textContent=j?GDD_NAMES[i]:'Log in';row.append(title);const complete=j?s.done[i]:s.loginGranted,received=j?s.activityClaimed[i]:s.loginGranted;row.dataset.rewardState=received?'claimed':complete?'ready':'locked';
   if(!received){const progress=document.createElement('small');progress.textContent=complete?'Ready to claim':s.progress[i]+' / '+targets[i];title.append(progress)}
   const status=received?document.createElement('span'):button(complete?'Claim':'GO',()=>complete?receiveActivity(i):taskGuide(i),busy);status.className=received?'done':complete?'taskGuideButton taskReady':'taskGuideButton';if(received)status.textContent='✓ DONE';const points=document.createElement('span');points.className='pts activityPts';points.textContent='+'+(j?GDD_WEIGHTS[i]:4);row.append(status,points);$('#rows').append(row);
  }
  $('#rows').scrollTop=scroll;layer.replaceChildren();
  for(let j=0;j<5;j++){const i=4-j,y=290+j*88,threshold=GDD_THRESHOLDS[i],claimed=s.claimedMilestones.includes(i),ready=s.total>=threshold&&Date.now()<s.expiresAt;
   const node=document.createElement('div');node.className='msnode'+(s.total>=threshold?' reached':'');node.style.top=y+14+'px';node.textContent=threshold;
   const row=document.createElement('div');row.className='msrow';row.style.top=y+'px';row.dataset.rewardState=claimed?'claimed':ready&&effectiveNow()<s.expiresAt?'ready':'locked';const image=document.createElement('img');image.src='milestone-'+['cash','mutagen','moneytime','cash','weather'][i]+'.png';image.alt='';const name=document.createElement('span');name.className='label';name.textContent=s.row.milestones[i];row.append(image,name);
   if(claimed){const d=document.createElement('span');d.className='gddDone';d.textContent='✓ CLAIMED';row.append(d)}else if(ready&&effectiveNow()<s.expiresAt){const b=button('Claim',()=>getClaim('milestone',i));b.className='gddClaim';row.append(b)}else{const img=document.createElement('img');img.className='lockimg';img.src='milestone-lock.png';img.alt='Locked';row.append(img)}layer.append(node,row);
  }
  const cards=$('#polishedlogin').querySelectorAll('.logincard');cards.forEach((card,i)=>{card.dataset.rewardState=s.claimedDaily.includes(i)?'claimed':i+1<=s.eventDay&&effectiveNow()<s.expiresAt?'ready':'locked';card.querySelectorAll('button,.later').forEach(e=>e.remove());card.classList.toggle('ready',!s.claimedDaily.includes(i)&&i+1<=s.eventDay);if(s.claimedDaily.includes(i)){const a=document.createElement('span');a.className='later';a.textContent='✓ CLAIMED';card.append(a)}else if(i+1<=s.eventDay){card.append(button('Claim',()=>getClaim('daily',i)))}else{const a=document.createElement('span');a.className='later';a.textContent='Locked · D'+(i+1);card.append(a)}});
  const revealed=s.eventDay>=2;$('#polishedlogin').classList.toggle('apexRevealed',revealed);$('#polishedlogin .herocopy h2').textContent=revealed?'HALLOWEEN CHICK':'D7 APEX';$('#polishedlogin .herocopy p').textContent=revealed?'APEX · Available Day 7':'Reveals on Day 2';const apexCard=cards[6];apexCard.classList.add('apexCard');apexCard.querySelector('img').src=revealed?'apex-chick-revealed.png':'apex-chick-hidden.png';apexCard.querySelector('.itemname').textContent='Apex';
  $('#gddSummary').textContent=`Demo configuration · Entry RB${s.entryRB} · Board RB${s.boardRB??'—'} · Event day ${s.eventDay} · ${s.total} total points. Task weights/targets and pet art are placeholders; configured return-RB amounts and pet identities were not supplied.`;
  save();
 }
 async function receiveActivity(i){if(busy||!s.done[i]||s.activityClaimed[i])return;busy=true;draw();const source=$('#rows').querySelector('[data-task-index="'+i+'"]');const rect=source?.getBoundingClientRect(),scene=$('#scene').getBoundingClientRect(),scale=scene.width/1844,sx=rect?(rect.right-scene.left)/scale-90:1040,sy=rect?(rect.top-scene.top)/scale+40:350,targetY=pointY(s.total);const result=claimActivity(s,i,effectiveNow());save();if(result.ok&&result.points){const fly=document.createElement('div');fly.className='pointfly activityFly';const icon=document.createElement('img');icon.src='activity-point.png';icon.alt='';const number=document.createElement('span');number.textContent='+'+result.points;fly.append(icon,number);fly.style.left=sx+'px';fly.style.top=sy+'px';$('#scene').append(fly);try{await fly.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:'translate('+(1237-sx)+'px,'+(targetY-sy)+'px) scale(.65)',opacity:1},{transform:'translate('+(1237-sx)+'px,'+(targetY-sy)+'px) scale(.4)',opacity:0}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?1:650,easing:'ease-in-out',fill:'forwards'}).finished}finally{fly.remove()}}busy=false;draw();}
 let returnScroll=0;
 function taskGuide(i){
  if(busy||s.done[i])return;returnScroll=$('#rows').scrollTop;
  if(i<2&&document.documentElement.dataset.smooth==='true'){openLiveShop('purchase');return;}
  const box=$('#reward .rewardbox');box.replaceChildren();const title=document.createElement('h2');title.textContent=GDD_NAMES[i];const text=document.createElement('p');text.className='taskGuideText';
  text.textContent=i<2?'Buy pets in the Tailor Shop. Each purchase counts toward both Buy 3 and Buy 5.':i===2?'Use paid pet upgrades. Each paid level counts once. Free upgrades do not count.':i===3?'Stay online to progress this task. Offline time does not count.':'Complete the activity shown in your daily task configuration.';box.append(title,text);
  if(i<2)box.append(button('OPEN TAILOR SHOP',()=>{$('#reward').style.display='none';$('#shop').style.display='block';$('#shop').classList.add('guidedShop');}));
  box.append(button('BACK TO TASKS',()=>{$('#reward').style.display='none';viewTasks(true);}));$('#reward').style.display='grid';
 }
 function viewTasks(open){grantLogin(s,effectiveNow());showTasks=open;if(open)openBoard(s);$('#polishedlogin').style.display=open?'none':'flex';$('#tasks').style.display=open?'flex':'none';$('#viewtoggle').classList.toggle('showreturn',open);if($('#navlogin')){$('#navlogin').classList.toggle('active',!open);$('#navtasks').classList.toggle('active',open)}draw();}
 async function simulate(type,quantity){if(busy)return;busy=true;const gained=action(s,type,quantity,crypto.randomUUID(),effectiveNow());save();draw();if(gained){const el=document.createElement('div');el.className='pointfly';el.textContent='+'+gained;el.style.left='1010px';el.style.top='345px';$('#scene').append(el);try{await el.animate([{transform:'translate(0,0)',opacity:1},{transform:'translate(330px,-95px)',opacity:0}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?1:520,easing:'ease-out',fill:'forwards'}).finished}finally{el.remove()}}busy=false;draw();}
 const nav=document.querySelector('main>nav');nav.replaceChildren();
 nav.append(button('+4 Points',()=>{s.total+=4;save();draw();}),button('Next Day',()=>{const next=(s.utcDay+1)*86400000;grantLogin(s,next);setRevivalDay(s,s.eventDay+1);viewTasks(showTasks);}),button('Reset All',()=>{s=newRevival();s.total=0;s.today=0;s.loginGranted=true;shopMessage='';selectedPet='parrot';$('#shop').style.display='none';$('#reward').style.display='none';save();viewTasks(false);}));
 const text=document.createElement('p');text.id='gddSummary';text.hidden=true;nav.after(text);
 window.viewTasks=viewTasks;window.showLogin=()=>viewTasks(false);window.toggleTasks=()=>viewTasks(!showTasks);window.claimLogin=()=>getClaim('daily',0);
 $('.taskopen').onclick=()=>viewTasks(!showTasks);$('#tasks .head button')?.addEventListener('click',()=>viewTasks(false));$('#scene').querySelectorAll('.logincard button').forEach(b=>b.removeAttribute('onclick'));
 let selectedPet='parrot',purchaseBusy=false,shopMessage='',shopContext='purchase',suggestedPets=[],returnToTasks=true;
 function money(value){const n=BigInt(value);for(const [unit,amount]of [['Qi',1000000000000000000n],['Q',1000000000000000n],['T',1000000000000n],['B',1000000000n],['M',1000000n]])if(n>=amount)return Number(n*100n/amount)/100+' '+unit;return n.toLocaleString('en-US');}
 function renderShop(){
  const model=initShop(s),pet=SHOP_PETS.find(p=>p.id===selectedPet),holder=$('#shop');holder.replaceChildren();
  const panel=document.createElement('section');panel.className='originalShop';const background=document.createElement('img');background.className='originalShopBackground';background.src='daily-flow-shop-source.png';background.alt='Existing Tailor Shop';panel.append(background);
  const positions={reindeer:[64,201],rhino:[64,354],ostrich:[343,354],arcticfox:[64,560],parrot:[343,560],moodeng:[621,560]};
  for(const product of SHOP_PETS){const [x,y]=positions[product.id];const petName=document.createElement('span');petName.className='originalPetName';petName.style.left=(x+3)+'px';petName.style.top=(y+2)+'px';petName.textContent=product.name;panel.append(petName);const card=button('',()=>{selectedPet=product.id;shopMessage='';renderShop()});card.className='originalProductHit'+(product.id===selectedPet?' selected':'')+(suggestedPets.includes(product.id)?' suggested':'');card.style.left=x+'px';card.style.top=y+'px';card.setAttribute('aria-label','Select '+product.name+(suggestedPets.includes(product.id)?' — suggested':''));card.title=product.name;card.disabled=purchaseBusy;panel.append(card);if(suggestedPets.includes(product.id)){const badge=document.createElement('span');badge.className='originalSuggestion';badge.style.left=x+153+'px';badge.style.top=y+5+'px';badge.textContent=shopContext==='rebirth'?'Rebirth':'Suggested';panel.append(badge)}if(model.stock[product.id]!==null){const count=document.createElement('span');count.className='originalStock';count.style.left=x+7+'px';count.style.top=y+103+'px';count.textContent=model.stock[product.id]+'/'+product.stock;panel.append(count)}}
  const close=button('',()=>window.closeShop());close.className='originalShopClose';close.setAttribute('aria-label','Close Shop');panel.append(close);
  const back=button('← BACK',()=>window.closeShop());back.className='originalShopBack';panel.append(back);
  const funds=BigInt(model[pet.currency])>=BigInt(pet.price),stock=model.stock[pet.id]!==0,space=true;
  const buy=button(purchaseBusy?'BUYING…':!space?'BASE FULL':!stock?'SOLD OUT':!funds?'NO FUNDS':'BUY',purchaseSelected,purchaseBusy||!funds||!stock||!space);buy.className='originalBuy';panel.append(buy);
  const balance=document.createElement('div');balance.className='originalBalance';balance.textContent=(pet.currency==='coins'?'Coins ':'$')+money(model[pet.currency]);panel.append(balance);
  const progress=document.createElement('div');progress.className='originalTaskProgress';progress.textContent='Buy 3: '+s.progress[0]+'/3   ·   Buy 5: '+s.progress[1]+'/5';panel.append(progress);
  const msg=document.createElement('div');msg.className='originalShopMessage';msg.setAttribute('aria-live','polite');msg.textContent=shopMessage;panel.append(msg);holder.append(panel);
 }
 async function purchaseSelected(){if(purchaseBusy)return;purchaseBusy=true;renderShop();const result=buyPet(s,selectedPet,crypto.randomUUID(),effectiveNow());shopMessage=result.ok?'Purchased '+result.name+(s.done.some((done,i)=>done&&!s.activityClaimed[i])?' · Reward ready in Tasks':''):result.reason;save();draw();purchaseBusy=false;renderShop();if(result.points){const toast=document.createElement('div');toast.className='livePointToast';toast.textContent='+'+result.points+' points · Milestones updated';$('#shop').append(toast);setTimeout(()=>toast.remove(),1800);}}
 function openLiveShop(context='purchase'){returnScroll=$('#rows').scrollTop;returnToTasks=showTasks;shopContext=context;suggestedPets=shopGuideTargets(s,context);if(suggestedPets.length)selectedPet=suggestedPets[0];if(document.documentElement.dataset.smooth==='true'){shopMessage='';renderShop();}$('#shop').style.display='block';}
 const shopHotspot=document.createElement('button');shopHotspot.className='gddShopLink';shopHotspot.setAttribute('aria-label','Buy missing rebirth pets');shopHotspot.onclick=()=>openLiveShop('rebirth');$('#scene').append(shopHotspot);window.closeShop=()=>{$('#shop').style.display='none';viewTasks(returnToTasks);$('#rows').scrollTop=returnScroll};window.finishShop=async()=>{if(busy)return;$('#shop').style.display='none';viewTasks(true);$('#rows').scrollTop=returnScroll;await simulate('purchase',5)};
 window.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#shop').style.display==='block'){e.preventDefault();window.closeShop();}});
 const timer=document.createElement('div');timer.className='gddTimer';$('#scene').append(timer);function updateTimer(){const ms=Math.max(0,s.expiresAt-effectiveNow());timer.textContent=ms?'Ends in '+Math.floor(ms/86400000)+'d '+Math.floor(ms%86400000/3600000)+'h':'Event ended';}updateTimer();setInterval(updateTimer,30000);
 window.addEventListener('storage',e=>{if(e.key===key&&e.newValue){s=JSON.parse(e.newValue);draw();updateTimer()}});
 const viewButton=$('#viewtoggle');
 function refreshViewButton(){if(!viewButton)return;viewButton.style.display='block';viewButton.style.background='#2f86d7';viewButton.style.border='2px solid #b1d7ff';viewButton.style.borderRadius='9px';viewButton.style.color='#fff';viewButton.style.fontSize='24px';viewButton.style.padding='10px 18px';viewButton.style.width='254px';viewButton.style.height='69px';viewButton.querySelector('span').textContent=showTasks?'← 7-Day Login':'DAILY TASKS';}
 viewButton?.addEventListener('click',()=>setTimeout(refreshViewButton,0));
 refreshViewButton();viewTasks(false);refreshViewButton();resize();
}


