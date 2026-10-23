// helper function
// Check whether a value is a plain object like { ... } (not null, not an array)
function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Check whether a value is a finite number greater than 0
function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
// *************************

// Check that the top-level structure has alternatives, weights and criteriaTypes
function validateStructure(data) {
  const errors = [];

  if (!isPlainObject(data)) {
    errors.push('Input must be a JSON object');
    return errors;   // 連物件都不是，後面的檢查都沒意義
  }

  if (!Array.isArray(data.alternatives) || data.alternatives.length < 2) {
    errors.push('"alternatives" must be an array with at least 2 alternatives');
  }
  if (!isPlainObject(data.weights) || Object.keys(data.weights).length === 0) {
    errors.push('"weights" must be a non-empty object');
  }
  if (!isPlainObject(data.criteriaTypes) || Object.keys(data.criteriaTypes).length === 0) {
    errors.push('"criteriaTypes" must be a non-empty object');
  }

  return errors;
}

// Check that every weight is a non-negative number and all weights sum to 1.0
function validateWeights(weights) {
  const errors = [];

  // 把一個 Object 轉換成 由 [key, value] 配對組成的 Array，逐一取出 Array 中的元素
  for (const [criterion, weight] of Object.entries(weights)) {
    // 因為 typeof NaN 跟 typeof Infinity 都是number，所以要檢查isFinite()
    if (typeof weight !== 'number' || !Number.isFinite(weight)) {
      errors.push(`Weight of "${criterion}" must be a number`);
    } else if (weight < 0) {
      errors.push(`Weight of "${criterion}" must not be negative`);
    }
  }

  // Only check the sum when every weight is a valid number
  if (errors.length === 0) {
    const sum = Object.values(weights).reduce((total, weight) => total + weight, 0);
    if (Math.abs(sum - 1) > 0.001) {
      errors.push(`Weights must sum to 1.0 (current sum: ${sum})`);
    }
  }

  return errors;
}

// Check that every criterion has a type of "benefit" or "cost"
function validateCriteriaTypes(criteriaTypes, criteriaNames) {
  const errors = [];

  for (const criterion of criteriaNames) {
    const type = criteriaTypes[criterion];
    if (type !== 'benefit' && type !== 'cost') {
      errors.push(`Type of "${criterion}" must be "benefit" or "cost"`);
    }
  }

  // 看criteriaTypes裡面的名字有沒有跟weight裡面的符合
  for (const criterion of Object.keys(criteriaTypes)) {
    if (!criteriaNames.includes(criterion)) {
      errors.push(`"${criterion}" in criteriaTypes has no weight`);
    }
  }

  return errors;
}
// *************************
// Run all validation checks and return every error found
function validateInput(data) {
  const structureErrors = validateStructure(data);
  if (structureErrors.length > 0) {
    return structureErrors;   // 結構錯誤時，後面的檢查會 crash，所以直接停止
  }

  const criteriaNames = Object.keys(data.weights);

  return [
    // ...叫做spread(展開)，把每個function回傳的陣列攤開，合併成一個大陣列
    // [...['a'], ...['b','c']] -> ['a','b','c']
    ...validateWeights(data.weights),
    ...validateCriteriaTypes(data.criteriaTypes, criteriaNames),
  ];
}

module.exports = {
    validateInput
};