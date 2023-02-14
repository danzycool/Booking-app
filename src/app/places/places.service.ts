import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { delay, map, take, tap, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { Place } from './places.model';

interface PlaceData {
  availableFrom: string,
  availableTo: string,
  description: string,
  imageUrl: string,
  price: number,
  title: string,
  userId: string
}

@Injectable({
  providedIn: 'root'
})
export class PlacesService {

  private _Places = new BehaviorSubject<Place[]>([]);

  constructor(private authService: AuthService,
    private http: HttpClient) { }

  get places() {
    return this._Places.asObservable();
  }

  getPlace(id: string) {
    return this.authService.token.pipe(
      take(1),
      switchMap(
        token => {
          return this.http.get<PlaceData>(
            `https://ionic-angular-project-1719c-default-rtdb.firebaseio.com/offered-places/${id}.json?auth=${token}`
          )
        }
      ),
      map(
        placeData => {
          return new Place(
            id,
            placeData.title,
            placeData.description,
            placeData.imageUrl,
            placeData.price,
            new Date(placeData.availableFrom), 
            new Date(placeData.availableTo),
            placeData.userId
          );
        }
      )
    )
  }

  fetchPlaces() {
    return this.authService.token.pipe(
      take(1),
      switchMap(
        token => {
          return this.http
            .get<{ [key: string]: PlaceData }>(
              `https://ionic-angular-project-1719c-default-rtdb.firebaseio.com/offered-places.json?auth=${token}`
            )
        }
      ),
      map(resData => {
        const places = [];
        for (const key in resData) {
          if (resData.hasOwnProperty(key)) {
            places.push(new Place(
              key,
              resData[key].title,
              resData[key].description,
              resData[key].imageUrl,
              resData[key].price,
              new Date(resData[key].availableFrom),
              new Date(resData[key].availableTo),
              resData[key].userId
            ))
          }
        }
        return places;
      }),
      tap(
        places => {
          this._Places.next(places)
        }
      )
    )
  }

  addPlace(
    title: string,
    description: string,
    price: number,
    dateFrom: Date,
    dateTo: Date
  ) {
    let generatedId: string;
    let newPlace: Place;
    let fetchedUserId: string;
    return this.authService.userId.pipe(
      take(1),
      switchMap(userId => {
        fetchedUserId = userId;
        return this.authService.token;
      }),
      take(1),
      switchMap(token => {
        if (!fetchedUserId) {
          throw new Error('No user Found')
        } else {
          newPlace = new Place(
            Math.random().toString(),
            title,
            description,
            `https://mygulitypleasures.files.wordpress.com/2018/01/vienna-lonelyplanetimages-imgix-net.jpg?w=560&h=373?auth=${token}`,
            price,
            dateFrom,
            dateTo,
            fetchedUserId
          );

          return this.http.post<{ name: string }>(
            `https://ionic-angular-project-1719c-default-rtdb.firebaseio.com/offered-places.json?auth=${token}`,
            {
              ...newPlace, id: null
            }
          )
        }
      }),
      switchMap(resData => {
        generatedId = resData.name;
        return this.places;
      }),
      take(1),
      tap(places => {
        newPlace.id = generatedId;
        this._Places.next(places.concat(newPlace));
      })
    );
  }

  updatePlace(placeId: string, title: string, description: string) {
    let updatedPlaces: Place[];
    let fetchedToken: string;
    return this.authService.token.pipe(
      take(1),
      switchMap(token => {
        fetchedToken = token;
        return this.places;
      }),
      take(1),
      switchMap(places => {
        if (!places || places.length <= 0) {
          return this.fetchPlaces();
        } else {
          return of(places);
        }
      }),
      take(1),
      switchMap(places => {
        const updatedPlaceIndex = places.findIndex(place => place.id === placeId);
        updatedPlaces = [...places];
        const oldPlace = updatedPlaces[updatedPlaceIndex];
        updatedPlaces[updatedPlaceIndex] = new Place(
          oldPlace.id,
          title,
          description,
          oldPlace.imageUrl,
          oldPlace.price,
          oldPlace.availableFrom,
          oldPlace.availableTo,
          oldPlace.userId
        );

        return this.http.put(
          `https://ionic-angular-project-1719c-default-rtdb.firebaseio.com/offered-places/${placeId}.json?auth=${fetchedToken}`,
          { ...updatedPlaces[updatedPlaceIndex], id: null }
        )
      }),
      tap(() => {
        this._Places.next(updatedPlaces);
      })
    );


  }



}
