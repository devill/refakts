function outerFunction() {
  // Target variable: line 3, column 7-12
  const value = "outer";
  console.log(value); // Should be included: line 4

  function innerFunction() {
    const value = "inner"; // Should NOT be included: different scope
    console.log(value); // Should NOT be included: refers to inner value
  }

  if (true) {
    const value = "block"; // Should NOT be included: different scope  
    console.log(value); // Should NOT be included: refers to block value
  }

  return value; // Should be included: line 15
}

function anotherFunction() {
  const value = "another"; // Should NOT be included: different function
  return value; // Should NOT be included: refers to another value
}