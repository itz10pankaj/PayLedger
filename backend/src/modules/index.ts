import { Router } from 'express';

// User/auth lives entirely in the gateway now — backend has nothing
// user-related. First real module here will be something like `payment`
// or `account`; each gets one line, same pattern as before.
export const moduleRoutes = Router();
