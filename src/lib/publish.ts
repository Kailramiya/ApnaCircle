// Reconciliation is intentionally conservative: an absent read after a timeout
// does not prove a delayed database write cannot still commit.
export class UnconfirmedPublish extends Error {
  constructor(cause: unknown) { super('Publish outcome is unconfirmed', { cause }); }
}
export async function publishOnce<T>(operations: {
  find: () => Promise<T | null>;
  upload: () => Promise<void>;
  insert: () => Promise<T>;
}): Promise<T> {
  try {
    const previous = await operations.find();
    if (previous) return previous;
    await operations.upload();
    try { return await operations.insert(); }
    catch (error) {
      const reconciled = await operations.find();
      if (reconciled) return reconciled;
      throw error;
    }
  } catch (error) { throw new UnconfirmedPublish(error); }
}
