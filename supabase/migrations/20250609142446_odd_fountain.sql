/*
  # Add INSERT policy for workspaces table

  1. Security Changes
    - Add INSERT policy for workspaces table to allow authenticated users to create workspaces
    - Policy ensures that the authenticated user is set as the owner_id

  This resolves the RLS violation error during user signup when creating a new workspace.
*/

-- Add INSERT policy for workspaces table
CREATE POLICY "Users can create workspaces as owners"
  ON workspaces
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);