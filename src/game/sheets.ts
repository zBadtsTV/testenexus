import { FORM_SHEETS as RAW, type SheetInfo, type FormId } from './formSheets';

function frames<K extends string>(sheet: SheetInfo, keys: readonly K[]): Record<K, number[]> {
  return Object.fromEntries(keys.map((key) => {
    const row = sheet.frames[key];
    if (!row?.length) throw new Error(`Missing animation ${sheet.texture}:${key}`);
    return [key, row];
  })) as Record<K, number[]>;
}

function form(id: FormId) {
  const { body, aura, shot } = RAW[id];
  return {
    body: { ...body, frames: frames(body, ['idle', 'walk_right', 'walk_left', 'run_right', 'run_left', 'air']) },
    aura: aura ? {
      ...aura,
      frames: { ...frames(aura, ['charge_start', 'charge']), transform: aura.frames['transform'] },
    } : null,
    shot: { ...shot, frames: frames(shot, ['hold', 'small']) },
  };
}

export const FORM_SHEETS = { normal: form('normal'), ssj: form('ssj'), kaioken: form('kaioken') };