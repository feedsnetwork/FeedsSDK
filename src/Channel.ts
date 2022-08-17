import { Hive } from '@elastosfoundation/elastos-connectivity-sdk-js';
import { HiveData } from './HiveData';
import { Logger } from './utils/logger'

const logger = new Logger("Channel")

export class Channel {
    private channelInfo: HiveData.ChannelInfo

    constructor(channelInfo: HiveData.ChannelInfo) {
        this.channelInfo = channelInfo
    }

    public getChannelInfo(): HiveData.ChannelInfo {
        return this.channelInfo
    }

}

