// Importing each model runs its Model.init(), registering it with the
// shared sequelize instance. The sync script imports this file so it
// knows about every table before calling sequelize.sync().
import '../modules/user/models/user.model';
