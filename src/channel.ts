import { Logger } from './utils/logger'
import { Post } from './post'
import { ChannelInfo } from './channelinfo'
import { Dispatcher } from './dispatcher'
import { ChannelHandler } from './channelhandler'
import { PostBody } from './postbody'
import { hiveService as VaultService } from "./hiveService"
import { Profile } from './profile'
import { RuntimeContext } from './runtimecontext'
import { ScriptingNames as scripts } from './vault/constants'

const logger = new Logger("Channel")
/**
 * This class represent the channel owned by others. Users can only read posts
 * from this channel.
 */
class Channel implements ChannelHandler {
    private context: RuntimeContext;
    private channelInfo: ChannelInfo;
    private vault: VaultService

    public constructor(channelInfo: ChannelInfo) {
        this.channelInfo = channelInfo;
        this.vault = new VaultService()
        this.context = RuntimeContext.getInstance()
    }

    /**
     * Get channel information from local storage.
     * @returns The channel information
     */
    public getChannelInfo(): ChannelInfo {
        return this.channelInfo;
    }

    /**
     * Query the channel infomation from remote channel on Vault.
     * @returns An promise object that contains channel information.
     */
    public queryChannelInfo(): Promise<ChannelInfo> {            
        const channelId = this.getChannelInfo().getChannelId()
        const params = {
            "channel_id": channelId
        }

        return this.vault.callScript(scripts.SCRIPT_QUERY_CHANNEL_INFO, params,
            this.getChannelInfo().getOwnerDid(), this.context.getAppDid())
            .then(result => {
                return ChannelInfo.parse(this.getChannelInfo().getOwnerDid(), result.find_message.items[0])
        }).catch(error => {
            logger.log('Query channel information error: ', error)
            throw new Error(error)
        })
    }

    /**
     * Query this channel information and dispatch it to a routine.
     *
     * @param dispatcher The dispatcher routine to deal with channel information
     */
    public queryAndDispatchChannelInfo(dispatcher: Dispatcher<ChannelInfo>) {
        return this.queryChannelInfo().then( channelInfo => {
            dispatcher.dispatch(channelInfo)
        }).catch(error => {
            logger.log('query and dispatch channel information error: ', error);
            throw new Error(error)
        })
    }

    /**
     * fetch a list of Posts with timestamps that are earlier than specific timestamp
     * and limited number of this list too.
     *
     * @param earilerThan The timestamp than which the posts to be fetched should be
     *                    earlier
     * @param upperLimit The max limit of the posts in this transaction.
     * @returns An promise object that contains a list of posts.
     */
    // 新增 // 已讨论 // 2
    public queryPosts(earilerThan: number, upperLimit: number): Promise<PostBody[]> {
            const params = {
                "channel_id": this.channelInfo.getChannelId(),
                "limit": upperLimit,
                "end": earilerThan, 
            }
        return this.vault.callScript(scripts.SCRIPT_CHANNEL_POST_BY_END_TIME_AND_LIMIT, params,
            this.getChannelInfo().getOwnerDid(), this.context.getAppDid())
            .then((result: any) => {
                console.log("callScript result ========= ")
            let targetDid = this.getChannelInfo().getOwnerDid()
            let posts = []
                result.find_message.items.forEach(item => {
                const post = PostBody.parse(targetDid, item)
                posts.push(post)
            })
            return posts
        }).catch(error => {
            logger.error('Query posts error:', error)
            throw new Error(error)
        })
    }

    /**
     * Query the list of posts from this channel and dispatch them one by one to
     * customized dispatcher routine.
     *
     * @param earlierThan The timestamp
     * @param upperLimit The maximum number of posts in this query request.
     * @param dispatcher The dispatcher routine to deal with a post.
     */
    public queryAndDispatchPosts(earlierThan: number, upperLimit: number,
        dispatcher: Dispatcher<PostBody>) {

        return this.queryPosts(earlierThan, upperLimit).then (posts => {
            posts.forEach(item => {
                dispatcher.dispatch(item)
            })
        }).catch(error => {
            logger.error("Query posts error")
            throw new Error(error)
        })
    }

    /**
     * Query the list of Posts from this channel by a speific range of time.
     *
     * @param start The beginning timestamp
     * @param end The end timestamp
     * @returns An promise object that contains a list of posts.
     */
    public queryPostsByRangeOfTime(start: number, end: number): Promise<PostBody[]> {
            const params = {
                "channel_id": this.channelInfo.getChannelId(),
                "start": start,
                "end": end
            }
        return this.vault.callScript(scripts.QUERY_PUBLIC_SOMETIME_POST, params,
                this.channelInfo.getOwnerDid(), this.context.getAppDid())
            .then((result: any) => {
            const targetDid = this.channelInfo.getOwnerDid()
            let posts = []
                result.find_message.items.forEach(item => {
                    const post = PostBody.parse(targetDid, item)
                posts.push(post)
            })
            return posts
        }).catch(error => {
            logger.error("Query posts error: ", error)
            throw new Error(error)
        })
    }

    /**
     * Query the list of posts from this channel and dispatch them one by one to
     * customized dispatcher routine.
     *
     * @param start The begining timestamp
     * @param end The end timestamp
     * @param upperLimit The maximum number of this query
     * @param dispatcher The dispatcher routine to deal with a post
     */
    public queryAndDispatchPostsByRangeOfTime(start: number, end: number, upperLimit: number,
        dispatcher: Dispatcher<PostBody>) {

        return this.queryPostsByRangeOfTime(start, end).then (posts => {
            posts.forEach(item => {
                dispatcher.dispatch(item)
            })
        }).catch (error => {
            logger.error("Query posts error")
            throw new Error(error)
        })
    }

    /**
     * Query a post by post identifier.
     *
     * @param postId The post id
     * @returns An promise object that contains the post.
     */
    public queryPost(postId: string): Promise<PostBody> {
            const params = {
                "channel_id": this.getChannelInfo().getChannelId(),
                "post_id": postId
            }
        return this.vault.callScript(scripts.QUERY_PUBLIC_SPECIFIED_POST, params,
            this.channelInfo.getOwnerDid(), this.context.getAppDid()).then(result => {
                return result.find_message.items
            }).then((result) => {
            let posts = []
                for (let index = 0; index < result.length; index++) {
                    const item = result[index]
                    const post = PostBody.parse(this.getChannelInfo().getOwnerDid(), item)
                    posts.push(post)
                }
            return posts[0]
        }).catch (error => {
            logger.error("Query post:", error)
            throw new Error(error)
        })
    }

    /**
     * Query a post and dispatch it to the routine.
     *
     * @param postId The post id
     * @param dispatcher The routine to deal with the queried post
     */
    public queryAndDispatchPost(postId: string, dispatcher: Dispatcher<PostBody>) {
        return this.queryPost(postId).then (post => {
            dispatcher.dispatch(post)
        }).catch (error => {
            logger.error("Query post:", error)
            throw new Error(error)
        })
    }

    /**
     * Query the subscriber count of this channel.
     * @returns An promise object that contains the number of subscribers to this channel.
     */
    public querySubscriberCount(): Promise<number> {
        const params = {
            "channel_id": this.getChannelInfo().getChannelId(),
            "status": 0
        }
        return this.vault.callScript(scripts.SCRIPT_QUERY_SUBSCRIPTION_BY_CHANNELID, params,
            this.channelInfo.getOwnerDid(), this.context.getAppDid()).then(result => {
                console.log("querySubscriberCount ====== ", result)
                return result.find_message.items.length
            }).catch(error => {
                logger.error("Query subscriber: ", error)
                throw new Error(error)
            })
    }
    
    /**
     * Query the list of subscribers to this channel.
     *
     * @param earilerThan The timestamp
     * @param upperlimit The maximum number of subscribers for this query.
     */
    public querySubscribers(earilerThan: number, upperlimit: number): Promise<Profile[]> {
        throw new Error("Method not implemented");
    }

    /**
     *
     * @param until
     * @param upperLimit
     * @param dispatcher
     */
    public queryAndDispatchSubscribers(earilerThan: number, upperLimit: number,
        dispatcher: Dispatcher<Profile>): Promise<void> {
        throw new Error('Method not implemented.')
    }

    static parse(targetDid: string, item: any): Channel {
        const channelInfo = ChannelInfo.parse(targetDid, item)
        const channel = new Channel(channelInfo)
        return channel
    }
}

export {
    Channel,
}
