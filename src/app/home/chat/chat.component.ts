import { Component, OnInit } from '@angular/core';
import { UserManagerService } from 'app/user-manager.service';
import { ChatManagerService, ChatData, ChatMsg, MsgStatus } from 'app/chat-manager.service';
import { ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  @ViewChild('chatview') private chatDiv: ElementRef;
  @ViewChild('inputbox') private inputBoxEl: ElementRef;

  chatData: ChatData;

  constructor(private userManager: UserManagerService, private chatManager: ChatManagerService) {
    this.observeActiveChatId();
    this.observeActiveUserId();
    this.observeNewMessageFlag();
  }

  ngOnInit(): void {
    this.scrollToBottom();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  observeActiveChatId(): void {
    // load active chat when the activeChatId changes
    this.chatManager.activeChatId$.subscribe(
      id => {
        this.onChatSwitch();
      }
    );
  }

  observeActiveUserId(): void {
    // clear chat when switching users
    this.userManager.activeUserId$.subscribe(
      id => {
        this.onUserSwitch();
      }
    );
  }

  observeNewMessageFlag(): void {
    this.chatManager.newMessageFlag$.subscribe(
      id => {
        // TODO: implement
      }
    )
  }

  onChatSwitch(): void {
    console.log("chat comp: onChatSwitch");
    if (this.chatData) {
      this.updateDraft(this.inputBoxEl.nativeElement.value);
      this.chatManager.setDraft(this.chatData.id, this.chatData.draft);
    }
    if (this.chatManager.activeChatId) {
      this.loadChat();
    }
  }

  onUserSwitch(): void {
    console.log("chat comp: onUserSwitch");
    this.chatData = undefined;
  }

  getMyUserId(): string {
    return this.userManager.getActiveUserId();
  }

  loadChat(): void {
    this.chatData = this.chatManager.getChat(this.chatManager.activeChatId);
    if (this.inputBoxEl && this.chatData) {
      this.inputBoxEl.nativeElement.value = this.chatData.draft;
    }
    this.focusOnInputBox();
  }

  loadFullChat(): void {
    this.chatData = this.chatManager.getFullChat(this.chatManager.activeChatId);
  }

  updateDraft(str: string): void {
    this.chatData.draft = str;
    console.log("updated msg draft: " + this.chatData.draft);
  }

  // TODO: implement
  sendMessage(): void {
    this.updateDraft(this.inputBoxEl.nativeElement.value);
    let messageText: string = this.chatData.draft;
    console.log("sending message: " + messageText);
    this.inputBoxEl.nativeElement.value = "";

    // TODO: TEMP! just for testing
    let msg: ChatMsg = {
      id: this.getLastMessage().id + 1,
      type: "message",
      date: this.chatManager.genCurrentDateStr(),
      from: this.userManager.getUserName(),
      from_id: this.userManager.getActiveUserId(),
      status: MsgStatus.Pending,
      text: messageText
    }
    this.chatManager.addMessageToChat(this.chatManager.activeChatId, msg);

    console.warn("sendMessage has a mock impl.");
  }

  getLastMessage(): ChatMsg {
    return this.chatData.messages.slice(-1)[0];
  }

  getTime(date: string): string {
    return this.chatManager.getTimeFromDateStr(date);
  }

  scrollToBottom(): void {
    try {
        this.chatDiv.nativeElement.scrollTop = this.chatDiv.nativeElement.scrollHeight;
    } catch(err) { }
  }

  focusOnInputBox(): void {
    if (this.inputBoxEl) {
      this.inputBoxEl.nativeElement.focus();
    }
  }

  msgStatusToCssClassName(status: MsgStatus): string {
    if (status == undefined) {
      return "";
    }
    switch(status) {
      case MsgStatus.Pending:
        return "status-icon-pending";
      case MsgStatus.Sent:
        return "status-icon-sent";
      case MsgStatus.Received:
        return "status-icon-received";
    }
  }

}
