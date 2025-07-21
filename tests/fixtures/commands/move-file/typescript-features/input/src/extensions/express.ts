declare module 'express' {
  interface Request {
    user?: {
      id: string;
      email: string;
    };
    startTime?: number;
  }
  
  interface Response {
    success(data: any): Response;
    error(message: string, code?: number): Response;
  }
}

// Add extensions to the Express objects
import { Request, Response } from 'express';

Response.prototype.success = function(data: any) {
  return this.json({ success: true, data });
};

Response.prototype.error = function(message: string, code = 500) {
  return this.status(code).json({ success: false, error: message });
};

export {};