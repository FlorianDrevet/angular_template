import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

/**
 * Example protected page, gated by `autoLoginPartialRoutesGuard` on its
 * route (see `app.routes.ts`). `OidcSecurityService.authenticated` and
 * `.userData` are native signals, so no `toSignal` interop is needed.
 */
@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile {
  private readonly oidc = inject(OidcSecurityService);

  protected readonly authenticated = this.oidc.authenticated;
  protected readonly userData = this.oidc.userData;

  protected logout(): void {
    this.oidc.logoff().subscribe();
  }
}
