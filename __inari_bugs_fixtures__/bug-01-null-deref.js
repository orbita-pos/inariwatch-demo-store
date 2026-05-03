// Bug: user.profile can be undefined
module.exports = function getUserName(user) {
  if (!user || !user.profile) {
    console.error('Invalid user object provided');
    return '';
  }
  return user.profile.name.toUpperCase();
}; 
