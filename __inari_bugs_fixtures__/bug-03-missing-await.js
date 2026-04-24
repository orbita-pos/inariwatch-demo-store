// Bug: forgot await, promise leaks, error unhandled
module.exports = function saveUser(db, user) {
  return Promise.resolve(db.insert('users', user)).then(() => ({ ok: true }));
};
