import { Hive } from '@elastosfoundation/elastos-connectivity-sdk-js'
import { Logger } from './utils/logger'
import { HiveHelper } from './HiveHelper'
import { AppContext } from './AppContext'
import { Channel } from './Channel'
import { HiveData } from './HiveData'

const logger = new Logger("AppAgent")
export class AppAgent {
  private hiveHelper: HiveHelper

  setup(appContext: AppContext) {
    this.hiveHelper = new HiveHelper(appContext)
    // TODO: register/create/feedsInfo
  }

  getMyChannels(): Promise<Channel[]> {
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
  ): Promise<HiveData.InsertResult> {
    return this.hiveHelper.createChannel(channelName, intro, avatar, paymentAddress, type, nft, memo, category, proof)
  }

  /**  Channel
   * Delete channel
   *
   * @param channelId: channel identifier
   * @return success or failure
   * @throws HiveError
   */
  deleteChannel(channelId: string): Promise<HiveData.DeleteResult> {
    return this.hiveHelper.deleteChannel(channelId)
  }

  mintChannel() {
    //TODO: future
  }

  burnChannel() {
    //TODO: future
  }

  subscribeChannel(targetDid: string, channelId: string, displayName: string, updatedAt: number, status: number = HiveData.CommonStatus.available): Promise<boolean> {
    return this.hiveHelper.subscribeChannel(targetDid, channelId, displayName, updatedAt, status)
  }

  unSubscribeChannel(targetDid: string, channelId: string): Promise<boolean> {
    return this.hiveHelper.unsubscribeChannel(targetDid, channelId)
  }

  getSubscribedChannels(targetDid: string, userDid: string): Promise<HiveData.SubscriptionInfo[]> {
    return this.hiveHelper.querySubscriptionByUserDID(targetDid, userDid)
  }

  getSubscribedChannelById(targetDid: string, channelId: string): Promise<HiveData.SubscriptionInfo[]> {
    return this.hiveHelper.querySubscriptionInfoByChannelId(targetDid, channelId)
  }

}
