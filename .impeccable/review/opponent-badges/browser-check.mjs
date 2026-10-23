// Real UI joins against the loopback-only fixture; no production state injection.
import { chromium } from '/Users/rizx/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const out = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({headless:true});
const results = [], failures = [];
const confirmation = process.argv.includes('--confirmation');
const check = (truth, message) => { if (!truth) failures.push(message); };
async function settle(page) {
  await page.mouse.move(5,5);
  await page.waitForTimeout(300);
  await page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity));
}
try {
  for (const [name,width,height,code,reduced] of [
    ['desktop',1440,900,'BADGE6'], ['owner',845,765,'BADGE6'],
    ['six-owner',845,765,'CNT234'], ['six-phone-844',844,390,'CNT234'],
    ['six-phone-568',568,320,'CNT234'], ['states-844',844,390,'LNG234'],
    ['states-568',568,320,'LNG234'], ['active',845,765,'DRAW23'],
    ['active-reduced',568,320,'DRAW23',true],
  ].filter(([name])=>!confirmation||['owner','states-844','states-568'].includes(name))) {
    const context=await browser.newContext({viewport:{width,height},isMobile:height<460,hasTouch:height<460,reducedMotion:reduced?'reduce':'no-preference'});
    const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
    try {
      await page.goto('http://localhost:3010',{waitUntil:'domcontentloaded'});
      await page.getByRole('button',{name:'Join a room',exact:true}).click();
      await page.getByLabel('Your name',{exact:true}).fill('Preview');
      await page.getByLabel('Room code',{exact:true}).fill(code);
      await page.getByRole('button',{name:'Join the table',exact:true}).click();
      await page.locator('.game-page').waitFor();
      await page.evaluate(async()=>{await document.fonts.ready;const image=new Image();image.src='/artwork/game-room-evening.webp';await image.decode();});
      if(name.startsWith('active')) {
        await page.locator('.draw-pile').click();
        await page.waitForFunction(()=>document.querySelectorAll('[data-hand-card]').length===20);
      }
      await settle(page);
      await page.screenshot({path:path.join(out,`after-${name}.png`)});
      if(name==='owner'){const r=await page.locator('.opponent-label').first().boundingBox();await page.screenshot({path:path.join(out,'after-badge-detail.png'),clip:{x:r.x-12,y:r.y-80,width:r.width+26,height:r.height+96}});}
      const state=await page.evaluate(()=>{
        const rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
        return {document:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],viewport:[innerWidth,innerHeight],seats:[...document.querySelectorAll('.opponent-label')].map(n=>{
          const name=n.querySelector('strong'),status=n.querySelector('small'),count=n.querySelector('[role="img"]'),avatar=n.querySelector('.player-avatar');
          return {name:name.textContent,status:status?.textContent,count:count.getAttribute('aria-label'),countText:count.textContent.trim(),rect:rect(n),avatar:rect(avatar),number:rect(count),statusFits:!status||status.scrollWidth<=status.clientWidth+1,nameTruncated:name.scrollWidth>name.clientWidth+1,active:n.closest('.active-seat')!==null,accessibleTurn:n.textContent.includes('Current turn'),transition:getComputedStyle(count).transitionDuration};
        })};
      });
      check(JSON.stringify(state.document)===JSON.stringify(state.viewport),`${name}: game fits viewport`);
      check(state.seats.length===(code==='BADGE6'?2:5),`${name}: all seats rendered`);
      for(const seat of state.seats){
        check(seat.rect.x>=0&&seat.rect.y>=0&&seat.rect.right<=width&&seat.rect.bottom<=height,`${name}/${seat.name}: complete identity in viewport`);
        check(seat.rect.height>=44,`${name}/${seat.name}: 44px identity target`);
        check(seat.statusFits,`${name}/${seat.name}: full special-state caption`);
        check(seat.count===`${seat.countText} ${seat.countText==='1'?'card':'cards'}`,`${name}/${seat.name}: exact count semantics`);
        check(seat.active===seat.accessibleTurn,`${name}/${seat.name}: accessible turn agrees`);
        if(reduced)check(seat.transition==='0s',`${name}/${seat.name}: no counter transition with reduced motion`);
      }
      for(let i=0;i<state.seats.length;i++)for(let j=i+1;j<state.seats.length;j++){
        const a=state.seats[i].rect,b=state.seats[j].rect;
        check(a.right<=b.x||b.right<=a.x||a.bottom<=b.y||b.bottom<=a.y,`${name}: identity surfaces do not overlap`);
      }
      if(code==='CNT234')check(state.seats[0].count==='12 cards'&&state.seats[1].count==='24 cards',`${name}: two-digit counts retained`);
      if(code==='LNG234'){
        const button=page.getByRole('button',{name:'Catch Alexandria’s missed UNO',exact:true});
        await page.keyboard.press('Tab');await button.focus();await settle(page);
        check(await button.evaluate(n=>n.matches(':focus-visible')&&getComputedStyle(n).outlineWidth==='3px'),`${name}: visible keyboard focus`);await page.screenshot({path:path.join(out,`after-${name}-focus.png`)});
        await page.keyboard.press('Enter');await page.waitForTimeout(400);
        check(await button.count()===0,`${name}: one keyboard activation catches missed UNO`);
        const changed=await page.locator('.opponent-label').first().getByRole('img').getAttribute('aria-label');
        check(changed==='3 cards',`${name}: catch updates exact count to three`);
      }
      check(!errors.length,`${name}: no browser exceptions`);results.push({name,...state,errors});
    }catch(error){failures.push(`${name}: ${error.message}`);await page.screenshot({path:path.join(out,`failure-${name}.png`)});}
    await context.close();
  }
  fs.writeFileSync(path.join(out,confirmation?'confirmation-metrics.json':'metrics.json'),JSON.stringify({results,failures},null,2)+'\n');
  console.log(JSON.stringify({cases:results.length,failures},null,2));if(failures.length)process.exitCode=1;
}finally{await browser.close();}
