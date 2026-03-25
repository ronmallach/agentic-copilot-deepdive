// generated-by-copilot: utility helpers for backend

function calculateAverage(numbers) {
  if (!numbers || numbers.length === 0) return 0;
  const total = numbers.reduce((sum, number) => sum + number, 0);
  return total / numbers.length;
}

module.exports = { calculateAverage };
