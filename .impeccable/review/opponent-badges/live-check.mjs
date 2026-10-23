// Read-only release smoke check; each new context plays its own local bot game.
import { chromium } from '/Users/rizx/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const out=process.env.LIVE_PROOF_DIR;
assert.ok(out,'Set LIVE_PROOF_DIR to a persistent evidence directory');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});const results=[];
try{for(const [name,width,height] of [['owner',845,765],['phone',568,320]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:height<460,hasTouch:height<460});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('https://uno-wheat-ten.vercel.app/',{waitUntil:'domcontentloaded'});
  assert.match(await page.locator('[data-design-contract="uno-play-field"]').textContent(),/opponent-badges\/contract/);
  await page.evaluate(()=>document.fonts.ready);
  await page.getByRole('button',{name:'Play with bots',exact:true}).click();await page.locator('.game-page').waitFor();
  await page.evaluate(async()=>{const i=new Image();i.src='/artwork/game-room-evening.webp';await i.decode();});
  await page.locator('.hand-section.your-turn').waitFor();await page.mouse.move(5,5);await page.waitForTimeout(500);
  const state=await page.evaluate(()=>({document:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],viewport:[innerWidth,innerHeight],seats:[...document.querySelectorAll('.opponent-label')].map(n=>({name:n.querySelector('strong').textContent,count:n.querySelector('[role="img"]').getAttribute('aria-label'),avatarWidth:n.querySelector('.player-avatar').getBoundingClientRect().width,width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height}))}));
  assert.equal(state.seats.length,2);assert.deepEqual(state.document,state.viewport);assert.ok(state.seats.every(s=>s.height>=44&&/^\d+ cards?$/.test(s.count)));
  assert.equal(Math.round(state.seats[0].width),height<460?102:160);
  assert.deepEqual(errors,[]);await page.screenshot({path:`${out}/live-${name}.png`});
  if(name==='owner'){const r=await page.locator('.opponent-label').first().boundingBox();await page.screenshot({path:`${out}/live-badge-detail.png`,clip:{x:r.x-12,y:r.y-80,width:r.width+26,height:r.height+96}});}
  results.push({name,...state,errors});await page.close();
}fs.writeFileSync(`${out}/live-metrics.json`,JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify({publicChecks:results.length,failures:[]},null,2));}finally{await browser.close();}
