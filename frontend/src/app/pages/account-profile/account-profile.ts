import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
@Component({ selector: 'app-account-profile', imports: [FormsModule, RouterLink], templateUrl: './account-profile.html', styleUrl: './account-profile.css' })
export class AccountProfile {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  form = { firstName: this.auth.currentUser()?.firstName ?? '', lastName: this.auth.currentUser()?.lastName ?? '', phone: this.auth.currentUser()?.phone ?? '', address: this.auth.currentUser()?.address ?? '' };
  save(proceed = false): void {
    if (this.busy()) return;
    this.busy.set(true); this.error.set(''); this.message.set('');
    this.auth.updateContact(this.form).subscribe({ next: () => { this.busy.set(false); this.message.set('Datos guardados.'); if (proceed) this.navigate(); }, error: err => { this.busy.set(false); this.error.set(err?.error?.error ?? 'No fue posible guardar tus datos.'); } });
  }
  private navigate(): void {
    const target = this.route.snapshot.queryParamMap.get('returnUrl');
    const allowed = target && /^\/(?:companies|booking\/[^/?#]+|my-reservations|dashboard(?:\/[a-z-]+)?|professional\/setup)(?:[?#].*)?$/.test(target);
    void this.router.navigateByUrl(allowed ? target : this.auth.isProfessional() ? '/dashboard' : '/');
  }
}

