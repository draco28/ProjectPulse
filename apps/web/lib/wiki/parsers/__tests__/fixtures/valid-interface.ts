/**
 * Represents a user in the system
 *
 * @interface User
 */
export interface User {
  /**
   * Unique identifier for the user
   */
  id: string;

  /**
   * User's email address
   */
  email: string;

  /**
   * User's display name
   */
  name: string;

  /**
   * Timestamp when the user was created
   */
  createdAt: Date;
}
