import { Request } from "express";

export default interface ClerkRequest extends Request {
  [x: string]: any;
  auth: {
    userId: string;
    sessionId?: string;
  };
}