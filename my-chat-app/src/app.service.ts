// 役割: 実際のビジネスロジック（計算や処理）。
// Laravelなら: Serviceクラス。コントローラーを太らせないために処理を分ける場所

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
