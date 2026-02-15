import { Credential } from './credential';
import { BilibiliRequestClient } from './request-client';
import { VideoAPI } from './video-api';
import { UserAPI } from './user-api';
import { RequestConfig } from './types';

export class BilibiliAPI {
  private client: BilibiliRequestClient;
  public video: VideoAPI;
  public user: UserAPI;

  constructor(credential?: Credential, config?: RequestConfig) {
    this.client = new BilibiliRequestClient(credential, config);
    this.video = new VideoAPI(this.client);
    this.user = new UserAPI(this.client);
  }

  setCredential(credential: Credential): void {
    this.client.setCredential(credential);
  }

  getCredential(): Credential {
    return this.client.getCredential();
  }

  static create(credential?: Credential, config?: RequestConfig): BilibiliAPI {
    return new BilibiliAPI(credential, config);
  }

  static fromEnv(config?: RequestConfig): BilibiliAPI {
    const credential = Credential.fromEnv();
    return new BilibiliAPI(credential, config);
  }
}

export { Credential } from './credential';
export { BilibiliRequestClient } from './request-client';
export * from './types';
