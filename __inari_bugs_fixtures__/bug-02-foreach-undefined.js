// Bug: data may be undefined when API returns empty
module.exports = function processItems(data = []) {
  if (!Array.isArray(data)) {
    return 0;
  }
  let total = 0;
  data.forEach(item => { total += item.value; });
  return total;
};
