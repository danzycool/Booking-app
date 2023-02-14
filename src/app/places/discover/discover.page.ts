import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoadingController, MenuController } from '@ionic/angular';
import { SegmentChangeEventDetail } from '@ionic/core';
import { Subscription } from 'rxjs';
import { PlacesService } from '../places.service';
import { Place } from '../places.model'
import { AuthService } from '../../auth/auth.service';
import { take } from 'rxjs/operators';


@Component({
  selector: 'app-discover',
  templateUrl: './discover.page.html',
  styleUrls: ['./discover.page.scss'],
})
export class DiscoverPage implements OnInit, OnDestroy {
  loadedPlaces : Place[];
  listedLoadedPlaces : Place[];
  relevantPlaces : Place[];
  isLoading = true;
  private placesSub: Subscription;

  constructor(private placesService: PlacesService, 
              private menuCtrl: MenuController,
              private authService: AuthService,
              private loadingCtrl: LoadingController
             ) { }

  ngOnInit() {
    this.placesSub = this.placesService.places.subscribe(places => {
      this.loadedPlaces = places;
      this.relevantPlaces = this.loadedPlaces;
      this.listedLoadedPlaces = this.relevantPlaces.slice(1);
    });    
  }

  ionViewWillEnter(){
    this.loadingCtrl.create({
      message: 'Loading Places...'
    })
    .then(loadingEl=>{
      loadingEl.present();
      this.placesService.fetchPlaces().subscribe(()=>{
        loadingEl.dismiss();
        this.isLoading = false;
      });
    });    
  }

  ngOnDestroy(){
    if(this.placesSub){
      this.placesSub.unsubscribe();
    }
  }

  onOpenMenu(){
    this.menuCtrl.toggle()
  }

  onFilterUpdate(event: CustomEvent<SegmentChangeEventDetail>){
    this.authService.userId.pipe(take(1)).subscribe(userId=>{
      if(event.detail.value==='all'){
        this.relevantPlaces = this.loadedPlaces;
        this.listedLoadedPlaces = this.relevantPlaces.slice(1);
      }else{
        this.relevantPlaces = this.loadedPlaces.filter(
          place =>place.userId !== userId
        ); 
        this.listedLoadedPlaces = this.relevantPlaces.slice(1);
      }
    });
    
  }

}
