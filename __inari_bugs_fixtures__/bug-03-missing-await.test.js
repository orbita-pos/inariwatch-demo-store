const saveUser = require('./bug-03-missing-await');

describe('bug-03-missing-await regression', () => {
  test('awaits the insert before resolving', async () => {
    let insertFinished = false;
    let resolveInsert;

    const db = {
      insert: jest.fn(() => new Promise((resolve) => {
        resolveInsert = () => {
          insertFinished = true;
          resolve();
        };
      })),
    };

    const savePromise = saveUser(db, { id: 1, name: 'A' });

    let resolved = false;
    savePromise.then(() => {
      resolved = true;
    });

    await Promise.resolve();

    expect(db.insert).toHaveBeenCalledWith('users', { id: 1, name: 'A' });
    expect(insertFinished).toBe(false);
    expect(resolved).toBe(false);

    resolveInsert();

    await expect(savePromise).resolves.toEqual({ ok: true });
    expect(insertFinished).toBe(true);
    expect(resolved).toBe(true);
  });

  test('propagates insert rejection instead of leaking an unhandled rejection', async () => {
    const dbError = new Error('database connection closed');
    const db = {
      insert: jest.fn().mockRejectedValue(dbError),
    };

    await expect(saveUser(db, { id: 2 })).rejects.toThrow('database connection closed');
    expect(db.insert).toHaveBeenCalledWith('users', { id: 2 });
  });
});
