import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {JWT_OPTIONS, JwtHelperService} from "@auth0/angular-jwt";


@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [
    {
      provide: JWT_OPTIONS,
      useValue: JWT_OPTIONS
    },
    JwtHelperService
  ],
})
export class SharedModule { }
