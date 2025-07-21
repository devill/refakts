// Suppress approvals Jest logging warnings by intercepting console.log
const originalConsoleLog = console.log;

console.log = function(...args) {
  // Filter out the approvals Jest setup warning
  const message = args.join(' ');
  if (message.includes('Jest needs to be set up for logging') || 
      message.includes('**********************************************')) {
    return; // Suppress this specific warning
  }
  originalConsoleLog.apply(console, args);
};