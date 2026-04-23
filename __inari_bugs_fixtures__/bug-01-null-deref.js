// Bug: user.profile can be undefined
module.exports = function getUserName(user) {
  if (!user.profile) return 'Unknown';
  return user.profile.name.toUpperCase();
}; 
