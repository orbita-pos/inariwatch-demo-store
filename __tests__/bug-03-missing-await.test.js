const saveUser = require('../__inari_bugs_fixtures__/bug-03-missing-await');

describe('bug-03-missing-await regression', () => {
  test('awaits db.insert before returning success', async () => {
    let insertCompleted = false;
    const db = {
      insert: () =>
        new Promise((resolve) => {
          setTimeout(() => {
            insertCompleted = true;
            resolve([{ id: 1 }]);
          }, 0);
        }),
    };

    const result = await saveUser(db, { name: 'Ada' });

    expect(insertCompleted).toBe(true);
    expect(result).toEqual({ ok: true });
  });

  test('propagates insert rejection instead of returning success early', async () => {
    const db = {
      insert: () => Promise.reject(new Error('insert failed')),
    };

    await expect(saveUser(db, { name: 'Ada' })).rejects.toThrow('insert failed');
  });
});
