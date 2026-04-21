// Bug: data may be undefined when API returns empty
module.exports = function sumItems(data) {
  let total = 0;
  (data ?? []).forEach(item => { total += item.value; });
  return total;
};