import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, UrlSegment } from '@angular/router';
import { ActionSheetController, AlertController, LoadingController, ModalController, NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/auth.service';
import { BookingService } from 'src/app/bookings/booking.service';
import { CreateBookingComponent } from 'src/app/bookings/create-booking/create-booking.component';
import { Place } from '../../places.model';
import { PlacesService } from '../../places.service';

@Component({
  selector: 'app-place-detail',
  templateUrl: './place-detail.page.html',
  styleUrls: ['./place-detail.page.scss'],
})
export class PlaceDetailPage implements OnInit, OnDestroy {
  place: Place;
  isBookable = false;
  isLoading = false;
  private placeSub : Subscription;
  
  constructor(private router:Router, 
              private navCtrl:NavController,
              private modalCtrl:ModalController,
              private route: ActivatedRoute,
              private placesService: PlacesService,
              private actionSheetCtrl: ActionSheetController,
              private bookingService: BookingService,
              private loadingCtrl: LoadingController,
              private authService: AuthService,
              private alertCtrl: AlertController,
              ){}

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      if(!paramMap.has('placeId')){
        this.router.navigateByUrl('places/tabs/discover');
        return;
      }
        this.isLoading = true;
        let fetchedUserId: String;
        this.authService.userId.pipe(
          take(1),
          switchMap(userId=>{
            if(!userId){
              throw new Error('Found No User')
            }else{
              fetchedUserId = userId;
              return this.placesService.getPlace(paramMap.get('placeId'))
            }
          })
        )
        .subscribe(place=>{
          this.place = place;
          this.isBookable = this.place.userId !== fetchedUserId;
          this.isLoading = false;
        },
        error=>{
          this.alertCtrl.create({
            header: 'An error has ocurred!!',
            message: 'Unable to load places, please try again later.',
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
        );
      });     
  }

  ngOnDestroy(){
    this.placeSub.unsubscribe();
  }
    
  onBookPlace(){
    
    this.actionSheetCtrl.create({
      header: 'Choose an Action',
      buttons: [
        {
          text: 'Select Date',
          handler: ()=> {
            this.openBookingModal('select');
          }
        },
        {
          text: 'Random Date',
          handler: ()=> {
            this.openBookingModal('random');
          }
        },
        {
          text: 'Cancel',
          role: 'destructive'
        }

      ]
    }).then(actionSheetEl => {
      actionSheetEl.present();
    });

  }  

  openBookingModal(mode: 'select' | 'random'){
      
    console.log(mode);

    this.modalCtrl.create(
      {
        component: CreateBookingComponent,
        componentProps: {selectedPlace: this.place, selectedMode: mode}
      }
    )
    .then(modalEl => {modalEl.present();
      return modalEl.onDidDismiss()}
    )
    .then(resultData => {
      // console.log(resultData.data, resultData.role);
      if(resultData.role === "confirm"){

        this.loadingCtrl.create({
          message: 'Booking Place...'
        })
        .then(loadingEl=>{
          loadingEl.present();
          const data = resultData.data.bookingData;
          this.bookingService.addBooking(
              this.place.id, 
              this.place.title, 
              this.place.imageUrl, 
              data.firstName,
              data.lastName,
              data.guestNumber,
              data.dateFrom,
              data.dateTo
          )
          .subscribe(()=>{
              loadingEl.dismiss()
          })
        })

      }
    });
  }
}
