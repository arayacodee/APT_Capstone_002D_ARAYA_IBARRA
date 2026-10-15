import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deleteAdminRecord, DeletionError } from '../src/lib/admin-deletion.js';

function transaction(role = 'CLIENT') {
  const calls: Array<{ model: string; operation: string; args: any }> = [];
  const tx: any = {};
  for (const model of ['user', 'business', 'businessPhoto', 'service', 'availability', 'reservation', 'clientSession', 'sessionEvidence']) {
    tx[model] = {};
    for (const operation of ['findUnique', 'findMany', 'deleteMany', 'delete']) {
      tx[model][operation] = async (args: any) => {
        calls.push({ model, operation, args });
        if (operation === 'findUnique') return { id: 'target', role, reservationId: 'linked-reservation' };
        if (operation === 'findMany') return model === 'business' ? [{ avatarPublicId: 'avatar', coverPublicId: 'cover' }] : [{ imagePublicId: 'evidence' }];
        return operation === 'delete' ? { imagePublicId: 'evidence' } : { count: 1 };
      };
    }
  }
  return { tx, calls };
}
test('elimina un negocio con sus hijos en orden y conserva las cuentas de clientes y propietario', async () => {
  const { tx, calls } = transaction();
  assert.deepEqual(await deleteAdminRecord(tx, 'businesses', 'business-id', 'admin'), ['evidence', 'avatar', 'cover']);
  const writes = calls.filter(call => call.operation.startsWith('delete'));
  assert.deepEqual(writes.map(call => call.model), ['sessionEvidence', 'clientSession', 'reservation', 'service', 'availability', 'business']);
  assert.deepEqual(writes.find(call => call.model === 'sessionEvidence')!.args.where, { session: { businessId: 'business-id' } });
  assert.deepEqual(writes.find(call => call.model === 'reservation')!.args.where, { businessId: 'business-id' });
  assert.deepEqual(writes.find(call => call.model === 'business')!.args.where, { id: 'business-id' });
  assert.equal(calls.some(call => call.model === 'user'), false);
});
test('eliminar usuario incluye datos de cliente y de sus negocios y protege los superadmins', async () => {
  const { tx, calls } = transaction();
  await deleteAdminRecord(tx, 'users', 'user-id', 'admin');
  const reservation = calls.find(call => call.model === 'reservation' && call.operation === 'deleteMany')!;
  assert.deepEqual(reservation.args.where, { OR: [{ clientId: 'user-id' }, { business: { ownerId: 'user-id' } }] });
  assert.deepEqual(calls.at(-1)!.args.where, { id: 'user-id', role: { not: 'SUPERADMIN' } });
  const protectedTx = transaction('SUPERADMIN');
  await assert.rejects(deleteAdminRecord(protectedTx.tx, 'users', 'target', 'admin'), (error: unknown) => error instanceof DeletionError && error.status === 409);
  assert.equal(protectedTx.calls.some(call => call.operation.startsWith('delete')), false);
  const self = transaction();
  await assert.rejects(deleteAdminRecord(self.tx, 'users', 'target', 'target'), DeletionError);
});
test('no elimina nada si el usuario no existe o fue promovido concurrentemente', async () => {
  const absent = transaction(); absent.tx.user.findUnique = async () => null;
  await assert.rejects(deleteAdminRecord(absent.tx, 'users', 'missing', 'admin'), (error: unknown) => error instanceof DeletionError && error.status === 404);
  assert.equal(absent.calls.length, 0);
  const promoted = transaction(); promoted.tx.user.deleteMany = async () => ({ count: 0 });
  // Throwing aborts the surrounding Prisma transaction, including all child deletions.
  await assert.rejects(deleteAdminRecord(promoted.tx, 'users', 'user-id', 'admin'), DeletionError);
});
test('servicio y reserva borran solo su historial asociado; atención elimina su reserva vinculada', async () => {
  for (const resource of ['services', 'reservations', 'sessions'] as const) {
    const { tx, calls } = transaction();
    await deleteAdminRecord(tx, resource, 'target', 'admin');
    const session = calls.find(call => call.model === 'clientSession' && call.operation === 'deleteMany')!;
    assert.deepEqual(session.args.where, resource === 'services' ? { reservation: { serviceId: 'target' } } : resource === 'reservations' ? { reservationId: 'target' } : { id: 'target' });
    if (resource === 'sessions') assert.deepEqual(calls.find(call => call.model === 'reservation' && call.operation === 'deleteMany')!.args.where, { id: 'linked-reservation' });
    assert.equal(calls.some(call => ['user', 'business', 'availability'].includes(call.model)), false);
  }
});
test('eliminar horario o evidencia no modifica las reservas', async () => {
  for (const resource of ['availabilities', 'evidences'] as const) {
    const { tx, calls } = transaction();
    const images = await deleteAdminRecord(tx, resource, 'target', 'admin');
    assert.equal(calls.length, 1);
    assert.deepEqual(images, resource === 'evidences' ? ['evidence'] : []);
  }
});
