import { Logger } from './utils/logger'
import { ChannelInfo } from './channelinfo'
import { Dispatcher } from './dispatcher'
import { ChannelHandler } from './channelhandler'
import { PostBody } from './postbody'
import { hiveService as VaultService } from "./hiveService"
import { Profile } from './profile'
import { RuntimeContext } from './runtimecontext'
import { ScriptingNames as scripts } from './vault/constants'
import { CommentInfo } from './commentInfo'
import { Likeinfo } from './Likeinfo'

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
        logger.debug("query channel information params: ", params)
        return this.vault.callScript(scripts.SCRIPT_QUERY_CHANNEL_INFO, params,
            this.getChannelInfo().getOwnerDid(), this.context.getAppDid())
            .then(result => {
                logger.debug("query channel information success: ", result)
                return ChannelInfo.parse(this.getChannelInfo().getOwnerDid(), result.find_message.items[0])
        }).catch(error => {
            logger.error('Query channel information error: ', error)
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
        logger.debug("query posts params: ", params)
        return this.vault.callScript(scripts.SCRIPT_CHANNEL_POST_BY_END_TIME_AND_LIMIT, params,
            this.getChannelInfo().getOwnerDid(), this.context.getAppDid())
            .then((result: any) => {
                logger.debug("query posts success: ", result)
            let targetDid = this.getChannelInfo().getOwnerDid()
            let posts = []
                result.find_message.items.forEach(item => {
                const post = PostBody.parse(targetDid, item)
                posts.push(post)
            })
                logger.debug("query posts 'postBodys': ", posts)
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
        logger.debug("query posts by range of time params: ", params)

        return this.vault.callScript(scripts.QUERY_PUBLIC_SOMETIME_POST, params,
                this.channelInfo.getOwnerDid(), this.context.getAppDid())
            .then((result: any) => {
                logger.debug("query posts by range of time success: ", result)
            const targetDid = this.channelInfo.getOwnerDid()
            let posts = []
                result.find_message.items.forEach(item => {
                    const post = PostBody.parse(targetDid, item)
                posts.push(post)
            })
                logger.debug("query posts by range of time 'postBodys': ", posts)

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
        logger.debug("query post params: ", params)
        return this.vault.callScript(scripts.QUERY_PUBLIC_SPECIFIED_POST, params,
            this.channelInfo.getOwnerDid(), this.context.getAppDid()).then(result => {
                return result.find_message.items
            }).then((result) => {
                logger.debug("query post success: ", result)
            let posts = []
                for (let index = 0; index < result.length; index++) {
                    const item = result[index]
                    const post = PostBody.parse(this.getChannelInfo().getOwnerDid(), item)
                    posts.push(post)
                }
                logger.debug("query post 'postBody': ", posts)
            return posts[0]
        }).catch (error => {
            logger.error("Query post error:", error)
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
        logger.debug("query subscriber count params: ", params)
        return this.vault.callScript(scripts.SCRIPT_QUERY_SUBSCRIPTION_BY_CHANNELID, params,
            this.channelInfo.getOwnerDid(), this.context.getAppDid()).then(result => {
                logger.debug("query subscriber count success: ", result)
                return result.find_message.items.length
            }).catch(error => {
                logger.error("Query subscriber count: ", error)
                throw new Error(error)
            })
    }
    
    /**
     * Query the list of subscribers to this channel.
     *
     * @param earilerThan The timestamp
     * @param upperlimit The maximum number of subscribers for this query.
     */
    // 新增：需讨论1
    public querySubscribers(earilerThan: number, upperLimit: number): Promise<Profile[]> {
        const params = {
            "channel_id": this.getChannelInfo().getChannelId(),
            "limit": upperLimit,
            "end": earilerThan,
        }
        logger.debug("query subscriber count params: ", params)

        return this.vault.callScript(scripts.SCRIPT_CHANNEL_SUBSCRIBERS, params,
            this.channelInfo.getOwnerDid(), this.context.getAppDid()).then(result => {
                logger.debug("query subscriber count success: ", result)
                return result.find_message.items
            }).then((result) => {
                let profiles = []
                for (let index = 0; index < result.length; index++) {
                    const item = result[index]
                    const profile = Profile.parse(this.context, this.getChannelInfo().getOwnerDid(), item)
                    profiles.push(profile)
                }
                logger.debug("query subscriber count 'profiles': ", profiles)
                return profiles
            })
            .catch(error => {
                logger.error("Query ubscribers error : ", error)
                throw new Error(error)
            })
    }

    /**
     *
     * @param until
     * @param upperLimit
     * @param dispatcher
     */
    public queryAndDispatchSubscribers(earilerThan: number, upperLimit: number,
        dispatcher: Dispatcher<Profile>): Promise<void> {
        return this.querySubscribers(earilerThan, upperLimit).then(profiles => {
            profiles.forEach(item => {
                dispatcher.dispatch(item)
            })
        }).catch(error => {
            logger.error("Query and dispatch subscribers error :", error)
            throw new Error(error)
        })
    }

    //需订阅才能调用 同步feeds api 
    public queryPostByChannelId(): Promise<PostBody[]> {
        const params = {
            "channel_id": this.getChannelInfo().getChannelId(),
        }
        logger.debug("query post by channel id params: ", params)
        return this.vault.callScript(scripts.SCRIPT_QUERY_POST_BY_CHANNEL, params,
            this.getChannelInfo().getOwnerDid(), this.context.getAppDid()).then(result => {
                logger.debug("query post by channel id success: ", result)
                return result.find_message.items
            })
            .then(result => {
                let posts = []
                result.forEach(item => {
                    const post = PostBody.parse(this.getChannelInfo().getOwnerDid(), item)
                    posts.push(post)
                })
                logger.debug("query post by channel id 'postBodys': ", posts)

                return posts
            })
            .catch(error => {
                logger.error('Query post by channelId error:', error)
                throw new Error(error)
            })
    }

    //需订阅才能调用 同步feeds api // targetDid: 订阅者的did
    public queryCommentByChannel(): Promise<CommentInfo[]> {
        const params = {
            "channel_id": this.getChannelInfo().getChannelId(),
        }
        logger.debug("query comment by channel params: ", params)
        return this.vault.callScript(scripts.SCRIPT_QUERY_COMMENT_BY_CHANNELID, params,
            this.getChannelInfo().getOwnerDid(), this.context.getAppDid()).then(result => {
                logger.debug("query comment by channel success: ", result)
                return result.find_message.items
            })
            .then(result => {
                let comments = []
                result.forEach(item => {
                    const comment = CommentInfo.parse(this.getChannelInfo().getOwnerDid(), item)
                    comments.push(comment)
                })
                logger.debug("query comment by channel 'commentInfo': ", comments)
                return comments
            })
            .catch(error => {
                logger.error('query comment by channel error:', error)
                throw new Error(error);
            })
    }

    // 需订阅才能调用 同步feeds api //
    public queryLikeByChannel(targetDid: string): Promise<Likeinfo[]> {
        const params = {
            "channel_id": this.getChannelInfo().getChannelId(),
            "status": 0 // available
        }
        return this.vault.callScript(scripts.SCRIPT_QUERY_LIKE_BY_CHANNEL, params, targetDid, this.context.getAppDid()).then(result => {
            logger.debug("query like by channel  success: ", result)
            return result.find_message.items
        }).then(result => {
            let likes = []
            result.forEach(item => {
                const like = Likeinfo.parse(targetDid, item)
                likes.push(like)
            })
            return likes
        })
            .catch(error => {
                logger.error('Query like by channel error:', error)
                throw new Error(error)
            })
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
