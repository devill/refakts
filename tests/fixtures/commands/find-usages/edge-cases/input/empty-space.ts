// File with empty spaces for testing symbol not found

export function validFunction(): void {
  console.log('This is valid');
}

// Line 5 has empty space where we'll target


export const VALID_CONSTANT = 'valid';

// More empty space

function anotherFunction(): void {
  // Comment only
  
  // More empty space
  
  validFunction();
}