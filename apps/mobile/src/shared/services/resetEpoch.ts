// Reset demo data bumps the epoch. Async work (outbox flush, snapshot load)
// captures the epoch when it starts and skips its local writes if it changed,
// so nothing started before a reset is written after it (Spec 02, OC-17).

let epoch = 0;

export function currentEpoch(): number {
  return epoch;
}

export function bumpEpoch(): number {
  epoch += 1;
  return epoch;
}
