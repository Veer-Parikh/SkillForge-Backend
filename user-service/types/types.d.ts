// import 'express';

// export type myRequest = Request &{
//     user:{
//         id:string
//     }
// }

import { Request } from "express";

export interface myRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}
