import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attentionMetrics, localDay, monthEnvelope } from '../src/lib/attention-metrics.js';

const timezone = 'America/Santiago';
const session = (date: string, clientId = 'client', price = '15000') => ({
  occurredAt: new Date(date), clientId, amount: null, reservation: { service: { price } },
});

test('el mes se determina por calendario del negocio, incluyendo año y medianoche local', () => {
  const now = new Date('2026-11-01T02:59:59Z'); // October 31, 23:59:59 in Santiago.
  const metrics = attentionMetrics([
    session('2026-10-01T02:59:59Z'), // September locally, excluded.
    session('2026-10-01T03:00:00Z'),
    session('2026-11-01T02:59:59Z', 'other', '10000'),
    session('2026-11-01T03:00:00Z'),
    session('2025-10-15T12:00:00Z'),
  ], now, timezone);
  assert.equal(metrics.month, '2026-10');
  assert.equal(metrics.monthCount, 2);
  assert.equal(metrics.todayCount, 1);
  assert.equal(metrics.uniqueClients, 2);
  assert.equal(metrics.revenue, 25000);
  assert.equal(metrics.daily[0].count, 1);
  assert.equal(metrics.daily[30].count, 1);
  assert.equal(attentionMetrics([], new Date('2026-11-01T03:00:00Z'), timezone).month, '2026-11');
});

test('registros tardíos cuentan por occurredAt y el importe usa el precio del servicio incluso sin valor guardado', () => {
  const result = attentionMetrics([
    session('2026-10-05T12:00:00Z'), session('2026-10-22T12:00:00Z', 'client'),
    session('2026-10-22T13:00:00Z', 'another', '0'), session('2026-09-15T12:00:00Z'),
    session('2026-10-23T12:00:00Z'),
  ], new Date('2026-10-22T15:00:00Z'), timezone);
  assert.equal(result.monthCount, 3);
  assert.equal(result.todayCount, 2);
  assert.equal(result.uniqueClients, 2);
  assert.equal(result.revenue, 30000);
});

test('la tarifa del servicio es la fuente del importe aunque exista un valor anterior en la atención', () => {
  const attention = { ...session('2026-10-22T12:00:00Z', 'client', '18000'), amount: '10000' };
  const now = new Date('2026-10-22T15:00:00Z');
  assert.equal(attentionMetrics([attention], now, timezone).revenue, 18000);
  attention.reservation.service.price = '20000';
  assert.equal(attentionMetrics([attention], now, timezone).revenue, 20000);
});

test('el calendario incluye días vacíos, febrero bisiesto y cambio de año', () => {
  assert.equal(attentionMetrics([], new Date('2028-02-15T12:00:00Z'), timezone).daily.length, 29);
  assert.equal(attentionMetrics([], new Date('2026-02-15T12:00:00Z'), timezone).daily.length, 28);
  const result = attentionMetrics([session('2027-01-01T02:59:59Z')], new Date('2027-01-01T03:00:00Z'), timezone);
  assert.equal(result.month, '2027-01');
  assert.equal(result.monthCount, 0);
  assert.equal(result.revenue, 0);
});

test('la ventana UTC cubre los extremos del mes y el cambio de horario de verano', () => {
  assert.equal(localDay(new Date('2026-09-06T03:59:59Z'), timezone), '2026-09-05');
  assert.equal(localDay(new Date('2026-09-06T04:00:00Z'), timezone), '2026-09-06');
  const now = new Date('2026-09-30T23:00:00Z');
  const envelope = monthEnvelope(now, timezone);
  for (const date of ['2026-09-01T04:00:00Z', '2026-10-01T02:59:59Z']) {
    assert.ok(new Date(date) >= envelope.from && new Date(date) < envelope.until);
  }
  const metrics = attentionMetrics([session('2026-09-06T03:59:59Z'), session('2026-09-06T04:00:00Z')], now, timezone);
  assert.equal(metrics.daily[4].count, 1);
  assert.equal(metrics.daily[5].count, 1);
});
