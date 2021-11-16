import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SubspaceComService {

  sessions: { [id: number]: SubspaceSession };

  constructor() {
    this.sessions = {};
  }

  // Observable incoming message
  private newIncomingMessageSubject = new Subject<{ sessionId: number, msgPacked: string }>();
  incomingMessageObservable = this.newIncomingMessageSubject.asObservable();
  notifyIncomingMessageToSubscribers(sessionId: number, msgPacked: string) {
    this.newIncomingMessageSubject.next({ sessionId: sessionId, msgPacked: msgPacked });
  }

  connectionIsOpen(sessionId: number): boolean {
    const session = this.getSession(sessionId);
    if (!session) {
      return false;
    }
    return session.peerConnection.connectionState == "connected";
  }

  closeSession(sessionId: number): void {
    const session = this.getSession(sessionId);
    if (!session) {
      return;
    }
    console.log("closing connection and channel for session #" + sessionId);
    if (session.messagingChannel) {
      session.messagingChannel.close();
    }
    if (session.peerConnection) {
      session.peerConnection.close();
    }
    console.log("deleting session #" + sessionId);
    delete this.sessions[sessionId];
  }

  getSession(sessionId: number): SubspaceSession {
    if (this.sessionExists(sessionId) == false) {
      console.error("session with id: " + sessionId + " doesn't exist!");
      return undefined;
    }
    return this.sessions[sessionId];
  }

  sendMessage(sessionId: number, msgPacked: string): boolean {
    const session = this.getSession(sessionId);
    if (!session) {
      return false;
    }
    const channel = session.messagingChannel;
    if (!channel) {
      console.error("can't send message, messaging channel is not defined!");
      return false;
    }
    if (channel.readyState != "open") {
      console.error("can't send message, channel is not open");
      return false;
    }
    console.log("sending packed msg: ", msgPacked)
    channel.send(msgPacked);
    return true;
  }

  sendData(targetId: number, data: any): void {
    console.warn("unimplemented");
  }

  // used by createOffer and acceptRemoteOfferAndCreateAnswer
  // can be awaited to get offer/answer with ice candidates included
  promiseLocalDescriptionWithIceCandidates = (connection: RTCPeerConnection) =>
    new Promise<string>(resolve =>
      connection.onicecandidate = event => {
        if (!event.candidate) {
          resolve(JSON.stringify(connection.localDescription));
        }
      }
    )

  async createOffer(sessionId: number): Promise<string> {
    const session = this.getSession(sessionId);
    if (!session) {
      return;
    }
    const connection = session.peerConnection;
    const channel = connection.createDataChannel('messaging-channel');
    console.log("created messsaging channel for session #" + sessionId);
    this.setMessagingChannel(sessionId, channel);
    const localOffer = await connection.createOffer();
    await connection.setLocalDescription(localOffer); // TODO: handle errors

    const offerInJson: string = await this.promiseLocalDescriptionWithIceCandidates(connection);
    console.log("created local offer (with ice candidates) for session #" + sessionId);
    return offerInJson;
  }

  async acceptRemoteOfferAndCreateAnswer(remoteOfferStr: string, sessionId: number): Promise<string> {
    const session = this.getSession(sessionId);
    if (!session) {
      return;
    }
    const connection = session.peerConnection;
    let remoteOffer: RTCSessionDescriptionInit;
    try {
      remoteOffer = JSON.parse(remoteOfferStr);
    } catch (e) {
      console.error("parsing offer json failed: ", e);
      return undefined;
    }
    // accept remote offer
    await connection.setRemoteDescription(remoteOffer);
    // create an answer
    const localAnswer = await connection.createAnswer();
    await connection.setLocalDescription(localAnswer); // TODO: handle errors

    const answerInJson: string = await this.promiseLocalDescriptionWithIceCandidates(connection);
    console.log("accepted remote offer and created local answer (with ice candidates) for session #" + sessionId);
    return answerInJson;
  }

  async acceptAnswer(remoteAnswerStr: string, sessionId: number) {
    const session = this.getSession(sessionId);
    if (!session) {
      return;
    }
    const connection = session.peerConnection;
    if (connection.signalingState == "stable") {
      console.log("no need to accept remote answer, state is already 'stable'");
      return;
    }
    let remoteAnswer: RTCSessionDescriptionInit;
    try {
      remoteAnswer = JSON.parse(remoteAnswerStr);
    } catch (e) {
      console.error("parsing answer json failed: ", e);
      return;
    }
    await connection.setRemoteDescription(remoteAnswer);
    console.log("accepted remote answer for session #" + sessionId);
  }

  createNewSession(): number {
    let sessionId = this.genSessionId();
    const connection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    this.sessions[sessionId] = { peerConnection: undefined, messagingChannel: undefined };
    this.setPeerConnection(sessionId, connection);
    console.log("created session #" + sessionId);
    return sessionId;
  }

  private setPeerConnection(sessionId: number, connection: RTCPeerConnection): void {
    const session = this.getSession(sessionId);
    if (!session) {
      return;
    }
    if (session.peerConnection) {
      console.warn("peer connection already exists for session #" + sessionId + ", overriding...");
    }
    session.peerConnection = connection;
    console.log("set a peer connection for session #" + sessionId);

    // peer connection event handlers
    connection.onconnectionstatechange = event => console.log("Session #" + sessionId + " State:", connection.connectionState);
    connection.oniceconnectionstatechange = event => console.log("Session #" + sessionId + " Ice Connection State: ", connection.iceConnectionState);
    connection.ondatachannel = event => {
      const channel = event.channel;
      console.log("received a messsaging channel for session #" + sessionId);
      this.setMessagingChannel(sessionId, channel);
    };
  }

  private setMessagingChannel(sessionId: number, channel: RTCDataChannel): void {
    const session = this.getSession(sessionId);
    if (!session) {
      return;
    }
    if (session.messagingChannel) {
      console.warn("messaging channel already exists for session #" + sessionId + ", overriding...");
    }
    session.messagingChannel = channel;
    console.log("set a messsaging channel for session #" + sessionId);

    // channel event handlers
    channel.onopen = event => {
      console.log("Session #" + sessionId + " channel onpen event - ready state is now: " + channel.readyState);
    };
    channel.onclose = event => {
      console.log("Session #" + sessionId + " channel.onclose event:", event);
    };
    channel.onerror = event => {
      console.log("Session #" + sessionId + " channel.onerror event:", event);
    }
    channel.onmessage = event => {
      const msgPacked: string = event.data; // TODO: change to payload and extract msgType and msgPacked from it if msgType is chat msg
      console.log("Session #" + sessionId + " received new msg:", msgPacked + ". dispatching event...");
      this.notifyIncomingMessageToSubscribers(sessionId, msgPacked);
      // TODO: send receive confirmation to sender
    };
  }

  private genSessionId(): number {
    let id = this.genRandomId();
    while (this.sessionExists(id)) {
      id = this.genRandomId();
    }
    return id;
  }

  private genRandomId(): number {
    // TODO: improve
    return Math.floor(Math.random() * 1000000000);
  }

  private sessionExists(sessionId: number): boolean {
    return sessionId in this.sessions;
  }

}

interface SubspaceSession {
  peerConnection: RTCPeerConnection;
  messagingChannel: RTCDataChannel;
}
