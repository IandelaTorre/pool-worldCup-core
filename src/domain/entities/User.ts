export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  fullName: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithoutPassword extends Omit<User, "passwordHash"> {}

export interface UserRole {
  userId: string;
  roleId: string;
}

export interface CatalogUserRole {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
}
