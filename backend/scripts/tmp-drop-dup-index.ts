import { sequelize } from '../src/config/db';

async function main() {
  await sequelize.query(`DROP INDEX IF EXISTS merchant_api_keys_key_id_key1`);
  console.log('dropped');
  await sequelize.close();
}
main();
