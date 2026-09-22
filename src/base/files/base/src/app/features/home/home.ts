import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { APP_CONFIG } from '../../core/config/app-config.token';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  protected readonly config = inject(APP_CONFIG);
}
