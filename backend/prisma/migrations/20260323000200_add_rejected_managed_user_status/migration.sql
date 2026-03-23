-- Add Rejected status for admin-controlled user access gating
ALTER TYPE "ManagedUserStatus" ADD VALUE IF NOT EXISTS 'Rejected';
