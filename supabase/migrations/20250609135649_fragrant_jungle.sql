/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - Current RLS policies on users table create infinite recursion
    - Policy tries to query users table from within users table policy
    - This happens when checking workspace membership

  2. Solution
    - Replace recursive policies with direct user-based policies
    - Allow users to read their own data directly
    - Allow users to update their own profile
    - Remove workspace-based SELECT policy that causes recursion

  3. Security Changes
    - Users can read their own user record (auth.uid() = id)
    - Users can update their own profile (auth.uid() = id)
    - Remove problematic workspace member viewing policy
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view workspace members" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage workspace users" ON users;

-- Create simple, non-recursive policies
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- For admin operations, we'll handle this at the application level
-- or through service role operations to avoid recursion
CREATE POLICY "Service role can manage all users"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);