import type { Request } from 'express';

// Petición ya autorizada por el SecurityGuard: lleva el id del usuario del JWT (claim "sub")
export type AuthenticatedRequest = Request & { userId?: number };
