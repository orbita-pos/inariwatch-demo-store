module.exports = function average(values) {
  const count = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  return count === 0 ? 0 : sum / count;
};
