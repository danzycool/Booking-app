import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { CreateBookingComponent } from 'src/app/bookings/create-booking/create-booking.component';



@NgModule({
  declarations: [AppComponent, CreateBookingComponent,],
  entryComponents: [],
  imports: [BrowserModule, 
            FormsModule, 
            HttpClientModule, 
            IonicModule.forRoot(), 
            AppRoutingModule,
          ],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
