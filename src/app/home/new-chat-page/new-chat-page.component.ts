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
  localOfferTextElClass:string = "textarea";
  localAnswerTextElClass:string = "textarea";
  remoteOfferTextElClass:string = "textarea";
  remoteAnswerTextElClass:string = "textarea";

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
    if (this.newSessionId == undefined && this.newChatId == undefined) {
      this.newSessionId = this.subspaceCom.createNewSession();
      this.observeConnectionState(this.newSessionId);
      this.newChatId = this.newSessionId;
    } else {
      console.log("already created session #" + this.newSessionId);
    }
  }

  closePage(): void {
    if (this.newSessionId != undefined && this.subspaceCom.connectionIsOpen(this.newSessionId) == false) {
      this.subspaceCom.closeSession(this.newSessionId);
    }
    this.homeComponent.closePopUp();
  }

  async createNewChat(name: string) {
    if (name == "") {
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
    if (this.offerWasCreated) {
      alert("offer was already created");
      return;
    }
    let localOffer = await this.subspaceCom.createOffer(this.newSessionId);
    if (localOffer == undefined) {
      this.localOfferTextElClass = "textarea invalid";
      alert("couldn't create an offer");
      return;
    }
    this.localOfferTextEl.nativeElement.value = localOffer;
    this.localOfferTextElClass = "textarea valid";
    this.offerWasCreated = true;
  }

  async acceptComAndCreateAnswer(remoteOfferStr: string) {
    if (this.answerWasCreated) {
      alert("answer was already created\nto start again with another offer, please reopen this window");
      return;
    }
    if (this.isJsonString(remoteOfferStr) == false) {
      this.remoteOfferTextElClass = "textarea invalid";
      alert("remote offer is not a valid Json string");
      return;
    }
    let localAnswer = await this.subspaceCom.acceptRemoteOfferAndCreateAnswer(remoteOfferStr, this.newSessionId);
    if (localAnswer == undefined) {
      this.remoteOfferTextElClass = "textarea invalid";
      alert("couldn't create an answer for the given remote offer");
      return;
    }
    this.localAnswerTextEl.nativeElement.value = localAnswer;
    this.localAnswerTextElClass = "textarea valid";
    this.remoteOfferTextElClass = "textarea valid";
    this.answerWasCreated = true;
  }

  async acceptAnswer(remoteAnswerStr: string) {
    if (this.isJsonString(remoteAnswerStr) == false) {
      this.remoteAnswerTextElClass = "textarea invalid";
      alert("remote answer is not a valid Json string");
      return;
    }
    const session = this.subspaceCom.getSession(this.newSessionId);
    if (!session) {
      alert("can't accept answer, session is not active");
      return;
    }
    await this.subspaceCom.acceptAnswer(remoteAnswerStr, this.newSessionId);

    if (session.peerConnection.signalingState == "stable") {
      this.remoteAnswerTextElClass = "textarea valid";
    }
    else {
      this.remoteAnswerTextElClass = "textarea invalid";
      alert("couldn't accept remote answer");
    }
  }

  observeConnectionState(sessionId: number): void {
    const session = this.subspaceCom.getSession(sessionId);
    if (!session) {
      console.error("observeConnectionState: session #" + sessionId + " doesn't exist! ");
      return;
    }
    const connection = session.peerConnection;
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

  isJsonString(str: string): boolean {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}


}
