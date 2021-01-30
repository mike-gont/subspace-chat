import { Component, OnInit } from '@angular/core';
import { HomeComponent } from 'app/home/home.component';
import { ViewChild, ElementRef } from '@angular/core';
import { ChatManagerService } from 'app/chat-manager.service';
import { SubspaceComService } from 'app/subspace-com.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-new-chat-page',
  templateUrl: './new-chat-page.component.html',
  styleUrls: ['./new-chat-page.component.scss']
})
export class NewChatPageComponent implements OnInit {
  @ViewChild('local_offer') private localOfferTextEl: ElementRef;
  @ViewChild('local_answer') private localAnswerTextEl: ElementRef;

  newChatId: number; // TODO: we use sessionId as chatId. consider separation of these ids.
  newSessionId: number;
  isInitiating: boolean; // false means joining a chat
  offerWasCreated: boolean;
  answerWasCreated: boolean;
  connectionState: string;
  iceConnectionState: string;

  constructor(
    private homeComponent: HomeComponent,
    private chatMgr: ChatManagerService,
    private subspaceCom: SubspaceComService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.isInitiating = false;
    this.offerWasCreated = false;
    this.answerWasCreated = false;
    this.connectionState = "unknown";
    this.iceConnectionState = "unknown";
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
  }

  closePage(): void {
    // TODO: clean created session if the connection wasn't completed.
    this.homeComponent.closePopUp();
  }

  async createNewChat(name: string) {
    if (name == "") {
      // TODO: show in the GUI
      alert("new chat name is empty");
      return;
    }
    if (!this.connectionIsReady()) {
      alert("connection is not ready!");
      return;
    }
    this.chatMgr.createChat(this.newChatId, name);
    this.closePage();
  }

  async initComAndCreateOffer() {
    // TODO: check if answer was created and remove connection
    if (this.offerWasCreated) {
      // TODO: show in the GUI
      console.warn("offer was already created");
      return;
    }
    if (this.newSessionId == undefined && this.newChatId == undefined) {
      this.newSessionId = this.subspaceCom.createNewSession();
      this.observeConnectionState(this.newSessionId);
      this.newChatId = this.newSessionId;
    }
    let localOffer = await this.subspaceCom.createOffer(this.newSessionId);
    if (localOffer == undefined) {
      // TODO: show in the GUI
      console.warn("couldn't create a local offer");
      return;
    }
    this.localOfferTextEl.nativeElement.value = localOffer;
    this.offerWasCreated = true;
  }

  async acceptComAndCreateAnswer(remoteOffer: string) {
    // TODO: check if offer was created and remove connection
    if (this.answerWasCreated) {
      // TODO: show in the GUI
      console.warn("answer was already created");
      return;
    }
    if (this.newSessionId == undefined && this.newChatId == undefined) {
      this.newSessionId = this.subspaceCom.createNewSession();
      this.observeConnectionState(this.newSessionId);
      this.newChatId = this.newSessionId;
    }
    let localAnswer = await this.subspaceCom.acceptRemoteOfferAndCreateAnswer(remoteOffer, this.newSessionId);
    if (localAnswer == undefined) {
      // TODO: show in the GUI
      console.warn("couldn't create an answer for the given remote offer");
      return;
    }
    this.localAnswerTextEl.nativeElement.value = localAnswer;
    this.answerWasCreated = true;
  }

  async acceptAnswer(remoteAnswer: string) {
    await this.subspaceCom.acceptAnswer(remoteAnswer, this.newSessionId);
  }

  observeConnectionState(sessionId: number): void {
    const connection = this.subspaceCom.getPeerConnection(this.newSessionId);
    connection.onconnectionstatechange = event => {
      this.connectionState = connection.connectionState;
      this.changeDetectorRef.detectChanges();
    }
    connection.oniceconnectionstatechange = event => {
      this.iceConnectionState = connection.iceConnectionState;
      this.changeDetectorRef.detectChanges();
    }
  }

  connectionIsReady(): boolean {
    return this.connectionState == "connected" && this.iceConnectionState == "connected";
  }

}
