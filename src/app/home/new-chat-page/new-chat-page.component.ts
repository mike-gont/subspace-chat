import { Component, OnInit } from '@angular/core';
import { HomeComponent } from 'app/home/home.component';
import { ViewChild, ElementRef } from '@angular/core';
import { ChatManagerService } from 'app/chat-manager.service';

@Component({
  selector: 'app-new-chat-page',
  templateUrl: './new-chat-page.component.html',
  styleUrls: ['./new-chat-page.component.scss']
})
export class NewChatPageComponent implements OnInit {
  @ViewChild('my_offer') private myOfferTextEl: ElementRef;
  @ViewChild('my_answer') private myAnswerTextEl: ElementRef;

  isInitiating: boolean; // false means joining a chat

  constructor(private homeComponent: HomeComponent, private chatMgr: ChatManagerService) {
    this.isInitiating = false;
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.createOffer();
  }

  closePage(): void {
    this.homeComponent.closePopUp();
  }

  createNewChat(name: string, answer: string): void {
    console.warn("unimplemented");
    this.chatMgr.createChat(name);
    // this.subspaceCom.addConnection(); // TODO: finish this
    // close on success
    this.closePage();
  }

  joinNewChat(name: string, offer: string): void {
    console.warn("unimplemented");
    this.chatMgr.createChat(name);
    // this.subspaceCom.addConnection(); // TODO: finish this
    // close on success
    this.closePage();
  }

  createAnswer(offer: string): void {
    console.warn("unimplemented");
    this.myAnswerTextEl.nativeElement.value = "****ANSWER******";
    // TODO: get from subspace com
  }

  createOffer(): void {
    this.myOfferTextEl.nativeElement.value = "****OFFER*******" + Date().toString();
    // TODO: get from subspace com
  }

    
}
