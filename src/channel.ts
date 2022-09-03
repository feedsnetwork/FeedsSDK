import { Logger } from './utils/logger'
import { Post } from './Post'
import { ChannelInfo } from './ChannelInfo'
import { Dispatcher } from './Dispatcher'
import { ChannelHandler } from './ChannelHandler'
import { PostChunk } from './PostChunk'
import { config } from "./config"
import { hiveService as VaultService } from "./hiveService"
import { Profile } from './profile'
import { AppContext } from './appcontext'

const logger = new Logger("Channel")

export class Channel implements ChannelHandler {
    private appContext: AppContext;
    private channelInfo: ChannelInfo;
    private vault: VaultService

    protected constructor(channelInfo: ChannelInfo) {
        this.channelInfo = channelInfo;
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
    public async queryChannelInfo(): Promise<ChannelInfo> {
        return new Promise<any>( async() => {
            const params = {
                "channel_id": this.getChannelInfo().getChannelId()
            }
            const appId = config.ApplicationDID
            const ownerDid = this.getChannelInfo().getOwnerDid()
            await this.vault.callScript(config.SCRIPT_QUERY_CHANNEL_INFO, params,
                this.getChannelInfo().getOwnerDid(), config.ApplicationDID)
        }).then(result => {
            return ChannelInfo.parse(this.getChannelInfo().getOwnerDid(), result)
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
    public async queryAndDispatchChannelInfo(dispatcher: Dispatcher<ChannelInfo>) {
        return this.queryChannelInfo().then( channelInfo => {
            dispatcher.dispatch(channelInfo)
        }).catch(error => {
            logger.log('Query channel information error: ', error);
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
     public async queryPosts(earilerThan: number, upperLimit: number): Promise<PostChunk[]> {
        return new Promise( async() => {
            const params = {
                "channel_id": this.channelInfo.getChannelId(),
                "limit": { "$lt": upperLimit },
                "created": { "$gt": earilerThan }
            }
            let result = await this.vault.callScript(config.SCRIPT_QUERY_POST_BY_CHANNEL, params,
                this.getChannelInfo().getOwnerDid(), config.ApplicationDID)
        }).then((result: any) => {
            let targetDid = this.getChannelInfo().getOwnerDid()
            let posts = []
            result.find_message.items.array.forEach(item => {
                const post = PostChunk.parse(targetDid, item)
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
    public async queryAndDispatchPosts(earlierThan: number, upperLimit: number,
        dispatcher: Dispatcher<PostChunk>) {

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
    public async queryPostsByRangeOfTime(start: number, end: number): Promise<PostChunk[]> {
        return new Promise( async() => {
            const params = {
                "channel_id": this.channelInfo.getChannelId(),
                "start": start,
                "end": end
            }
            await this.vault.callScript(config.SCRIPT_QUERY_POST_BY_CHANNEL, params,
                this.channelInfo.getOwnerDid(), config.ApplicationDID)
        }).then((result: any)=> {
            const targetDid = this.channelInfo.getOwnerDid()
            let posts = []
            result.find_message.items.array.forEach(item => {
                const post = PostChunk.parse(targetDid, item)
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
    public async queryAndDispatchPostsByRangeOfTime(start: number, end: number, upperLimit: number,
        dispatcher: Dispatcher<PostChunk>) {

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
    public async queryPost(postId: string): Promise<PostChunk> {
        return new Promise<any>( async() => {
            const params = {
                "channel_id": this.getChannelInfo().getChannelId(),
                "post_id": postId
            }
            await await this.vault.callScript(config.SCRIPT_SPECIFIED_POST, params,
                this.channelInfo.getOwnerDid(), config.ApplicationDID)
        }).then ((data) => {
            let posts = []
            data.forEach(item => {
                posts.push(Post.parse(this.getChannelInfo().getOwnerDid(), item));
            })
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
    public async queryAndDispatchPost(postId: string, dispatcher: Dispatcher<PostChunk>) {
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
    public async querySubscriberCount(): Promise<number> {
        throw new Error('Method not implemented.')
    }

    /**
     * Query the list of subscribers to this channel.
     *
     * @param earilerThan The timestamp
     * @param upperlimit The maximum number of subscribers for this query.
     */
    public async querySubscribers(earilerThan: number, upperlimit: number): Promise<Profile[]> {
        throw new Error("Method not implemented");
    }

    /**
     *
     * @param until
     * @param upperLimit
     * @param dispatcher
     */
    public async queryAndDispatchSubscribers(earilerThan: number, upperLimit: number,
        dispatcher: Dispatcher<Profile>) {
        throw new Error('Method not implemented.')
    }

    static parse(targetDid: string, channels: Channel[]): Channel[] {
        let parseResult = []
        channels.forEach(item => {
            const channelInfo = ChannelInfo.parse(targetDid, item)
            const channel = new Channel(channelInfo)
            parseResult.push(channel)
        })

        return parseResult
    }

    static parseChannel(data: any) : Channel {
        return new Channel(data);
    }
}
