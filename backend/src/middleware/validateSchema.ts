import { NextFunction, Request, Response } from 'express';
import { ZodSchema, ZodTypeAny } from 'zod';

type Source = 'body' | 'query' | 'params';

export function validateSchema<T extends ZodTypeAny>(
  schema: T,
  source: Source = 'body',
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = (req as any)[source];
      const parsed = (schema as ZodSchema).parse(data);
      (req as any)[source] = parsed;
      return next();
    } catch (err: any) {
      if (err?.name === 'ZodError') {
        const details = err.issues?.map((i: any) => ({
          path: Array.isArray(i.path) ? i.path.join('.') : String(i.path),
          message: i.message,
        }));
        return res.status(400).json({ error: 'Invalid request', details });
      }
      return res.status(400).json({ error: 'Invalid request payload' });
    }
  };
}
