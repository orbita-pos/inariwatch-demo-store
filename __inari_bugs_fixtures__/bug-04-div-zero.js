// Bug: no check for count=0 results in Infinity
module.exports = function average(values) {
  const count = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  if (count === 0) {
    return 0;
  }
  return sum / count;
};
