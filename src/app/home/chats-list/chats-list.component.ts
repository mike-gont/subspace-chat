import { Component, OnInit } from '@angular/core';
import { ChatManagerService, ChatsList } from '../../chat-manager.service';

@Component({
  selector: 'app-chats-list',
  templateUrl: './chats-list.component.html',
  styleUrls: ['./chats-list.component.scss']
})
export class ChatsListComponent implements OnInit {

  chatsList: ChatsList;

  constructor(private chatManager: ChatManagerService) { }

  ngOnInit(): void {
    this.loadChatsList();
  }

  loadChatsList() {
    this.chatsList = this.chatManager.getChatsList();
  }

  onChatSelect(chatId : number) {
    console.log("selected chat: " + chatId);
    this.chatManager.setCurrentChatId(chatId);
  }
    
}
