import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../models/user.model';
@Component({ selector: 'app-login', imports: [RouterLink, FormsModule], templateUrl: './login.html', styleUrl: './login.css' })
export class Login implements OnInit {
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly mode = signal<'login' | 'register' | null>(null);
  form = { email: '', password: '', firstName: '', lastName: '', phone: '', address: '' };
  constructor(private readonly auth: AuthService, private readonly router: Router, private readonly route: ActivatedRoute) {}
  get companyRegistration(): boolean { return this.route.snapshot.queryParamMap.get('returnUrl') === '/companies'; }
  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) { this.navigateAfterLogin(user); return; }
    const mode = this.route.snapshot.queryParamMap.get('mode');
    if (mode === 'register' || mode === 'login') this.choose(mode);
  }
  choose(mode: 'login' | 'register'): void { this.mode.set(mode); this.errorMessage.set(''); this.form.password = ''; }
  submit(): void {
    if (this.loading() || !this.mode()) return;
    this.loading.set(true); this.errorMessage.set('');
    const request = this.mode() === 'login' ? this.auth.login(this.form.email, this.form.password) : this.auth.register(this.form);
    request.subscribe({ next: user => { this.form.password = ''; this.loading.set(false); this.navigateAfterLogin(user); }, error: err => { this.loading.set(false); this.errorMessage.set(err?.error?.error ?? 'No fue posible acceder. Intenta nuevamente.'); } });
  }
  private navigateAfterLogin(user: User): void {
    const target = this.route.snapshot.queryParamMap.get('returnUrl');
    const safe = target && target.startsWith('/') && !target.startsWith('//') && !target.includes('\\') && (!target.startsWith('/admin') || user.role === 'SUPERADMIN') && (!target.startsWith('/dashboard') || user.role === 'PROFESSIONAL') && (!(target.startsWith('/booking') || target.startsWith('/my-reservations')) || user.role === 'CLIENT');
    void this.router.navigateByUrl(safe ? target : user.role === 'SUPERADMIN' ? '/admin' : user.role === 'PROFESSIONAL' ? '/dashboard' : '/');
  }
}
