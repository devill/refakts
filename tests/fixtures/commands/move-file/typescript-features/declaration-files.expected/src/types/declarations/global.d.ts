declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      API_URL: string;
      DATABASE_URL: string;
    }
  }
}

declare module '*.json' {
  const value: any;
  export default value;
}

export {};