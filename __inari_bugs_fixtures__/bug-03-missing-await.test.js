const saveUser = require('./bug-03-missing-await');

describe('bug-03-missing-await regression', () => {
  test('awaits db.insert before returning success', async () => {
    let inserted = false;
    const db = {
      insert: jest.fn(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              inserted = true;
              resolve(['saved-user']);
            }, 0);
          })
      ),
    };

    const result = await saveUser(db, { id: 1, name: 'Ada' });

    expect(db.insert).toHaveBeenCalledWith('users', { id: 1, name: 'Ada' });
    expect(inserted).toBe(true);
    expect(result).toEqual({ ok: true });
  });

  test('propagates insert rejection instead of returning before the async work settles', async () => {
    const db = {
      insert: jest.fn(async () => {
        throw new Error('insert failed');
      }),
    };

    await expect(saveUser(db, { id: 2 })).rejects.toThrow('insert failed');
  });
});
