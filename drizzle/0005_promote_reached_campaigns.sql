UPDATE "campaigns" AS c
SET "stage" = 'in_review', "updated_at" = CURRENT_TIMESTAMP
WHERE c."stage" = 'gathering'
  AND (
    SELECT COUNT(*)
    FROM "campaign_members" AS cm
    WHERE cm."campaign_id" = c."id"
  ) >= c."target";
