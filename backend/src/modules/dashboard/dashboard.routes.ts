import { Router } from 'express';
import { identifyUser } from '../../common/middlewares/identifyUser';
import { dashboardController } from './dashboard.controller';

export const dashboardRoutes = Router();

dashboardRoutes.use(identifyUser);

dashboardRoutes.get('/overview', dashboardController.overview);
dashboardRoutes.get('/transactions', dashboardController.transactions);
dashboardRoutes.get('/expenses', dashboardController.expenses);
dashboardRoutes.get('/categories', dashboardController.categories);
dashboardRoutes.patch('/transactions/:entryId/category', dashboardController.tagTransaction);
dashboardRoutes.get('/budgets', dashboardController.budgetOverview);
dashboardRoutes.put('/budgets/:category', dashboardController.setBudget);
dashboardRoutes.delete('/budgets/:category', dashboardController.removeBudget);
dashboardRoutes.get('/financial-health', dashboardController.financialHealth);
