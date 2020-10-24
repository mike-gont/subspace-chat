import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void { }

  // Observable chatId source and stream
  private currentChatIdSource = new Subject<number>();
  currentChatId$ = this.currentChatIdSource.asObservable();
  setCurrentChatId(chatId: number) {
    this.currentChatIdSource.next(chatId);
  }

}
