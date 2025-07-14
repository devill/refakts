function loadEnv() {
  return {
    API_URL: process.env.API_URL || 'http://localhost:3000',
    TIMEOUT: process.env.TIMEOUT || '5000'
  };
}

module.exports = { loadEnv };