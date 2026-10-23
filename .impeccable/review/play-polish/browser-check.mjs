// Production-browser checks against the loopback-only shared-table fixture.
import { chromium } from '/Users/rizx/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const out = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
const results = [], failures = [];
const reconnectOnly = process.argv.includes('--seats-only');
const check = (truth, message) => { if (!truth) failures.push(message); };
async function capture(page, name) { await page.mouse.move(5, 5); await page.waitForTimeout(250); await page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity)); await page.screenshot({ path: path.join(out, `${name}.png`) }); }
async function visibleControls(page, selector) {
  return page.locator(selector).evaluateAll(nodes => nodes.map(node => {
    const r = node.getBoundingClientRect(); return { name: node.getAttribute('aria-label') || node.textContent.trim(), x:r.x, y:r.y, width:r.width, height:r.height, visible:r.x>=0 && r.y>=0 && r.right<=innerWidth && r.bottom<=innerHeight };
  }));
}
async function join(page, code) {
  await page.getByRole('button', { name:'Join a room', exact:true }).click();
  await page.getByLabel('Your name', { exact:true }).fill('Preview');
  await page.getByLabel('Room code', { exact:true }).fill(code);
  await page.getByRole('button', { name:'Join the table', exact:true }).click();
  await page.locator('.game-page').waitFor();
  await page.evaluate(async () => { await document.fonts.ready; const image = new Image(); image.src='/artwork/game-room-evening.webp'; await image.decode(); });
  await page.waitForTimeout(500);
}
async function drag(page, cancel) {
  const card = page.getByRole('button', {name:'Play green discard all', exact:true});
  // Real touch input avoids desktop hover/focus changing the phone fan's pose.
  const before = await card.boundingBox();
  const x = before.x + before.width*.55, y = before.y + 28;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[{x,y}]});
  await cdp.send('Input.dispatchTouchEvent', {type:'touchMove', touchPoints:[{x,y:y-28}]});
  await page.locator('[data-held-card]').waitFor();
  const held = await page.locator('[data-held-card]').boundingBox();
  check(Math.abs(held.width-before.width)<2 && Math.abs(held.height-before.height)<2, 'Touch pickup preserves the rendered fan size/angle');
  check(Math.abs(held.x-before.x)<2 && Math.abs(held.y-(before.y-28))<2, 'Touch pickup follows the finger without a position jump');
  await page.screenshot({path:path.join(out, cancel ? 'phone-drag-cancel.png' : 'phone-drag-return.png')});
  await cdp.send('Input.dispatchTouchEvent', {type:cancel?'touchCancel':'touchEnd', touchPoints:[]});
  await page.waitForTimeout(220);
  check(await page.locator('[data-held-card]').count()===0, 'Rejected/cancelled drag cleans up its held card');
  check(await page.locator('[data-hand-card]').count()===7, 'A rejected/cancelled lift does not play');
  await card.focus(); await page.keyboard.press(cancel?'Enter':'Space');
  await page.waitForTimeout(300);
  check(await page.locator('[data-hand-card]').count()===6, 'Cancel/return must not suppress the next keyboard activation');
  await cdp.detach();
  return {before, held};
}
try {
  if (!reconnectOnly) {
  for (const [name,width,height,reduced] of [ ['desktop',1440,900,false], ['owner',848,765,false], ['phone-844',844,390,false], ['phone-568',568,320,false], ['reduced',844,390,true] ]) {
    const context=await browser.newContext({viewport:{width,height}, isMobile:height<460, hasTouch:height<460, reducedMotion:reduced?'reduce':'no-preference'});
    const page=await context.newPage(); const errors=[]; page.on('pageerror', e=>errors.push(e.message));
    try {
      await page.goto('http://localhost:3010', {waitUntil:'domcontentloaded'}); await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(350);
      const starts=await visibleControls(page,'.launch-play .launch-action');
      check(starts.every(b=>b.visible && b.height>=44), `${name}: all3 start actions in the first viewport`);
      await capture(page,`after-${name}-home`);
      await join(page,height<460?'ANGLE7':'THREE3');
      await capture(page,`after-${name}-play`);
      const geometry=await page.evaluate(()=>{
        const pile=document.querySelector('[data-discard-pile] .uno-card').getBoundingClientRect();
        const normal=[...document.querySelectorAll('.quiet-card .uno-card')].map(c=>c.getBoundingClientRect().top);
        return {gap:Math.min(...normal)-pile.bottom, document:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],viewport:[innerWidth,innerHeight],scrollTop:document.querySelector('.hand-scroll').scrollTop};
      });
      check(JSON.stringify(geometry.document)===JSON.stringify(geometry.viewport),`${name}: no game document scrolling`);
      check(geometry.scrollTop===0,`${name}: hand has no vertical scroll`);
      if(height>460)check(geometry.gap<85,`${name}: piles and hand share a close lane`);
      await page.getByRole('button',{name:'Game menu',exact:true}).click(); await page.waitForTimeout(250);
      const menu=await visibleControls(page,'dialog[open] button');
      check(menu.every(b=>b.visible&&b.height>=44),`${name}: complete menu with44px targets`);
      check(await page.locator('dialog[open]').evaluate(d=>d.scrollHeight<=d.clientHeight+1),`${name}: menu requires no scrolling`);
      await capture(page,`after-${name}-menu`);
      const sort=page.getByRole('button',{name:'Sort by color',exact:true}); const was=await sort.getAttribute('aria-pressed'); await sort.click();
      check((await sort.getAttribute('aria-pressed'))!==was,`${name}: sorting state and caption agree`); await sort.click();
      await page.keyboard.press('Escape'); await page.waitForTimeout(80);
      check(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')==='Game menu'),`${name}: native menu focus return`);
      await page.getByRole('button',{name:'Play wild draw four',exact:true}).first().click(); await page.locator('.color-picker-modal[open]').waitFor(); await page.waitForTimeout(250);
      const wild=await visibleControls(page,'.color-picker-modal button');check(wild.every(b=>b.visible&&b.height>=44),`${name}: complete wild decision`);
      await capture(page,`after-${name}-wild`); await page.getByRole('button',{name:'Keep the wild card',exact:true}).click();
      let touch;
      if(name==='phone-844'||name==='phone-568')touch=await drag(page,name==='phone-568');
      results.push({name,starts,geometry,menu,wild,touch,errors});check(!errors.length,`${name}: no page errors`);
    } catch(error){failures.push(`${name}: ${error.message}`); await page.screenshot({path:path.join(out,`failure-${name}.png`)});}
    await context.close();
  }
  for(const [width,height] of [[844,390],[568,320]]) {
    const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});const page=await context.newPage();
    await page.goto('http://localhost:3010',{waitUntil:'domcontentloaded'});await join(page,'DRAW23');
    await page.locator('.draw-pile').click();await page.waitForFunction(()=>document.querySelectorAll('[data-hand-card]').length===20);
    const last=page.locator('[data-hand-card] button').first();await last.focus();await page.keyboard.press('End');
    await capture(page,`after-large-${width}`);
    const large=await page.evaluate(()=>({count:document.querySelectorAll('[data-hand-card]').length,scroll:document.querySelector('.hand-scroll').scrollLeft,top:document.querySelector('.hand-scroll').scrollTop,focusedLast:document.activeElement===document.querySelector('[data-hand-card]:last-child button')}));
    check(large.count===20&&large.scroll>0&&large.top===0&&large.focusedLast,`${width}: large-hand keyboard reach`);results.push({name:`large-${width}`,large});await context.close();
  }
  for(const [width,height] of [[848,765],[844,390],[568,320]]) {
    const context=await browser.newContext({viewport:{width,height},isMobile:height<460,hasTouch:height<460});const page=await context.newPage();
    await page.goto('http://localhost:3010',{waitUntil:'domcontentloaded'});await join(page,'THREE3');
    if(height>460){await page.getByRole('button',{name:'Play green discard all',exact:true}).hover();await page.waitForTimeout(250);await page.screenshot({path:path.join(out,`after-hover-${width}.png`)});}
    await page.locator('.draw-pile').click();await page.getByRole('button',{name:'Pass',exact:true}).waitFor();await capture(page,`after-pass-${width}`);
    const pass=await visibleControls(page,'.move-buttons button');check(pass.every(b=>b.visible&&b.height>=44),`${width}: contextual Pass is reachable`);
    await page.getByRole('button',{name:'Pass',exact:true}).click();await page.waitForTimeout(200);check(await page.locator('.hand-section.your-turn').count()===0,`${width}: Pass advances the actual turn`);
    results.push({name:`pass-${width}`,pass});await context.close();
  }
  }
  for(const [width,height] of [[844,390],[568,320]]) {
    const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});const page=await context.newPage();
    await page.goto('http://localhost:3010',{waitUntil:'domcontentloaded'});await join(page,'LNG234');await capture(page,`after-seats-${width}`);
    const seats=await visibleControls(page,'.opponent-label');check(seats.length===5&&seats.every(s=>s.visible&&s.height>=44),`${width}: all five readable identity surfaces fit`);
    const catchButton=page.getByRole('button',{name:'Catch Alexandria’s missed UNO',exact:true});check(await catchButton.count()===1,`${width}: inline catch is findable`);
    await catchButton.click(); await page.waitForTimeout(300);check(await catchButton.count()===0,`${width}: catching updates actual eligibility`);
    results.push({name:`seats-${width}`,seats});await context.close();
  }
  fs.writeFileSync(path.join(out,reconnectOnly?'reconnect-metrics.json':'metrics.json'),JSON.stringify({results,failures},null,2)+'\n');
  console.log(JSON.stringify({cases:results.length,failures},null,2));
  if(failures.length)process.exitCode=1;
} finally {await browser.close();}
