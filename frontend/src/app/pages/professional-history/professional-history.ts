import { Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { Business } from '../../models/business.model';
import { businessLabels } from '../../models/business-category';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ClientSession, SessionEvidence } from '../../models/reservation.model';

@Component({
  selector: 'app-professional-history', imports: [FormsModule, RouterLink],
  templateUrl: './professional-history.html', styleUrl: './professional-history.css'
})
export class ProfessionalHistory implements OnInit {
  readonly business = signal<Business | null>(null);
  readonly labels = computed(() => businessLabels(this.business()?.category));
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly sessions = signal<ClientSession[]>([]);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly nextCursor = signal<string | null>(null);
  notes: Record<string, string> = {};
  captions: Record<string, string> = {};

  ngOnInit() {
    this.api.getMyBusiness().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: business => this.business.set(business), error: () => this.error.set('No fue posible cargar la configuración del negocio.') });
    this.load();
  }

  load() {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.api.getSessions(this.nextCursor() ?? undefined).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false))
    ).subscribe({
      next: page => {
        this.sessions.update(items => [...items, ...page.items]);
        this.nextCursor.set(page.nextCursor);
        page.items.forEach(session => this.notes[session.id] = session.notes ?? '');
      },
      error: error => this.error.set(error?.error?.error ?? 'No fue posible cargar el historial.')
    });
  }

  saveNotes(session: ClientSession) {
    if (this.busy()) return;
    this.startAction();
    this.api.updateSession(session.id, this.notes[session.id]).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.busy.set(false))
    ).subscribe({
      next: updated => {
        this.sessions.update(items => items.map(item => item.id === session.id ? { ...item, notes: updated.notes } : item));
        this.success.set('Nota guardada.');
      }, error: error => this.fail(error)
    });
  }

  upload(session: ClientSession, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.busy()) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      this.error.set('Selecciona una imagen JPEG, PNG o WebP de hasta 5 MB.'); return;
    }
    this.startAction();
    this.api.addEvidence(session.id, file, this.captions[session.id] ?? '').pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.busy.set(false))
    ).subscribe({
      next: evidence => {
        this.sessions.update(items => items.map(item => item.id === session.id ? { ...item, evidences: [evidence, ...(item.evidences ?? [])] } : item));
        this.captions[session.id] = '';
        this.success.set('Evidencia agregada.');
      }, error: error => this.fail(error)
    });
  }

  remove(session: ClientSession, evidence: SessionEvidence) {
    if (this.busy() || !window.confirm('¿Eliminar esta imagen de la atención?')) return;
    this.startAction();
    this.api.deleteEvidence(evidence.id).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.busy.set(false))
    ).subscribe({
      next: () => {
        this.sessions.update(items => items.map(item => item.id === session.id ? { ...item, evidences: item.evidences?.filter(image => image.id !== evidence.id) } : item));
        this.success.set('Evidencia eliminada.');
      }, error: error => this.fail(error)
    });
  }

  formatDate(session: ClientSession) {
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short', timeZone: session.business?.timezone ?? 'America/Santiago' }).format(new Date(session.occurredAt));
  }

  private startAction() { this.busy.set(true); this.error.set(''); this.success.set(''); }
  private fail(error: { error?: { error?: string } }) { this.error.set(error?.error?.error ?? 'No fue posible completar la acción.'); }
}
