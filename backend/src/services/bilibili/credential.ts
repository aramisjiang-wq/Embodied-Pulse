import { BilibiliCredential } from './types';

export class Credential {
  private sessdata?: string;
  private biliJct?: string;
  private buvid3?: string;
  private dedeuserid?: string;
  public cookies?: string;

  constructor(credential?: BilibiliCredential) {
    if (credential) {
      this.sessdata = credential.sessdata;
      this.biliJct = credential.biliJct;
      this.buvid3 = credential.buvid3;
      this.dedeuserid = credential.dedeuserid;
    }
  }

  getSessdata(): string | undefined {
    return this.sessdata;
  }

  getBiliJct(): string | undefined {
    return this.biliJct;
  }

  getBuvid3(): string | undefined {
    return this.buvid3;
  }

  getDedeuserid(): string | undefined {
    return this.dedeuserid;
  }

  hasCredential(): boolean {
    return !!(this.sessdata && this.biliJct);
  }

  toCookie(): string {
    const cookies: string[] = [];
    if (this.sessdata) cookies.push(`SESSDATA=${this.sessdata}`);
    if (this.biliJct) cookies.push(`bili_jct=${this.biliJct}`);
    if (this.buvid3) cookies.push(`buvid3=${this.buvid3}`);
    if (this.dedeuserid) cookies.push(`DedeUserID=${this.dedeuserid}`);
    return cookies.join('; ');
  }

  static fromEnv(): Credential {
    const fullCookie = process.env.BILIBILI_COOKIE;
    
    if (fullCookie) {
      const sessdata = fullCookie.match(/SESSDATA=([^;]+)/)?.[1];
      const biliJct = fullCookie.match(/bili_jct=([^;]+)/)?.[1];
      const dedeuserid = fullCookie.match(/DedeUserID=([^;]+)/)?.[1];
      const buvid3 = fullCookie.match(/buvid3=([^;]+)/)?.[1];
      
      const credential = new Credential({
        sessdata,
        biliJct,
        buvid3,
        dedeuserid,
      });
      
      credential.cookies = fullCookie;
      
      return credential;
    }
    
    return new Credential({
      sessdata: process.env.BILIBILI_SESSDATA,
      biliJct: process.env.BILIBILI_BILI_JCT,
      buvid3: process.env.BILIBILI_BUVID3,
      dedeuserid: process.env.BILIBILI_DEDEUSERID,
    });
  }
}
