import { User } from '../models/user.model';

// Repository layer: only place in the module allowed to query the User
// model directly. Services never import the model — they call through here.

// A Sequelize instance carries prototype getters/methods, not a plain
// object — .toJSON() is the documented way to flatten it before shaping
// what goes back over the wire.
export function toSafeUser(user: User) {
  const { passwordHash, ...safe } = user.toJSON();
  return safe;
}

export type SafeUser = ReturnType<typeof toSafeUser>;

export const userRepository = {
  async create(input: {
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
    role: User['role'];
    createdBy?: string | null;
  }): Promise<User> {
    return User.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash: input.passwordHash,
      role: input.role,
      createdBy: input.createdBy ?? null,
    });
  },

  async findById(id: string): Promise<User | null> {
    return User.findByPk(id);
  },

  async findByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } });
  },

  async findByPhone(phone: string): Promise<User | null> {
    return User.findOne({ where: { phone } });
  },

  async updateById(
    id: string,
    fields: { name?: string; email?: string },
    updatedBy: string
  ): Promise<User | null> {
    const user = await User.findByPk(id);
    if (!user) return null;

    if (fields.name !== undefined) user.name = fields.name;
    if (fields.email !== undefined) user.email = fields.email;
    user.updatedBy = updatedBy;

    await user.save();
    return user;
  },
};
