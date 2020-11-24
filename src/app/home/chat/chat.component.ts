import { Component, OnInit } from '@angular/core';
import { UserManagerService } from 'app/user-manager.service';
import { ChatManagerService, ChatData } from 'app/chat-manager.service';
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
        this.onChatSwitch();
        this.chatData = undefined;
      }
    );
  }

  onChatSwitch(): void {
    if (this.chatData) {
      this.updateDraft(this.inputBoxEl.nativeElement.value);
      this.chatManager.setDraft(this.chatData.id, this.chatData.draft);
    }
    if (this.chatManager.activeChatId) {
      this.loadChat();
    }
  }

  getMyUserId(): string {
    return this.userManager.getUserId();
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
    console.log("sending message: " + this.chatData.draft);
    this.inputBoxEl.nativeElement.value = "";

    console.warn("sendMessage not implemented");
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

}
