import { Op, literal } from 'sequelize';
import { WebhookDelivery } from '../models/webhookDelivery.model';

export const webhookDeliveryRepository = {
  async create(input: {
    paymentIntentId: string;
    url: string;
    payload: Record<string, unknown>;
    nextAttemptAt: Date;
  }): Promise<WebhookDelivery> {
    return WebhookDelivery.create(input);
  },

  async findById(id: string): Promise<WebhookDelivery | null> {
    return WebhookDelivery.findByPk(id);
  },

  // pending: never attempted yet. failed: attempted, waiting on backoff.
  // Both are "due" the moment their nextAttemptAt arrives.
  async findDue(limit: number): Promise<WebhookDelivery[]> {
    return WebhookDelivery.findAll({
      where: { status: { [Op.in]: ['pending', 'failed'] }, nextAttemptAt: { [Op.lte]: new Date() } },
      order: [['nextAttemptAt', 'ASC']],
      limit,
    });
  },

  async markDelivered(id: string, responseStatus: number): Promise<void> {
    await WebhookDelivery.update(
      { status: 'delivered', responseStatus, lastAttemptAt: new Date(), attempts: literal('attempts + 1') },
      { where: { id } }
    );
  },

  async markRetry(id: string, nextAttemptAt: Date, responseStatus: number | null): Promise<void> {
    await WebhookDelivery.update(
      { status: 'failed', responseStatus, lastAttemptAt: new Date(), nextAttemptAt, attempts: literal('attempts + 1') },
      { where: { id } }
    );
  },

  async markDead(id: string, responseStatus: number | null): Promise<void> {
    await WebhookDelivery.update(
      { status: 'dead', responseStatus, lastAttemptAt: new Date(), attempts: literal('attempts + 1') },
      { where: { id } }
    );
  },
};
