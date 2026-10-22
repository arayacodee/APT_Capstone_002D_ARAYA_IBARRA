-- Preserve the price recorded for new attentions. Historic prices cannot be
-- reconstructed reliably; existing sessions remain NULL and are shown as unknown.
ALTER TABLE "ClientSession" ADD COLUMN "amount" DECIMAL(10,2);
CREATE INDEX "ClientSession_businessId_occurredAt_idx" ON "ClientSession"("businessId", "occurredAt");
