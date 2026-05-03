const saveUser = require('../__inari_bugs_fixtures__/bug-03-missing-await');

describe('bug-03-missing-await regression', () => {
  test('awaits db.insert before returning success', async () => {
    let inserted = false;
    const db = {
      insert: jest.fn(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              inserted = true;
              resolve([{ id: 1 }]);
            }, 0);
          })
      ),
    };

    const result = await saveUser(db, { name: 'Ada' });

    expect(db.insert).toHaveBeenCalledWith('users', { name: 'Ada' });
    expect(inserted).toBe(true);
    expect(result).toEqual({ ok: true });
  });

  test('rejects when db.insert rejects instead of returning success early', async () => {
    const error = new Error('insert failed');
    const db = {
      insert: jest.fn().mockRejectedValue(error),
    };

    await expect(saveUser(db, { name: 'Ada' })).rejects.toThrow('insert failed');
    expect(db.insert).toHaveBeenCalledWith('users', { name: 'Ada' });
  });
});
