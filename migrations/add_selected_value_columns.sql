-- Migration: Add self_selected_value and evaluator_selected_value columns
-- Date: 2025-11-20
-- Description: Add columns to store the selected values (1-4, 0-1) separately from calculated scores

USE skills_evaluation;

-- Add self_selected_value column after indicator_id
ALTER TABLE evaluation_results
ADD COLUMN self_selected_value INT NULL
AFTER indicator_id;

-- Add evaluator_selected_value column after self_submitted_at
ALTER TABLE evaluation_results
ADD COLUMN evaluator_selected_value INT NULL
AFTER self_submitted_at;

-- Verify the changes
DESCRIBE evaluation_results;
