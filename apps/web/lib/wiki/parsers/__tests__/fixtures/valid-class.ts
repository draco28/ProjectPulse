/**
 * Manages user data and operations
 *
 * @class UserManager
 */
export class UserManager {
  private users: Map<string, any>;

  /**
   * Creates a new UserManager instance
   *
   * @param initialUsers - Optional array of initial users
   */
  constructor(initialUsers?: any[]) {
    this.users = new Map();
    if (initialUsers) {
      initialUsers.forEach(user => this.users.set(user.id, user));
    }
  }

  /**
   * Adds a user to the manager
   *
   * @param user - The user object to add
   * @returns True if user was added, false if already exists
   */
  addUser(user: any): boolean {
    if (this.users.has(user.id)) {
      return false;
    }
    this.users.set(user.id, user);
    return true;
  }

  /**
   * Retrieves a user by ID
   *
   * @param id - The user ID
   * @returns The user object or undefined
   */
  getUser(id: string): any | undefined {
    return this.users.get(id);
  }
}
