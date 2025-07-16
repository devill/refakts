const { initializeGlobalsForJest } = require("approvals/lib/Providers/Jest/JestSetup.js");

module.exports = async function globalSetup() {
  // Initialize approvals for Jest
  initializeGlobalsForJest();
};