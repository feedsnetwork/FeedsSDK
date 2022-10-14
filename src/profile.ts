import { RuntimeContext } from "./runtimecontext";
import { Channel } from "./channel";
import { ChannelInfo } from "./channelinfo";
import { Dispatcher } from "./dispatcher";
import { ProfileHandler } from "./profilehandler";
import { hiveService as VaultService } from "./hiveService"
import { CollectionNames as collections, ScriptingNames as scripts } from "./vault/constants"
import { Logger } from './utils/logger'

const logger = new Logger("Profile")

export class Profile implements ProfileHandler {
    private context: RuntimeContext;
    private readonly targetDid: string;
    private readonly userDid: string;
    private readonly displayName: string
    private vault: VaultService

    public constructor(context: RuntimeContext, userDid: string, targetDid: string, displayName: string) {
        this.context = context;
        this.userDid = userDid;
        this.targetDid = targetDid
        this.displayName = displayName
        this.vault = new VaultService()
    }

    public getUserDid(): string {
        return this.userDid
    }

    public getTargetDid(): string {
        return this.targetDid
    }

    public getDisplayName(): string {
        return this.displayName
    }

    // 新增 1 已讨论 // find_message.total
    public queryOwnedChannelCount(): Promise<number> {
        const filter = {}
        return this.vault.callScript(scripts.SCRIPT_PRIFILE_CHANNELS, filter, this.targetDid, this.context.getAppDid()).then(result => {
            logger.debug("query owned channel count success: ", result)
            return result.find_message.total
        }).catch(error => {
            logger.error('query owned channels count error: ', error)
            throw new Error(error)
        })
    }

    // 新增 已讨论 // 1
    public queryOwnedChannels(): Promise<ChannelInfo[]> {
        const filter = {}
        return this.vault.callScript(scripts.SCRIPT_PRIFILE_CHANNELS, filter, this.targetDid, this.context.getAppDid()).then(result => {
            logger.debug("query owned channels success: ", result)
            return result.find_message.items
        }).then(result => {
            let channelInfos = []
            result.forEach(item => {
                const channelInfo = ChannelInfo.parse(this.targetDid, item)
                channelInfos.push(channelInfo)
            })
            logger.debug("query owned channels 'ChannelInfo': ", channelInfos)
            return channelInfos
        }).catch(error => {
            logger.error('query owned channels error: ', error)
            throw new Error(error)
        })
    }

    public queryAndDispatchOwnedChannels(dispatcher: Dispatcher<ChannelInfo>) {
        return this.queryOwnedChannels().then (channels => {
            channels.forEach(item => {
                dispatcher.dispatch(item)
            })
        }).catch (error => {
            logger.error("query and dispatch owned channels error: ", error)
            throw new Error(error)
        })
    }

    public queryOwnedChannnelById(channelId: string): Promise<ChannelInfo> {
        const filter = {
            "channel_id": channelId,
        }
        logger.debug("query owned channel by id params: ", filter)
        return this.vault.callScript(scripts.SCRIPT_QUERY_CHANNEL_INFO, filter, this.targetDid, this.context.getAppDid())
            .then(result => {
                logger.debug("query owned channel by id success: ", result)
                return result.find_message.items
            })
            .then(result => {
                const channelInfo = ChannelInfo.parse(this.targetDid, result[0])
                logger.debug("query owned channel by id 'ChannelInfo': ", channelInfo)
                return channelInfo
            }).catch(error => {
                logger.error("query owned channel by id error: ", error)
                throw new Error(error)
            })

    }

    public queryAndDispatchOwnedChannelById(channelId: string, dispatcher: Dispatcher<ChannelInfo>) {
        return this.queryOwnedChannnelById(channelId).then (channel => {
            dispatcher.dispatch(channel)
        }).catch (error => {
            throw new Error(error)
        })
    }

    //新增
    // 查询自己订阅了哪些频道  //先过了，暂时不管
    public querySubscriptionCount(): Promise<number> {
        const filter = {}
        return this.vault.callScript(scripts.SCRIPT_PRIFILE_SUBSCRIPTIONS, filter, this.targetDid, this.context.getAppDid()).then(result => {
            logger.debug("query subscription Count success: ", result)
            return result.find_message.items.length
        }).catch(error => {
            logger.error("query subscription Count error: ", error)
            throw new Error(error)
        })
    }

    // 新增
    // 订阅的channels // 同上
    public querySubscriptions(): Promise<ChannelInfo[]> {
        const filter = {
        }
        return this.vault.callScript(scripts.SCRIPT_PRIFILE_SUBSCRIPTIONS, filter, this.targetDid, this.context.getAppDid()).then(result => {
            logger.debug("query subscriptions success: ", result)
            return result.find_message.items
        }).then(async result => {
            let results = []
            for (let index = 0; index < result.length; index++) {
                const item = result[index]
                const channel_id = item.channel_id
                const target_did = item.target_did.toString()
                const params = {
                    "channel_id": channel_id,
                }
                const callScriptResult = await this.vault.callScript(scripts.SCRIPT_QUERY_CHANNEL_INFO, params, target_did, this.context.getAppDid())
                const channelInfo = ChannelInfo.parse(target_did, callScriptResult.find_message.items[0])
                results.push(channelInfo)
            }
            logger.debug("query subscriptions 'ChannelInfo': ", results)

            return results
        }).catch(error => {
            logger.error('query subscription channels error: ', error)
            throw new Error(error)
        })
    }

    public queryAndDispatchSubscriptions(dispatcher: Dispatcher<ChannelInfo>) {

        return this.querySubscriptions().then(channels => {
            channels.forEach(item => {
                dispatcher.dispatch(item)
            })
        }).catch (error => {
            throw new Error(error)
        })
    }

    public static parse(context: RuntimeContext, userDid: string, result: any): Profile {
        const targetDid = result.user_did
        const displayName = result.display_name
        const profile = new Profile(context, userDid, targetDid, displayName)

        return profile
    }
}
