module.exports = function average(values) {
  const count = values.length;
  if (count === 0) {
    return 0;
  }
  const sum = values.reduce((a, b) => a + b, 0);
  return sum / count;
};