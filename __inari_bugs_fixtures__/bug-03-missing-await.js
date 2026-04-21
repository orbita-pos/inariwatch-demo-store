// Bug: forgot await, promise leaks, error unhandled
module.exports = async function saveUser(db, user) {
  db.insert('users', user);
  return { ok: true };
};
