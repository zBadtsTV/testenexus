// Recortes gerados por tools/prepare_fighters.py (células 256x300, pés em y=280).
import naruto_idle from './assets/naruto_idle.png.asset.json';
import naruto_walk from './assets/naruto_walk.png.asset.json';
import naruto_run from './assets/naruto_run.png.asset.json';
import naruto_air from './assets/naruto_air.png.asset.json';
import naruto_rasengan_a from './assets/naruto_rasengan_a.png.asset.json';
import naruto_rasengan_b from './assets/naruto_rasengan_b.png.asset.json';
import naruto_rasengan_c from './assets/naruto_rasengan_c.png.asset.json';
import naruto_punch from './assets/naruto_punch.png.asset.json';
import naruto_charge_a from './assets/naruto_charge_a.png.asset.json';
import naruto_charge_b from './assets/naruto_charge_b.png.asset.json';
import goku_punch_normal from './assets/goku_punch_normal.png.asset.json';
import goku_punch_ssj from './assets/goku_punch_ssj.png.asset.json';
import goku_punch_kaioken from './assets/goku_punch_kaioken.png.asset.json';
import hud_naruto from './assets/hud_naruto.png.asset.json';
import hud_goku from './assets/hud_goku.png.asset.json';
import btn_up from './assets/btn_up.png.asset.json';
import btn_left from './assets/btn_left.png.asset.json';
import btn_right from './assets/btn_right.png.asset.json';
import btn_special from './assets/btn_special.png.asset.json';
import btn_punch from './assets/btn_punch.png.asset.json';
import arena from './assets/arena.jpg.asset.json';
import select_base from './assets/select_base.jpg.asset.json';
import select_naruto from './assets/select_naruto.jpg.asset.json';
import select_goku from './assets/select_goku.jpg.asset.json';

export const FIGHTER_STRIPS: Record<string, string> = {
  naruto_idle: naruto_idle.url,
  naruto_walk: naruto_walk.url,
  naruto_run: naruto_run.url,
  naruto_air: naruto_air.url,
  naruto_rasengan_a: naruto_rasengan_a.url,
  naruto_rasengan_b: naruto_rasengan_b.url,
  naruto_rasengan_c: naruto_rasengan_c.url,
  naruto_punch: naruto_punch.url,
  naruto_charge_a: naruto_charge_a.url,
  naruto_charge_b: naruto_charge_b.url,
  goku_punch_normal: goku_punch_normal.url,
  goku_punch_ssj: goku_punch_ssj.url,
  goku_punch_kaioken: goku_punch_kaioken.url,
};

export const SCREEN_IMAGES = {
  hud_naruto: hud_naruto.url,
  hud_goku: hud_goku.url,
  btn_up: btn_up.url,
  btn_left: btn_left.url,
  btn_right: btn_right.url,
  btn_special: btn_special.url,
  btn_punch: btn_punch.url,
  arena: arena.url,
  select_base: select_base.url,
  select_naruto: select_naruto.url,
  select_goku: select_goku.url,
};
