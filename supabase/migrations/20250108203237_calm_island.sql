/*
  # Add phone and member_id fields to submissions table

  1. Changes
    - Add `phone` column to store mobile contact number
    - Add `member_id` column to reference specific board member
    - Add foreign key constraint to ensure data integrity
*/

-- Add phone column
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS phone text;

-- Add member_id column with foreign key reference
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS member_id uuid;
ALTER TABLE submissions ADD CONSTRAINT fk_submissions_board_member 
  FOREIGN KEY (member_id) 
  REFERENCES board_members(id);