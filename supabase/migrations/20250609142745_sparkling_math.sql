/*
  # Fix users table RLS policies for INSERT operations

  1. Problem
    - Users table is missing INSERT policy for new user creation during signup
    - Current policies only allow SELECT and UPDATE but not INSERT
    - This prevents new user profiles from being created

  2. Solution
    - Add INSERT policy that allows authenticated users to create their own profile
    - Ensure the user can only create a profile for themselves (auth.uid() = id)

  3. Security
    - Users can only insert their own profile (id must match auth.uid())
    - Maintains security while allowing signup process to complete
*/

-- Add INSERT policy for users table
CREATE POLICY "Users can create their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);