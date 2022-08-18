import { Logger } from './utils/logger'
import { Channel } from './Channel'
import { HiveData } from './HiveData'
import { HiveHelper } from './HiveHelper'
import { AppContext } from './AppContext'

const logger = new Logger("MyChannel")
export class MyChannel extends Channel {
    private hiveHelper: HiveHelper

    constructor(myChnnelInfo: HiveData.ChannelInfo) {
        super(myChnnelInfo, null)
        // TODO: AppContext.isInitialized()
        this.hiveHelper = new HiveHelper(AppContext.getInstance())
    }

    public getMyChannelInfo(): HiveData.ChannelInfo {
        return this.myChannelInfo
    }

    updateInfo() {

    }

    post() {

    }

    updatePost() {

    }

    deletePost() {

    }
}

