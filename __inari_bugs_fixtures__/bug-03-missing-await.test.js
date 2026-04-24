const saveUser = require('./bug-03-missing-await');

describe('bug-03-missing-await regression', () => {
  test('waits for the insert to finish before resolving', async () => {
    let insertFinished = false;
    const db = {
      insert: jest.fn(() => new Promise((resolve) => {
        setTimeout(() => {
          insertFinished = true;
          resolve();
        }, 0);
      })),
    };

    const result = await saveUser(db, { id: 1, name: 'Ada' });

    expect(db.insert).toHaveBeenCalledWith('users', { id: 1, name: 'Ada' });
    expect(insertFinished).toBe(true);
    expect(result).toEqual({ ok: true });
  });

  test('propagates insert rejection instead of leaking an unhandled promise rejection', async () => {
    const error = new Error('database connection closed');
    const db = {
      insert: jest.fn().mockRejectedValue(error),
    };

    await expect(saveUser(db, { id: 2 })).rejects.toThrow('database connection closed');
  });
});
