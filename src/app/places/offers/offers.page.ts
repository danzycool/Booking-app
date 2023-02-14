import { Component, OnDestroy, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Place } from '../places.model';
import { PlacesService } from '../places.service';

@Component({
  selector: 'app-offers',
  templateUrl: './offers.page.html',
  styleUrls: ['./offers.page.scss'],
})

export class OffersPage implements OnInit, OnDestroy {
  myOfferedPlace: Place[];
  placesSub: Subscription;

  constructor(private placesService: PlacesService,
              private loadingCtrl: LoadingController){}

  ngOnInit() {
    this.placesSub = this.placesService.places.subscribe(place=>{
      this.myOfferedPlace = place;
    });
  }

  ionViewWillEnter(){
    this.loadingCtrl.create(
      {message: 'Loading Offers...'}
    ).then(loadingEl=>{
      loadingEl.present();
      this.placesService.fetchPlaces().subscribe(
        ()=>{
          loadingEl.dismiss()
        }
      );
    })
    
  }

  ngOnDestroy(){
    if(this.placesSub){
      this.placesSub.unsubscribe()
    }
  }

  onEdit(offerId: string){
    console.log('Editing Item', offerId)
  }

}
