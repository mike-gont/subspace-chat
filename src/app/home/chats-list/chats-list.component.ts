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
    // subscribe to the active user id and do stuff when it changes
    userManager.activeUserId$.subscribe(
      activeUserId => {
        this.refresh();
      });
  }

  ngOnInit(): void {
    this.loadChatsList();
  }

  refresh(): void {
    console.log("refresh");
    this.loadChatsList();
  }

  loadChatsList(): void {
    this.chatsList = this.chatManager.getChatsList();
    console.log("loaded chats list: ", this.chatsList);
  }

  onChatSelect(chatId : number): void {
    console.log("selected chat: " + chatId);
    this.chatManager.setCurrentChatId(chatId);
  }
    
}
