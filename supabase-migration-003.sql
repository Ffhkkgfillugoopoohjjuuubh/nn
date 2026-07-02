-- Migration 003: Remove auto-delete trigger that destroys message rows on delivery
-- This trigger was killing Delete for Everyone (and read receipts) because
-- the message row was gone before any update could target it.

DROP TRIGGER IF EXISTS trigger_delete_delivered_message ON messages;
DROP FUNCTION IF EXISTS delete_delivered_message;
