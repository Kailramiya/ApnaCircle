let activeId: string | null = null;
let epoch = 0;
export function switchAccount(id: string | null) {
  if (activeId === id) return false;
  activeId = id;
  epoch += 1;
  return true;
}
export function captureAccount() {
  if (!activeId) throw new Error('No active account');
  return { id: activeId, epoch };
}
export function isCurrentAccount(account: ReturnType<typeof captureAccount>) {
  return account.id === activeId && account.epoch === epoch;
}
export function assertCurrentAccount(account: ReturnType<typeof captureAccount>) {
  if (!isCurrentAccount(account)) throw new Error('Account changed');
}
