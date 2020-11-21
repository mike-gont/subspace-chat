import { Component, OnInit } from '@angular/core';
import { UserManagerService } from '../../user-manager.service';
import { ChatManagerService, ChatData } from '../../chat-manager.service';
import { ThrowStmt } from '@angular/compiler';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {

  chatData: ChatData;

  inputBoxMessage: string;
  static numMessagesToLoad: number = 100;

  constructor(private userManager: UserManagerService, private chatManager: ChatManagerService) {
    // loat current chat when the currentChatId changes
    chatManager.currentChatId$.subscribe(
      id => {
        this.loadChat(id);
      });
  }

  ngOnInit(): void {
  }

  getMyUserId(): number {
    return this.userManager.getUserId();
  }

  loadChat(id: number) {
    this.chatData = this.chatManager.getChatPartial(id, ChatComponent.numMessagesToLoad);
  }

  loadFullChat() {
    this.chatData = this.chatManager.getChat(this.chatData.id);
  }

  // TODO: get only last x messages and don't load the whole chat file
  updateChat() {
    this.chatData.messages = this.chatManager.getChat(this.chatData.id).messages;
  }

  updateInputBoxMessage(event: any) {
    this.inputBoxMessage = event.target.value;
    console.log("input msg: " + this.inputBoxMessage);
  }

  sendMessage() {
    console.log("sendMessage: " + this.inputBoxMessage);
  }



}
