import { EnvironmentProviders, isDevMode } from '@angular/core';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from './transloco-loader';

export function provideI18n(): EnvironmentProviders[] {
  return provideTransloco({
    config: {
      availableLangs: ['en', 'fr'],
      defaultLang: 'en',
      fallbackLang: 'en',
      reRenderOnLangChange: true,
      prodMode: !isDevMode(),
    },
    loader: TranslocoHttpLoader,
  });
}
