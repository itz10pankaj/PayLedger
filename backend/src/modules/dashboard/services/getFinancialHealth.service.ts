import { ApiError } from '../../../common/utils/ApiError';
import { accountRepository } from '../../account/repository/account.repository';
import { dashboardRepository } from '../repository/dashboard.repository';
import { getBudgetOverview } from './getBudgetOverview.service';
import { getMonthlyExpenses } from './getMonthlyExpenses.service';

export interface HealthInsight {
  tone: 'good' | 'warning';
  text: string;
}

function previousMonth(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  const d = new Date(Date.UTC(year, mon - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// A real score computed from this month's actual ledger activity — not a
// decorative number. Two independent signals, each optional depending on
// what data exists yet, averaged when both are present:
//   - budget adherence: how far total spend is from the total of whatever
//     category budgets the user has actually set.
//   - savings rate: (money in - money out) / money in, across all accounts.
// If neither signal has data yet (no budgets set and no money in this
// month), there's nothing honest to score — return null rather than
// inventing a number.
export async function getFinancialHealth(userId: string, month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw ApiError.badRequest('month must be in YYYY-MM format');
  }

  const accounts = await accountRepository.listByUserId(userId);
  const accountIds = accounts.map((a) => a.id);
  const [year, mon] = month.split('-').map(Number);
  const monthStart = new Date(Date.UTC(year, mon - 1, 1));
  const monthEnd = new Date(Date.UTC(year, mon, 1));

  const [budgetOverview, flows, prevExpenses, thisExpenses] = await Promise.all([
    getBudgetOverview(userId, month),
    dashboardRepository.sumFlowsForMonth(accountIds, monthStart, monthEnd),
    getMonthlyExpenses(userId, previousMonth(month)),
    getMonthlyExpenses(userId, month),
  ]);

  const insights: HealthInsight[] = [];
  const scores: number[] = [];

  if (budgetOverview.totalLimitMinor > 0) {
    const overspendPct = Math.max(
      0,
      ((budgetOverview.totalSpentMinor - budgetOverview.totalLimitMinor) / budgetOverview.totalLimitMinor) * 100
    );
    scores.push(Math.max(0, 100 - overspendPct));
    if (overspendPct === 0) {
      insights.push({ tone: 'good', text: 'Spending is within budget' });
    } else {
      insights.push({ tone: 'warning', text: `Spending exceeds budget by ${Math.round(overspendPct)}%` });
    }
  }

  let savingsRatePct: number | null = null;
  if (flows.creditsMinor > 0) {
    savingsRatePct = Math.round(((flows.creditsMinor - flows.debitsMinor) / flows.creditsMinor) * 100);
    scores.push(Math.max(0, Math.min(100, savingsRatePct)));
    if (savingsRatePct >= 50) {
      insights.push({ tone: 'good', text: `Savings rate is ${savingsRatePct}%` });
    } else {
      insights.push({ tone: 'warning', text: `Savings rate is ${savingsRatePct}%, below the 50% mark` });
    }
  }

  const prevByCategory = new Map(prevExpenses.byCategory.map((c) => [c.category, c.totalMinor]));
  let biggestIncrease: { category: string; pct: number } | null = null;
  for (const c of thisExpenses.byCategory) {
    const prev = prevByCategory.get(c.category) ?? 0;
    if (prev <= 0) continue;
    const pct = ((c.totalMinor - prev) / prev) * 100;
    if (pct > 20 && (!biggestIncrease || pct > biggestIncrease.pct)) {
      biggestIncrease = { category: c.category, pct };
    }
  }
  if (biggestIncrease) {
    insights.push({ tone: 'warning', text: `${biggestIncrease.category} spending increased ${Math.round(biggestIncrease.pct)}% vs last month` });
  }

  if (scores.length === 0) {
    return { month, score: null, label: 'Not enough data yet', insights };
  }

  const score = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
  const label = score >= 75 ? 'Good' : score >= 50 ? 'Fair' : 'Needs attention';

  return { month, score, label, insights };
}
