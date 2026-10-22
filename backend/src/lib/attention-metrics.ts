export function localDay(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const part = (type: string) => parts.find(item => item.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

// A UTC envelope includes both local month boundaries, including DST changes.
// The exact business calendar day is checked below, independently of server TZ.
export function monthEnvelope(now: Date, timezone: string) {
  const today = localDay(now, timezone);
  const [year, month] = today.split('-').map(Number);
  return {
    today, month: today.slice(0, 7), year, monthNumber: month,
    from: new Date(Date.UTC(year, month - 1, -1)),
    until: new Date(Date.UTC(year, month, 3)),
  };
}

interface MetricSession {
  occurredAt: Date;
  clientId: string;
  reservation: { service: { price: { toString(): string } } };
}

export function attentionMetrics(sessions: MetricSession[], now: Date, timezone: string) {
  const period = monthEnvelope(now, timezone);
  const days = new Date(Date.UTC(period.year, period.monthNumber, 0)).getUTCDate();
  const daily = Array.from({ length: days }, (_, index) => ({
    date: `${period.month}-${String(index + 1).padStart(2, '0')}`, count: 0,
  }));
  const clients = new Set<string>();
  let monthCount = 0, todayCount = 0, revenueCents = 0;
  for (const session of sessions) {
    const day = localDay(session.occurredAt, timezone);
    if (!day.startsWith(`${period.month}-`) || session.occurredAt > now) continue;
    monthCount++;
    if (day === period.today) todayCount++;
    daily[Number(day.slice(-2)) - 1].count++;
    clients.add(session.clientId);
    revenueCents += Math.round(Number(session.reservation.service.price.toString()) * 100);
  }
  return { month: period.month, timezone, todayCount, monthCount,
    uniqueClients: clients.size, revenue: revenueCents / 100, daily };
}
