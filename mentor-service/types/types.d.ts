import { Request } from "express";

export interface myRequest extends Request {
  mentor?: {
    id: string;
    email?: string;
  };
}