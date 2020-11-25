import { Component, OnInit } from '@angular/core';
import { UserManagerService } from 'app/user-manager.service';
import { ChatManagerService, ChatsListItem } from 'app/chat-manager.service';

@Component({
  selector: 'app-chats-list',
  templateUrl: './chats-list.component.html',
  styleUrls: ['./chats-list.component.scss']
})
export class ChatsListComponent implements OnInit {

  chatsList: ChatsListItem[];

  constructor(private chatManager: ChatManagerService, private userManager: UserManagerService) {
    this.observeActiveUserId();
  }

  ngOnInit(): void {
    this.loadChatsList();
  }

  observeActiveUserId(): void {
    // refresh chats list when switching users
    this.userManager.activeUserId$.subscribe(
      id => {
        this.onUserSwitch();
      }
    );
  }

  onUserSwitch(): void {
    console.log("chats list comp: onUserSwitch");
    this.loadChatsList();
  }

  loadChatsList(): void {
    this.chatsList = this.chatManager.getChatsList();
    console.log("loaded chats list: ", this.chatsList);
  }

  onChatSelect(chatId : number): void {
    if (chatId != this.chatManager.activeChatId) {
      console.log("selected chat: " + chatId);
      this.chatManager.setActiveChatId(chatId);
    }
  }
    
}
