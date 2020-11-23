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

  chatData: ChatData;

  inputBoxMessage: string;
  static numMessagesToLoad: number = 100;

  constructor(private userManager: UserManagerService, private chatManager: ChatManagerService) {
    // load current chat when the currentChatId changes
    chatManager.currentChatId$.subscribe(
      id => {
        this.loadChat(id);
      }
    );
    // clear chat when switching users
    userManager.activeUserId$.subscribe(
      id => {
        this.chatData = undefined;
      }
    );
  }

  ngOnInit(): void {
    this.scrollToBottom();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  getMyUserId(): string {
    return this.userManager.getUserId();
  }

  loadChat(id: number): void {
    this.chatData = this.chatManager.getChatPartial(id, ChatComponent.numMessagesToLoad);
  }

  loadFullChat(): void {
    this.chatData = this.chatManager.getChat(this.chatData.id);
  }

  updateInputBoxMessage(event: any): void {
    this.inputBoxMessage = event.target.value;
    console.log("input msg: " + this.inputBoxMessage);
  }

  sendMessage(): void {
    console.log("sendMessage: " + this.inputBoxMessage);
  }

  scrollToBottom(): void {
    try {
        this.chatDiv.nativeElement.scrollTop = this.chatDiv.nativeElement.scrollHeight;
    } catch(err) { }
  }

}
