// Weighted Sum Method (WSM) calculation logic.
// This module is independent of HTTP: every function takes plain data and
// returns new data without modifying its input. It assumes the input has
// already been checked by wsm.validator.js.

// Get the list of criteria names from the weights object
// e.g. { price: 0.4, quality: 0.6 } -> ['price', 'quality']
function getCriteriaNames(weights) {
  return Object.keys(weights);
}

// Find the minimum and maximum value of each criterion across all alternatives
// e.g. { price: { min: 80, max: 150 }, quality: { min: 6, max: 9 } }
function findCriteriaExtremes(alternatives, criteriaNames) {
  const extremes = {};

  for (const criterion of criteriaNames) {
    const values = alternatives.map(alternative => alternative.criteria[criterion]);
    extremes[criterion] = {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  return extremes;
}

// Normalize a single value to the range (0, 1]
// Benefit criterion (higher is better): value / max
// Cost criterion (lower is better):     min / value
function normalizeValue(value, type, { min, max }) {
  return type === 'cost' ? min / value : value / max;
}

// Normalize every criterion value of every alternative
// Returns a new array: [{ name, normalized: { price: 0.8, quality: 0.889, ... } }]
function normalizeAlternatives(alternatives, criteriaNames, criteriaTypes) {
  const extremes = findCriteriaExtremes(alternatives, criteriaNames);

  return alternatives.map(alternative => {
    const normalized = {};

    for (const criterion of criteriaNames) {
      normalized[criterion] = normalizeValue(
        alternative.criteria[criterion],
        criteriaTypes[criterion],
        extremes[criterion]
      );
    }

    return { name: alternative.name, normalized };
  });
}

// Calculate the WSM score of one alternative: sum of (normalized value x weight)
function calculateWeightedScore(normalized, weights) {
  return Object.keys(weights).reduce(
    (sum, criterion) => sum + normalized[criterion] * weights[criterion],
    0
  );
}

// Calculate the WSM score of every alternative
// Returns a new array: [{ name, score }]
function scoreAlternatives(normalizedAlternatives, weights) {
  return normalizedAlternatives.map(({ name, normalized }) => ({
    name,
    score: calculateWeightedScore(normalized, weights),
  }));
}

// Sort alternatives by score from highest to lowest
// Alternatives with the same score keep their original input order
function rankAlternatives(scoredAlternatives) {
  return [...scoredAlternatives].sort((a, b) => b.score - a.score);
}

// Round a number to 3 decimal places for readability
function roundScore(score, decimals = 3) {
  const factor = 10 ** decimals;
  return Math.round((score + Number.EPSILON) * factor) / factor;
}

// Calculate summary statistics of the scores (highest, lowest, average, range)
function computeStatistics(scores) {
  const highest = Math.max(...scores);
  const lowest = Math.min(...scores);
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  return {
    highestScore: roundScore(highest),
    lowestScore: roundScore(lowest),
    averageScore: roundScore(average),
    scoreRange: roundScore(highest - lowest),
  };
}

// Build the final response object
// Scores are rounded here (and only here) so that ranking uses the exact values
function formatResult(rankedAlternatives, criteriaNames) {
  const results = rankedAlternatives.map(({ name, score }) => ({
    name,
    score: roundScore(score),
  }));

  return {
    bestAlternative: results[0],
    results,
    statistics: computeStatistics(rankedAlternatives.map(({ score }) => score)),
    metadata: {
      method: 'WSM',
      totalAlternatives: results.length,
      totalCriteria: criteriaNames.length,
      criteria: criteriaNames,
      timestamp: new Date().toISOString(),
    },
  };
}

// Main entry point: run the full WSM process on one input dataset
// Steps: normalize -> apply weights -> rank -> format
function runWSM({ alternatives, weights, criteriaTypes }) {
  const criteriaNames = getCriteriaNames(weights);
  const normalizedAlternatives = normalizeAlternatives(alternatives, criteriaNames, criteriaTypes);
  const scoredAlternatives = scoreAlternatives(normalizedAlternatives, weights);
  const rankedAlternatives = rankAlternatives(scoredAlternatives);

  return formatResult(rankedAlternatives, criteriaNames);
}

module.exports = {
  runWSM,
  getCriteriaNames,
  findCriteriaExtremes,
  normalizeValue,
  normalizeAlternatives,
  calculateWeightedScore,
  scoreAlternatives,
  rankAlternatives,
  roundScore,
  computeStatistics,
  formatResult,
};
