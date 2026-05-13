import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';

@Injectable()
export class NotificationsService {
  constructor(private config: ConfigService) {
    const pubKey = config.get<string>('vapid.publicKey');
    const privKey = config.get<string>('vapid.privateKey');
    const email = config.get<string>('vapid.email');
    if (pubKey && privKey) {
      webpush.setVapidDetails(email, pubKey, privKey);
    }
  }

  async sendNotification(subscription: any, payload: object) {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
    } catch (e) {
      // subscription may be expired
    }
  }

  getVapidPublicKey() {
    return this.config.get<string>('vapid.publicKey');
  }
}
