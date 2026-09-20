import '../models'; // registers every model with sequelize
import { sequelize } from '../config/db';

// This IS "the migration" — models are the single source of truth for
// the schema, so running this on any machine (with DATABASE_URL set)
// creates/updates every table to match the current model definitions.
// No separate hand-written SQL files to drift out of sync with the code.
async function main() {
  await sequelize.authenticate();
  console.log('[backend] connected — syncing schema from models...');
  await sequelize.sync({ alter: true });
  console.log('[backend] schema is up to date.');
  await sequelize.close();
}

main().catch((err) => {
  console.error('[backend] schema sync failed:', err);
  process.exit(1);
});
