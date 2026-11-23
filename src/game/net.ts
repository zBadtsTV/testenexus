import type { DataConnection, Peer as PeerType } from 'peerjs';

export type CharacterId = 'goku' | 'naruto';

/** Mensagens trocadas entre os dois jogadores. */
export type NetMsg =
  | { t: 'hello'; ch: CharacterId }
  | { t: 's'; x: number; y: number; tex: string; fr: number | string; flip: boolean; ox: number; oy: number; hp: number; en: number; form: string }
  | { t: 'hit'; dmg: number; dir: number }
  | { t: 'ball'; x: number; y: number; dir: number; size: number; form: string };

export interface NetLink {
  isHost: boolean;
  remoteCharacter: CharacterId;
  send(msg: NetMsg): void;
  onMessage(cb: (msg: NetMsg) => void): () => void;
  onClose(cb: () => void): void;
  close(): void;
}

const PREFIX = 'aetheria-arena-';

export function makeRoomCode(): string {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

async function newPeer(id?: string): Promise<PeerType> {
  const { Peer } = await import('peerjs');
  return new Promise((resolve, reject) => {
    const peer = id ? new Peer(id) : new Peer();
    peer.on('open', () => resolve(peer));
    peer.on('error', (e) => reject(e));
  });
}

function wrap(peer: PeerType, conn: DataConnection, isHost: boolean, ch: CharacterId): Promise<NetLink> {
  return new Promise((resolve) => {
    const listeners = new Set<(m: NetMsg) => void>();
    const closers: (() => void)[] = [];
    let resolved = false;
    conn.on('data', (raw) => {
      const msg = raw as NetMsg;
      if (msg.t === 'hello' && !resolved) {
        resolved = true;
        resolve({
          isHost,
          remoteCharacter: msg.ch,
          send: (m) => conn.open && conn.send(m),
          onMessage: (cb) => {
            listeners.add(cb);
            return () => listeners.delete(cb);
          },
          onClose: (cb) => closers.push(cb),
          close: () => {
            conn.close();
            peer.destroy();
          },
        });
        return;
      }
      listeners.forEach((l) => l(msg));
    });
    conn.on('close', () => closers.forEach((c) => c()));
    const hello = () => conn.send({ t: 'hello', ch } satisfies NetMsg);
    if (conn.open) hello();
    else conn.on('open', hello);
  });
}

/** Cria a sala e espera o outro jogador entrar. */
export async function hostRoom(code: string, ch: CharacterId): Promise<{ link: Promise<NetLink>; cancel: () => void }> {
  const peer = await newPeer(PREFIX + code);
  const link = new Promise<NetLink>((resolve) => {
    peer.on('connection', (conn) => {
      void wrap(peer, conn, true, ch).then(resolve);
    });
  });
  return { link, cancel: () => peer.destroy() };
}

export async function joinRoom(code: string, ch: CharacterId): Promise<NetLink> {
  const peer = await newPeer();
  const conn = peer.connect(PREFIX + code.trim().toUpperCase(), { reliable: true });
  const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('Sala não encontrada')), 10000));
  return Promise.race([wrap(peer, conn, false, ch), timeout]);
}
