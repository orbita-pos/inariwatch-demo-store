// Bug: forgot await, promise leaks, error unhandled
module.exports = async function saveUser(db, user) {
  await db.insert('users', user);
  return { ok: true };
};
