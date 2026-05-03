// Bug: user.profile can be undefined
module.exports = function getUserName(user) {
  const profile = user.profile || {};
  return String(profile.name || '').toUpperCase();
};
