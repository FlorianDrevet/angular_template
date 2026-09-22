import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';
import { map } from 'rxjs';

/**
 * Example protected page, gated by `MsalGuard` on its route (see
 * `app.routes.ts`). Demonstrates reading the signed-in account as a signal
 * via `toSignal` on `MsalBroadcastService.inProgress$`, which is the
 * zoneless-friendly way to consume MSAL's RxJS-based state.
 */
@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile {
  private readonly msal = inject(MsalService);
  private readonly broadcast = inject(MsalBroadcastService);

  protected readonly account = toSignal(
    this.broadcast.inProgress$.pipe(
      map((): AccountInfo | null => this.msal.instance.getActiveAccount() ?? this.msal.instance.getAllAccounts()[0] ?? null),
    ),
    { initialValue: null },
  );

  protected logout(): void {
    this.msal.logoutRedirect();
  }
}
