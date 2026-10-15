import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BusinessProfileForm, businessCategories, businessLabels, attentionModes } from '../models/business-category';

@Component({ selector: 'app-business-profile-fields', imports: [FormsModule], template: `
  <label>Tipo de negocio<select name="category" [(ngModel)]="form().category" [ngModelOptions]="{standalone: true}" [disabled]="disabled()">
    @for (item of categories; track item.value) { <option [value]="item.value">{{ item.label }}</option> }
  </select></label>
  <label>Nombre de {{ labels().professional.toLowerCase() }}<input name="professionalName" [(ngModel)]="form().professionalName" [ngModelOptions]="{standalone: true}" maxlength="100" [disabled]="disabled()" placeholder="Nombre que aparecerá en el perfil público"></label>
  <label>Especialidades<textarea name="specialties" [(ngModel)]="form().specialties" [ngModelOptions]="{standalone: true}" maxlength="300" rows="3" [disabled]="disabled()" [placeholder]="form().category === 'WELLNESS' ? 'Ej.: reiki, aromaterapia, reflexología' : 'Describe tus especialidades'"></textarea></label>
  <label>Modalidad de atención<select name="attentionMode" [(ngModel)]="form().attentionMode" [ngModelOptions]="{standalone: true}" [disabled]="disabled()"><option value="">Sin especificar</option>@for (item of modes; track item.value) { <option [value]="item.value">{{ item.label }}</option> }</select></label>
  <label>Dirección pública<input name="address" [(ngModel)]="form().address" [ngModelOptions]="{standalone: true}" maxlength="300" [disabled]="disabled()" placeholder="Dirección del lugar de atención (opcional)"></label>
  <p>Esta información se mostrará en tu perfil público. Las notas de atenciones permanecen privadas.</p>
  `, styles: [`:host { display: grid; gap: 20px; } label { display: grid; gap: 10px; font-weight: 600; } input, textarea, select { width: 100%; min-width: 0; padding: 14px; border: 1px solid var(--border-strong); border-radius: 12px; background: var(--surface); } p { color: var(--text-secondary); font-size: 13px; font-weight: 400; }`] })
export class BusinessProfileFields {
  readonly form = input.required<BusinessProfileForm>();
  readonly disabled = input(false);
  readonly categories = businessCategories;
  readonly modes = attentionModes;
  labels() { return businessLabels(this.form().category); }
}
