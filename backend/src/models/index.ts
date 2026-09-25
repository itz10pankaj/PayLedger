// Importing each model runs its Model.init(), registering it with the
// shared sequelize instance. The sync script imports this file so it
// knows about every table before calling sequelize.sync(). Order matters
// here: a model referenced by a later one's FK must be imported first.
import '../modules/account/models/account.model'; // no deps
import '../modules/payment/models/transaction.model'; // FK -> accounts
import '../modules/ledger/models/ledger.model'; // FK -> accounts, transactions
import '../modules/dashboard/models/ledgerEntryTag.model'; // FK -> ledger_entries
import '../modules/dashboard/models/budget.model'; // no deps
import '../modules/gateway/models/merchantApiKey.model'; // FK -> accounts
import '../modules/gateway/models/merchantWebhookConfig.model'; // FK -> accounts
import '../modules/gateway/models/paymentIntent.model'; // FK -> accounts, transactions
import '../modules/gateway/models/webhookDelivery.model'; // FK -> payment_intents
