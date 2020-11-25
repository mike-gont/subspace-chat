import { Component } from '@angular/core';
import { ElectronService } from './core/services';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from '../environments/environment';
import { ChatManagerService } from 'app/chat-manager.service';

const { ipcRenderer } = require('electron');

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(
    private electronService: ElectronService,
    private translate: TranslateService,
    private chatManager: ChatManagerService
  ) {
    this.translate.setDefaultLang('en');
    console.log('AppConfig', AppConfig);

    if (electronService.isElectron) {
      console.log(process.env);
      console.log('Run in electron');
      console.log('Electron ipcRenderer', this.electronService.ipcRenderer);
      console.log('NodeJS childProcess', this.electronService.childProcess);

      // on receiving a message from the main process to close the app
      ipcRenderer.on('app-close', _ => {
        this.beforeAppClose();
        ipcRenderer.send('app-close-done');
      });

    } else {
      console.log('Run in browser');
    }
  }

  beforeAppClose(): void {
    this.chatManager.beforeAppClose();
  }

}
