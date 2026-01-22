-- Find approved UGC creators who don't have SignWell document IDs
-- These are the ones who need contracts resent

SELECT
  full_name,
  email,
  approved_at,
  contract_sent_at,
  signwell_document_id,
  CASE
    WHEN signwell_document_id IS NOT NULL THEN 'Contract Sent ✓'
    WHEN contract_sent_at IS NOT NULL AND signwell_document_id IS NULL THEN 'Failed to Send ✗'
    ELSE 'Not Sent Yet'
  END AS contract_status
FROM users
WHERE role = 'ugc_creator'
  AND application_status = 'approved'
ORDER BY
  CASE
    WHEN signwell_document_id IS NULL THEN 0
    ELSE 1
  END,
  approved_at DESC;
