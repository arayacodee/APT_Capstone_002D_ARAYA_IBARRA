import { afterNextRender, Component, ElementRef, inject, Injector, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JsonPipe, DatePipe, NgTemplateOutlet } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { businessCategories, attentionModes } from '../../models/business-category';

interface Field { key: string; label: string; type: 'text' | 'number' | 'time' | 'checkbox' | 'textarea' | 'role' | 'category' | 'mode'; }
interface Section { key: string; label: string; fields: Field[]; }
export interface AdminRecord { id: string; [key: string]: unknown; }
const field = (key: string, label: string, type: Field['type'] = 'text'): Field => ({ key, label, type });

@Component({ selector: 'app-admin', imports: [FormsModule, JsonPipe, DatePipe, NgTemplateOutlet], templateUrl: './admin.html', styleUrl: './admin.css' })
export class Admin {
  readonly categories = businessCategories;
  readonly modes = attentionModes;
  private readonly injector = inject(Injector);
  private readonly editor = viewChild<ElementRef<HTMLFormElement>>('editor');
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl.replace(/\/$/, '')}/api/admin`;
  readonly sections: Section[] = [
    { key: 'users', label: 'Usuarios', fields: [field('name', 'Nombre'), field('role', 'Rol', 'role')] },
    { key: 'businesses', label: 'Negocios', fields: [field('name', 'Nombre'), field('description', 'Descripción', 'textarea'), field('category', 'Tipo de negocio', 'category'), field('professionalName', 'Profesional o terapeuta'), field('specialties', 'Especialidades', 'textarea'), field('address', 'Dirección pública'), field('attentionMode', 'Modalidad de atención', 'mode')] },
    { key: 'services', label: 'Servicios', fields: [field('name', 'Nombre'), field('description', 'Descripción', 'textarea'), field('durationMin', 'Duración en minutos', 'number'), field('price', 'Precio', 'number'), field('isActive', 'Activo', 'checkbox')] },
    { key: 'availabilities', label: 'Horarios', fields: [field('dayOfWeek', 'Día (1 lunes – 7 domingo)', 'number'), field('startTime', 'Inicio', 'time'), field('endTime', 'Término', 'time'), field('isActive', 'Activo', 'checkbox')] },
    { key: 'reservations', label: 'Reservas', fields: [] },
    { key: 'sessions', label: 'Atenciones', fields: [field('notes', 'Notas', 'textarea')] },
    { key: 'evidences', label: 'Evidencias', fields: [field('caption', 'Descripción', 'textarea')] }
  ];
  readonly section = signal(this.sections[0]);
  readonly records = signal<AdminRecord[]>([]);
  readonly page = signal(1);
  readonly hasMore = signal(false);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly selected = signal<AdminRecord | null>(null);
  readonly passwordUser = signal<AdminRecord | null>(null);
  newPassword = '';
  confirmPassword = '';
  readonly creating = signal(false);
  readonly deleting = signal<AdminRecord | null>(null);
  readonly warning = signal('');
  readonly deletionEffects: Record<string, string> = {
    users: 'Se eliminarán el usuario, sus negocios con sus servicios y horarios, sus reservas, atenciones e imágenes asociadas. Otros usuarios conservarán sus cuentas. Si vuelve a ingresar con Google, se creará una nueva cuenta de cliente.',
    businesses: 'Se eliminarán el negocio, sus servicios, horarios, reservas, atenciones e imágenes asociadas. El propietario y los clientes conservarán sus cuentas.',
    services: 'Se eliminarán el servicio y todas sus reservas, atenciones e imágenes asociadas, incluyendo el historial.',
    availabilities: 'Se eliminará este horario disponible. Las reservas existentes se conservarán.',
    reservations: 'Se eliminarán la reserva y su atención e imágenes asociadas, si existen.',
    sessions: 'Se eliminarán la atención, sus imágenes y la reserva asociada.',
    evidences: 'Se eliminarán la evidencia y su archivo de imagen. La atención y la reserva se conservarán.'
  };
  draft: Record<string, string | number | boolean | null> = {};
  constructor() { this.load(); }

  change(section: Section): void {
    if (this.saving()) return;
    this.closePassword();
    this.section.set(section); this.page.set(1); this.selected.set(null); this.creating.set(false); this.deleting.set(null); this.message.set(''); this.warning.set(''); this.load();
  }
  load(): void {
    this.loading.set(true); this.error.set(''); this.records.set([]);
    this.http.get<{ items: AdminRecord[]; hasMore: boolean }>(`${this.base}/${this.section().key}`, { params: { page: this.page() } }).subscribe({
      next: data => { this.records.set(data.items); this.hasMore.set(data.hasMore); this.loading.set(false); },
      error: err => { this.loading.set(false); this.error.set(err?.error?.error ?? 'No fue posible cargar los datos.'); }
    });
  }
  paginate(delta: number): void { this.page.update(value => value + delta); this.load(); }
  title(record: AdminRecord): string {
    return String(record['name'] ?? record['email'] ?? this.nested(record, 'client', 'name') ?? record['caption'] ?? record.id);
  }
  nested(record: AdminRecord, key: string, child: string): string | null {
    const value = record[key];
    return value && typeof value === 'object' ? String((value as Record<string, unknown>)[child] ?? '') || null : null;
  }
  value(record: AdminRecord, key: string): string { return String(record[key] ?? ''); }
  edit(record: AdminRecord): void {
    this.closePassword();
    this.deleting.set(null);
    this.selected.set(record); this.creating.set(false); this.error.set(''); this.message.set(''); this.draft = {};
    for (const item of this.section().fields) {
      const value = record[item.key];
      this.draft[item.key] = item.type === 'number' ? Number(value) : item.type === 'checkbox' ? Boolean(value) : String(value ?? '');
    }
  }
  private revealEditor(): void {
    afterNextRender(() => {
      const form = this.editor()?.nativeElement;
      form?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      form?.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select')?.focus({ preventScroll: true });
    }, { injector: this.injector });
  }
  newUser(): void { this.deleting.set(null); this.selected.set(null); this.creating.set(true); this.draft = { email: '', name: '', role: 'PROFESSIONAL' }; this.error.set(''); this.message.set(''); this.revealEditor(); }
  closePassword(): void { this.passwordUser.set(null); this.newPassword = ''; this.confirmPassword = ''; }
  editPassword(record: AdminRecord): void {
    if (this.saving() || record['role'] === 'SUPERADMIN') return;
    this.close(); this.deleting.set(null); this.closePassword(); this.passwordUser.set(record); this.error.set(''); this.message.set('');
  }
  savePassword(): void {
    const user = this.passwordUser();
    if (!user || this.saving()) return;
    if (this.newPassword.length < 8 || this.newPassword !== this.confirmPassword) { this.error.set('Usa al menos 8 caracteres y confirma la misma contraseña.'); return; }
    this.saving.set(true); this.error.set('');
    this.http.patch<{ message: string }>(`${this.base}/users/${user.id}/password`, { password: this.newPassword }).subscribe({
      next: result => { this.saving.set(false); this.closePassword(); this.message.set(result.message); },
      error: err => { this.saving.set(false); this.newPassword = ''; this.confirmPassword = ''; this.error.set(err?.error?.error ?? 'No fue posible cambiar la contraseña.'); }
    });
  }
  requestDeletion(record: AdminRecord): void {
    if (this.saving() || record['role'] === 'SUPERADMIN') return;
    this.closePassword();
    this.close(); this.deleting.set(record); this.error.set(''); this.message.set(''); this.warning.set('');
  }
  confirmDeletion(): void {
    const record = this.deleting();
    if (!record || this.saving()) return;
    this.saving.set(true); this.error.set('');
    this.http.delete<{ message: string; warning: string | null }>(`${this.base}/${this.section().key}/${record.id}`, { body: { confirm: true } }).subscribe({
      next: result => {
        this.saving.set(false); this.deleting.set(null); this.message.set(result.message); this.warning.set(result.warning ?? '');
        if (this.records().length === 1 && this.page() > 1) this.page.update(value => value - 1);
        this.load();
      },
      error: err => { this.saving.set(false); this.error.set(err?.error?.error ?? 'No fue posible eliminar el registro.'); }
    });
  }
  close(): void { this.selected.set(null); this.creating.set(false); }
  save(): void {
    const data = { ...this.draft };
    const record = this.selected();
    if (this.section().key === 'users' && record?.['role'] === 'SUPERADMIN') delete data['role'];
    for (const key of ['name', 'description', 'notes', 'caption', 'professionalName', 'specialties', 'address', 'attentionMode']) if (data[key] === '') data[key] = null;
    this.saving.set(true); this.error.set('');
    const request = this.creating() ? this.http.post(`${this.base}/users`, data) : this.http.patch(`${this.base}/${this.section().key}/${record!.id}`, data);
    request.subscribe({ next: () => { this.saving.set(false); this.close(); this.message.set('Cambios guardados.'); this.load(); }, error: err => { this.saving.set(false); this.error.set(err?.error?.error ?? 'No fue posible guardar los cambios.'); } });
  }
  reservationAction(record: AdminRecord, action: 'cancel' | 'complete'): void {
    this.saving.set(true); this.error.set(''); this.message.set('');
    this.http.patch(`${this.base}/reservations/${record.id}/${action}`, {}).subscribe({ next: () => { this.saving.set(false); this.message.set(action === 'cancel' ? 'Reserva cancelada.' : 'Atención registrada.'); this.load(); }, error: err => { this.saving.set(false); this.error.set(err?.error?.error ?? 'No fue posible actualizar la reserva.'); } });
  }
}
