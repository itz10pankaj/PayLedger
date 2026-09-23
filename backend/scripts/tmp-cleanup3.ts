import { sequelize } from '../src/config/db';

async function main() {
  const userIds = ['08c4deca-d722-424f-93f6-d8ea4ecae9b3', 'a3827693-2293-4e99-93da-337e03f8a88a'];
  await sequelize.query(`DELETE FROM budgets WHERE user_id IN (:userIds)`, { replacements: { userIds } });
  await sequelize.query(
    `DELETE FROM ledger_entry_tags WHERE ledger_entry_id IN (SELECT id FROM ledger_entries WHERE account_id IN (SELECT id FROM accounts WHERE user_id IN (:userIds)))`,
    { replacements: { userIds } }
  );
  await sequelize.query(
    `DELETE FROM ledger_entries WHERE account_id IN (SELECT id FROM accounts WHERE user_id IN (:userIds))`,
    { replacements: { userIds } }
  );
  await sequelize.query(`DELETE FROM accounts WHERE user_id IN (:userIds)`, { replacements: { userIds } });
  await sequelize.query(`DELETE FROM users WHERE id IN (:userIds)`, { replacements: { userIds } });
  console.log('cleanup done');
  await sequelize.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
