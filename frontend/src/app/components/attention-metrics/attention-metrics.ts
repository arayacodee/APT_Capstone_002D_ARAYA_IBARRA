import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, interval, Subscription } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AttentionMetrics as Metrics } from '../../models/reservation.model';

@Component({
  selector: 'app-attention-metrics', templateUrl: './attention-metrics.html', styleUrl: './attention-metrics.css',
})
export class AttentionMetrics implements OnInit {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly metrics = signal<Metrics | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly maxDaily = computed(() => Math.max(1, ...(this.metrics()?.daily.map(day => day.count) ?? [])));
  readonly monthLabel = computed(() => {
    const month = this.metrics()?.month;
    return month ? new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T12:00:00Z`)) : '';
  });
  private loadedDay = '';
  private request?: Subscription;

  ngOnInit() {
    this.refresh();
    interval(30_000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.metrics() && this.dayKey() !== this.loadedDay) this.refresh();
    });
  }

  refresh() {
    this.request?.unsubscribe();
    this.loading.set(true); this.error.set('');
    this.request = this.api.getAttentionMetrics().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false))).subscribe({
      next: metrics => { this.metrics.set(metrics); this.loadedDay = this.dayKey(); },
      error: () => this.error.set('No fue posible actualizar las métricas.'),
    });
  }

  private dayKey() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: this.metrics()?.timezone ?? 'America/Santiago', dateStyle: 'short' }).format(new Date());
  }

  formatPrice(value: number) { return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value); }
}
