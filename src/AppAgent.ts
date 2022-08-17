import { Logger } from './utils/logger'
import { HiveHelper } from './HiveHelper'
import { AppContext } from './AppContext'
import { Channel } from './Channel'
import { InsertResult } from './InsertResult'
import { DeleteResult } from './DeleteResult'

const logger = new Logger("AppAgent")
export class AppAgent {
  private hiveHelper: HiveHelper

  setup(appContext: AppContext) {
    this.hiveHelper = new HiveHelper(appContext)
    // TODO: register/create/feedsInfo
  }

  getMyChannels(): Promise<Array<Channel>> {
    return this.hiveHelper.queryMyChannels()
  }

  getMyChannelById(channelId: string): Promise<Channel> {
    return this.hiveHelper.queryMyChannelById(channelId)
  }

  createChannel(
    channelName: string,
    intro: string,
    avatar: string,
    paymentAddress: string = '',
    type: string = 'public',
    nft: string = '',
    memo: string,
    category: string = '',
    proof: string = ''
  ): Promise<InsertResult> {
    return this.hiveHelper.createChannel(channelName, intro, avatar, paymentAddress, type, nft, memo, category, proof)
  }

  /**  Channel
   * Delete channel
   *
   * @param channelId: channel identifier
   * @return success or failure
   * @throws HiveError
   */
  deleteChannel(channelId: string): Promise<DeleteResult> {
    return this.hiveHelper.deleteChannel(channelId)
  }

}
