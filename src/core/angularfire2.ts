
import {first} from 'rxjs/operators';
import { InjectionToken, NgZone } from '@angular/core';
import { Subscription ,  Observable ,  Subscriber } from 'rxjs';
import { observeOn } from 'rxjs/operators';
import { queue } from 'rxjs/scheduler/queue';

import firebase from '@firebase/app';
import { FirebaseApp, FirebaseOptions } from '@firebase/app-types';

import 'zone.js';


export const FirebaseAppName = new InjectionToken<string>('angularfire2.appName');
export const FirebaseAppConfig = new InjectionToken<FirebaseOptions>('angularfire2.config');

// Put in database.ts when we drop database-depreciated
export const RealtimeDatabaseURL = new InjectionToken<string>('angularfire2.realtimeDatabaseURL');

export class FirebaseZoneScheduler {
  constructor(public zone: NgZone) {}
  schedule(...args: any[]): Subscription {
    return <Subscription>this.zone.runGuarded(function() { return queue.schedule.apply(queue, args)});
  }
  // TODO this is a hack, clean it up
  keepUnstableUntilFirst<T>(obs$: Observable<T>) {
    return new Observable<T>(subscriber => {
      const noop = () => {};
      const task = Zone.current.scheduleMacroTask('firebaseZoneBlock', noop, {}, noop, noop);
      obs$.pipe(first()).subscribe(() => this.zone.runOutsideAngular(() => task.invoke()));
      return obs$.subscribe(subscriber);
    });
  }
  runOutsideAngular<T>(obs$: Observable<T>): Observable<T> {
    const outsideAngular = new Observable<T>(subscriber => {
      return this.zone.runOutsideAngular(() => {
        return obs$.subscribe(subscriber);
      });
    });
    return observeOn.call(outsideAngular, this);
  }
}