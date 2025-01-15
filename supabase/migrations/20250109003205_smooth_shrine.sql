/*
  # Update Submissions Table

  1. Changes
    - Add assignee_id (uuid, references board_members)
    - Add status enum type and column
    - Add notes (jsonb array for audit trail)
    - Add assigned_to_club (boolean)

  2. Security
    - Maintain existing RLS policies
*/

-- First create the enum type
CREATE TYPE submission_status AS ENUM (
  'new',
  'in_progress',
  'waiting_for_info',
  'contact_user',
  'sent_to_club',
  'complete'
);

-- Add new columns to submissions table
ALTER TABLE submissions 
  ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES board_members(id),
  ADD COLUMN IF NOT EXISTS status submission_status DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS notes jsonb[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS assigned_to_club boolean DEFAULT false;