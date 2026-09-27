import { Op } from 'sequelize';
import { PaymentIntent } from '../models/paymentIntent.model';

export const paymentIntentRepository = {
  async findByIdempotencyKey(merchantAccountId: string, idempotencyKey: string): Promise<PaymentIntent | null> {
    return PaymentIntent.findOne({ where: { merchantAccountId, idempotencyKey } });
  },

  async create(input: {
    merchantAccountId: string;
    payerPhone: string;
    amountMinor: number;
    idempotencyKey: string;
    expiresAt: Date;
    createdBy: string;
  }): Promise<PaymentIntent> {
    return PaymentIntent.create(input);
  },

  async findById(id: string): Promise<PaymentIntent | null> {
    return PaymentIntent.findByPk(id);
  },

  async listPendingByPhone(phone: string): Promise<PaymentIntent[]> {
    return PaymentIntent.findAll({ where: { payerPhone: phone, status: 'pending' }, order: [['createdAt', 'DESC']] });
  },

  // "What did I approve or reject" — ordered by updatedAt, not
  // createdAt, since that's when the status actually changed (approved/
  // declined/expired), which is what a history view is answering.
  async listResolvedByPhone(phone: string, limit: number): Promise<PaymentIntent[]> {
    return PaymentIntent.findAll({
      where: { payerPhone: phone, status: { [Op.ne]: 'pending' } },
      order: [['updatedAt', 'DESC']],
      limit,
    });
  },

  // "What have I requested" — across every merchant account a user owns,
  // every status at once, most recently created first.
  async listByMerchantAccountIds(merchantAccountIds: string[], limit: number): Promise<PaymentIntent[]> {
    if (merchantAccountIds.length === 0) return [];
    return PaymentIntent.findAll({
      where: { merchantAccountId: { [Op.in]: merchantAccountIds } },
      order: [['createdAt', 'DESC']],
      limit,
    });
  },

  // Flips pending → expired for every stale row at once — a cheap
  // lazy sweep run whenever someone lists their pending requests,
  // standing in for a proper scheduled job. Returns the rows it actually
  // flipped so the caller can enqueue a webhook delivery for each one —
  // a blanket UPDATE with no way to tell what just changed would leave
  // merchants never finding out their request timed out.
  async expireAllStale(): Promise<PaymentIntent[]> {
    const [, rows] = await PaymentIntent.update(
      { status: 'expired' },
      { where: { status: 'pending', expiresAt: { [Op.lt]: new Date() } }, returning: true }
    );
    return rows;
  },

  async expireIfPending(id: string): Promise<boolean> {
    const [count] = await PaymentIntent.update(
      { status: 'expired' },
      { where: { id, status: 'pending', expiresAt: { [Op.lt]: new Date() } } }
    );
    return count > 0;
  },

  // A conditional UPDATE, not a read-then-write — this is what stops two
  // concurrent "approve" clicks on the same intent from both passing a
  // status check and both trying to move money. Only one UPDATE can
  // actually match `status = 'pending'` at a time; the loser gets 0 rows
  // affected and knows to back off instead of proceeding.
  async claimPending(id: string): Promise<boolean> {
    const [count] = await PaymentIntent.update({ status: 'approved' }, { where: { id, status: 'pending' } });
    return count > 0;
  },

  async declineIfPending(id: string): Promise<boolean> {
    const [count] = await PaymentIntent.update({ status: 'declined' }, { where: { id, status: 'pending' } });
    return count > 0;
  },

  async setTransactionId(id: string, transactionId: string): Promise<void> {
    await PaymentIntent.update({ transactionId }, { where: { id } });
  },
};
