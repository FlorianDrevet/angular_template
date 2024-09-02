import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from './layouts/footer/footer.component';
import { NavigationComponent } from './layouts/navigation/navigation.component';



@NgModule({
  declarations: [
    FooterComponent,
    NavigationComponent
  ],
  exports: [
    FooterComponent,
    NavigationComponent
  ],
  imports: [
    CommonModule
  ]
})
export class CoreModule { }
