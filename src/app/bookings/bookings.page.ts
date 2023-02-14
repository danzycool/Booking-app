import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonItemSliding, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Booking } from './booking-model';
import { BookingService } from './booking.service';


@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.page.html',
  styleUrls: ['./bookings.page.scss'],
})

export class BookingsPage implements OnInit, OnDestroy {
  loadedBookings: Booking[];
  isLoading = true;
  private bookingSub: Subscription;

  constructor(private bookingService: BookingService,
              private loadingCtrl: LoadingController,
              private alertCtrl: AlertController,
              private router: Router,
              ) { }

  ngOnInit() {
    this.bookingSub = this.bookingService.bookings.subscribe(bookings=>{
      this.loadedBookings = bookings;
    });
  }

  ionViewWillEnter(){
    this.loadingCtrl.create({
      message: 'Fetching Bookings...'
    })
    .then(loadingEl=>{
      loadingEl.present();
      this.bookingService.fetchBookings()
      .subscribe(
        ()=>{
          loadingEl.dismiss();
          this.isLoading = false;
        },
        error=>{
          this.alertCtrl.create({
            header: 'An error has ocurred!!',
            message: 'Unable to fetch your bookings, please try again later.',
            buttons:  [
                        {
                          text: 'Okay',
                          handler: ()=>{
                            this.router.navigate(['/places/tabs/discover']);
                          }
                        }
            ]
          }).then(alertEl=>{
            alertEl.present();
          })
        }
      )
    })    
  }

  ngOnDestroy() {
    if(this.bookingSub){
      this.bookingSub.unsubscribe();
    }
  }

  onCancelBooking(bookingId: string, slidingEl: IonItemSliding){
    slidingEl.close();
    this.loadingCtrl.create({keyboardClose: true, message: 'Canceling Booking...'})
                            .then(loadingEl => {loadingEl.present();
                              this.bookingService.cancelBooking(bookingId).subscribe(()=>{
                                loadingEl.dismiss()
                              })
                            });    
  }

}