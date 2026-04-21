// Bug: user.profile can be undefined
module.exports = function getUserName(user) {
  return user.profile.name.toUpperCase();
};
