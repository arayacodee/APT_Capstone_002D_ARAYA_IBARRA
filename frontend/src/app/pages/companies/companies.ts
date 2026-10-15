import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { BusinessCategory, businessCategories } from '../../models/business-category';

@Component({ selector: 'app-companies', imports: [FormsModule, RouterLink], templateUrl: './companies.html', styleUrl: './companies.css' })
export class Companies {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly categories = businessCategories;
  readonly busy = signal(false);
  readonly error = signal('');
  readonly saved = signal(false);
  readonly step = signal<'business' | 'payment'>('business');
  form = { businessName: '', category: 'GENERAL' as BusinessCategory, description: '' };
  constructor() {
    if (this.auth.isLoggedIn()) this.api.professionalApplication().subscribe({ next: response => { if (response.application) this.form = { businessName: response.application.businessName, category: response.application.category, description: response.application.description ?? '' }; }, error: () => this.error.set('No fue posible recuperar tu solicitud anterior.') });
  }
  save(): void {
    if (this.busy()) return;
    this.busy.set(true); this.error.set(''); this.saved.set(false);
    this.api.saveProfessionalApplication({ ...this.form, businessName: this.form.businessName.trim(), description: this.form.description.trim() }).subscribe({
      next: () => { this.busy.set(false); this.saved.set(true); this.step.set('payment'); },
      error: err => { this.busy.set(false); this.error.set(err?.error?.error ?? 'No fue posible guardar la solicitud.'); }
    });
  }
  activate(): void {
    if (this.busy()) return;
    this.busy.set(true); this.error.set('');
    this.auth.activateProfessionalDemo().subscribe({
      next: () => { this.busy.set(false); void this.router.navigateByUrl('/dashboard'); },
      error: err => { this.busy.set(false); this.error.set(err?.error?.error ?? 'No fue posible crear tu perfil. Intenta nuevamente.'); }
    });
  }
}
