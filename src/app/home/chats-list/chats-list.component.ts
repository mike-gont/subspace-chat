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
    this.observeNewMessageFlag();
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

  observeNewMessageFlag(): void {
    this.chatManager.newMessageFlag$.subscribe(
      id => {
        this.updateItem(id);
      }
    )
  }

  onUserSwitch(): void {
    console.log("chats list comp: onUserSwitch");
    this.loadChatsList();
  }

  loadChatsList(): void {
    this.chatsList = this.chatManager.getChatsList();
    console.log("loaded chats list: ", this.chatsList);
  }

  getLastMessageText(): string {
    return this.chatManager.getLastMessage(this.chatManager.activeChatId).text;
  }

  updateItem(id: number): void {
    console.log("chats list comp: updateItem");
    for (let item of this.chatsList) {
      if (item.id == id) {
        let msg = this.chatManager.getLastMessage(item.id);
        item.last_msg_from = msg.from;
        item.last_msg_date = this.chatManager.getDateFromDateStr(msg.date)
          + " " + this.chatManager.getTimeFromDateStr(msg.date);
        item.last_msg_text = msg.text;
        break;
      }
    }
  }

  refresh(): void {
    console.log("chats list comp: refresh");
    for (let item of this.chatsList) {
      let msg = this.chatManager.getLastMessage(item.id);
      item.last_msg_from = msg.from;
      item.last_msg_date = msg.date;
      item.last_msg_text = msg.text;
    }
  }

  onChatSelect(chatId : number): void {
    if (chatId != this.chatManager.activeChatId) {
      console.log("selected chat: " + chatId);
      this.chatManager.setActiveChatId(chatId);
    }
  }
    
}
