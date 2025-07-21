// This file has no imports or exports - it's completely standalone
const MESSAGE = 'Hello, world!';

function logMessage(): void {
  console.log(MESSAGE);
}

// This function is not exported and not used anywhere
function unusedFunction(): void {
  logMessage();
}