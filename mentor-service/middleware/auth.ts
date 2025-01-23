import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const authMiddleware = (req: Request, res: Response, next: NextFunction) : void => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY!); // Replace with your secret
    (req as any).mentor = decoded;// = decoded as Record<string, any>; // Ensure this matches your type definition
    next();
  } catch (err) {
    res.status(403).json({ error: 'Forbidden' });
  }
};

export default authMiddleware;
