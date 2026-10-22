import { Component, input, inject, signal, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
interface Photo { id: string; imageUrl: string; caption: string | null; }
@Component({ selector: 'app-business-gallery', imports: [FormsModule], template: `
<section class="gallery"><h2>Fotos del negocio</h2>
@if (error()) { <p role="alert">{{ error() }}</p> }
@if (editable()) {
<form (ngSubmit)="upload(fileInput)"><label>Seleccionar foto<input #fileInput name="image" type="file" accept="image/jpeg,image/png,image/webp" (change)="select($event)" [disabled]="busy()"></label>
<label>Descripción (opcional)<input name="caption" [(ngModel)]="caption" maxlength="300" [disabled]="busy()"></label>
<small>Fotos públicas · JPEG, PNG o WebP · máximo 5 MB. No subas información privada de clientes o pacientes.</small>
<button type="submit" [disabled]="busy() || !file">{{ busy() ? 'Procesando…' : 'Subir foto' }}</button></form>
}
<div class="photos">@for (photo of photos(); track photo.id) {
<figure><a [href]="photo.imageUrl" target="_blank" rel="noopener noreferrer"><img [src]="photo.imageUrl" [alt]="photo.caption || 'Foto del negocio'" loading="lazy"></a>@if (photo.caption) { <figcaption>{{ photo.caption }}</figcaption> }
@if (editable()) { <button type="button" [disabled]="busy()" (click)="remove(photo)">Eliminar foto</button> }</figure>
} @empty { <p>El negocio todavía no ha publicado fotos.</p> }</div></section>`, styles: [`
.gallery { margin: 32px 0; padding: 24px; border: 1px solid #ddd; border-radius: 20px; background: white; }
.photos { display: grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap: 18px; margin-top: 24px; }
figure { margin: 0; } img { width: 100%; height: 220px; object-fit: cover; border-radius: 12px; } figcaption { padding: 10px 0; }
form, label { display: grid; gap: 10px; min-width: 0; } form { margin: 20px 0; } input, button { padding: 12px; border: 1px solid #ddd; border-radius: 10px; font: inherit; } input { width: 100%; min-width: 0; max-width: 100%; } button { cursor: pointer; } small { color: #666; }
`] })
export class BusinessGallery implements OnChanges {
  readonly businessId = input.required<string>();
  readonly editable = input(false);
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl.replace(/\/$/, '') + '/api/businesses';
  readonly photos = signal<Photo[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  file: File | null = null;
  caption = '';
  ngOnChanges(): void { this.http.get<Photo[]>(`${this.base}/${this.businessId()}/photos`).subscribe({ next: photos => this.photos.set(photos), error: () => this.error.set('No fue posible cargar las fotos.') }); }
  select(event: Event): void {
    this.error.set(''); const input = event.target as HTMLInputElement; this.file = input.files?.[0] ?? null;
    if (this.file && (!['image/jpeg', 'image/png', 'image/webp'].includes(this.file.type) || this.file.size > 5 * 1024 * 1024)) { this.file = null; input.value = ''; this.error.set('Usa JPEG, PNG o WebP de hasta 5 MB.'); }
  }
  upload(input: HTMLInputElement): void {
    if (!this.file || this.busy()) return;
    const data = new FormData(); data.append('image', this.file); data.append('caption', this.caption);
    this.busy.set(true); this.error.set('');
    this.http.post<Photo>(`${this.base}/me/photos`, data).subscribe({ next: photo => { this.photos.update(photos => [photo, ...photos]); this.file = null; input.value = ''; this.caption = ''; this.busy.set(false); }, error: err => { this.busy.set(false); this.error.set(err?.error?.error ?? 'No fue posible subir la foto.'); } });
  }
  remove(photo: Photo): void {
    if (this.busy()) return;
    this.busy.set(true); this.error.set('');
    this.http.delete(`${this.base}/me/photos/${photo.id}`).subscribe({ next: () => { this.photos.update(photos => photos.filter(item => item.id !== photo.id)); this.busy.set(false); }, error: err => { this.busy.set(false); this.error.set(err?.error?.error ?? 'No fue posible eliminar la foto.'); } });
  }
}
