import { Logger } from './utils/logger'
import { Dispatcher } from './Dispatcher'
import { ChannelInfo } from './ChannelInfo'
import { Post } from './Post';
import { ChannelHandler } from './ChannelHandler';
import { config as feeds } from "./config"
import { hiveService as VaultService} from "./hiveService"
import { UpdateOptions } from "@elastosfoundation/hive-js-sdk"
import { PostBody } from './postbody';
import { Profile } from './profile';
import { AppContext } from './appcontext';

const logger = new Logger("MyChannel")

export class MyChannel implements ChannelHandler {
    private appContext: AppContext;
    private channelInfo: ChannelInfo;
    private published: boolean;
    private vault: VaultService

    public constructor(appContex: AppContext, channelInfo: ChannelInfo) {
        this.appContext = appContex
        this.channelInfo = channelInfo
    }

    /**
     * Check whether this channel is published on the registry contract or not.
     * @returns The boolean state of being published or not.
     */
    public isPublic(): boolean {
        return this.published;
    }

    /**
     * Fetch channel property information from remote chanenl.
     * @returns The promise object containing the channel information
     */
    public async queryChannelInfo(): Promise<ChannelInfo> {
        return new Promise<any>( async() => {
            const params = {
                "channel_id": this.channelInfo.getChannelId()
            }
            await this.vault.callScript(feeds.SCRIPT_QUERY_CHANNEL_INFO, params, this.channelInfo.getOwnerDid(),
                this.appContext.getAppDid())

        }).then (result => {
            return ChannelInfo.parse(this.channelInfo.getOwnerDid(), result)
        }).catch (error => {
            logger.log('Query channel information error: ', error)
            throw new Error(error)
        })
    }

    /**
     * Fetch channel property information and send it to dispatcher routine.
     *
     * @param dispatcher the dispatch routine to deal with channel infomration;
     */
    public async queryAndDispatchChannelInfo(dispatcher: Dispatcher<ChannelInfo>) {
        return this.queryChannelInfo().then (channelInfo => {
            dispatcher.dispatch(channelInfo)
        }).catch ( error => {
            logger.log('Query channel information error: ', error);
            throw new Error(error)
        })
    }

    /**
     *  Update channel property information on remote vault.
     * @param channelInfo new channel information to be updated.
     * @returns The promise of whether updated in success or failure
     */
    public async updateChannelInfo(channelInfo: ChannelInfo) {
        return new Promise<void>( async() => {
            let doc = {
                "name"  : channelInfo.getName(),
                "intro" : channelInfo.getDescription(),
                "avatar": channelInfo.getAvatar(),
                "updated_at": channelInfo.getUpdatedAt(),
                "type"  : channelInfo.getType(),
                "tipping_address": channelInfo.getReceivingAddress(),
                "nft"   : channelInfo.getNft(),
                "memo"  : channelInfo.getMmemo(),
            }
            let filter = { "channel_id": channelInfo.getChannelId() }
            let update = { "$set": doc }

            await this.vault.updateOneDBData(feeds.TABLE_CHANNELS, filter, update, new UpdateOptions(false, true))
        }).catch (error => {
            logger.error('update channel information error', error)
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
     * @returns
     */
    public async queryPosts(earilerThan: number, upperLimit: number): Promise<PostBody[]> {
        return new Promise( async() => {
            const filter = {
                "limit": { "$lt": upperLimit },
                "created": { "$gt": earilerThan }
            }
            await this.vault.queryDBData(feeds.SCRIPT_SOMETIME_POST, filter)
        }).then ((result: any) => {
            let userDid = this.channelInfo.getOwnerDid()
            let posts = []
            result.forEach(item => {
                posts.push(Post.parse(userDid, item))
            })
            return posts
        }).catch (error => {
            logger.error('Query posts error:', error)
            throw new Error(error)
        })
    }

    /**
     * Query the list of posts from this channel and dispatch them one by one to
     * customized dispatcher routine.
     *
     * @param earlierThan The timestamp
     * @param upperNumber The maximum number of posts in this query request.
     * @param dispatcher The dispatcher routine to deal with a post.
     */
    public async queryAndDispatchPosts(until: number, upperLimit: number, dispatcher: Dispatcher<PostBody>) {
        return this.queryPosts(until, upperLimit).then (posts => {
            posts.forEach(item => {
                dispatcher.dispatch(item)
            })
        }).catch (error => {
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
    public async queryPostsByRangeOfTime(start: number, end: number): Promise<PostBody[]> {
        return new Promise( async() => {
            const channelId = this.channelInfo.getChannelId()
            const filter = {
                "channel_id": channelId,
                "created": { $gt: start, $lt: end }
            }
            await this.vault.queryDBData(feeds.SCRIPT_SOMETIME_POST, filter)
        }).then ((data: any) => {
            let posts = []
            data.forEach(item => {
                posts.push(Post.parse(this.channelInfo.getOwnerDid(), item));
            })
            return posts
        }).catch (error => {
            logger.error("Query posts by range of time error:", error)
            throw new Error(error)
        })
    }

    /**
     *
     * @param start
     * @param end
     * @param upperLimit
     * @param dispatcher
     */
    public async queryAndDispatchPostsByRangeOfTime(start: number, end: number, upperLimit: number,
        dispatcher: Dispatcher<PostBody>) {
        return this.queryPostsByRangeOfTime(start, end).then (posts => {
            posts.forEach(item => {
                dispatcher.dispatch(item)
            })
        }).catch (error => {
            logger.error("Query posts by range of time error:", error)
            throw new Error(error)
        })
    }

    /**
     *
     * @param postId
     */
    public async queryPost(postId: string): Promise<PostBody> {
        return new Promise<any>( async() => {
            const filter = {
                "channel_id": this.channelInfo.getChannelId(),
                "postId": postId
            }
            await this.vault.queryDBData(feeds.SCRIPT_SOMETIME_POST, filter)
        }).then ((data) => {
            let posts = []
            data.forEach(item => {
                posts.push(Post.parse(this.channelInfo.getOwnerDid(), item));
            })
            return posts[0]
        }).catch (error => {
            logger.error("Query post:", error)
            throw new Error(error)
        })
    }

    /**
     *
     * @param postId
     * @param dispatcher
     */
    public async queryAndDispatchPost(postId: string, dispatcher: Dispatcher<PostBody>) {
        return this.queryPost(postId).then (post => {
            dispatcher.dispatch(post)
        }).catch (error => {
            logger.error("Query post:", error)
            throw new Error(error)
        })
    }

    /**
     *
     * @returns
     */
    public async querySubscriberCount(): Promise<number> {
        return new Promise( async() => {
            const filter = {
                "channel_id": this.channelInfo.getChannelId()
            }
            await this.vault.queryDBData(feeds.TABLE_SUBSCRIPTIONS, filter)
        }).then ((result: any) => {
            return result.length
        }).catch ( error => {
            logger.error("Query script error: ", error)
            throw new Error(error)
        })
    }

    /**
     *
     * @param earilerThan
     * @param upperlimit
     */
    public async querySubscribers(earilerThan: number, upperlimit: number): Promise<Profile[]> {
        throw new Error('Method not implemented.');
    }

    /**
     *
     * @param until
     * @param upperLimit
     * @param dispatcher
     */
    public queryAndDispatchSubscribers(until: number, upperLimit: number, dispatcher: Dispatcher<Profile>) {
        throw new Error('Method not implemented.');
    }

    /**
     *
     * @param postBody
     */
    public async post(postBody: Post) {
        return new Promise<void>( async() => {
            const body = postBody.getBody()
            const doc = {
                "channel_id": body.getChannelId(),
                "post_id"   : body.getPostId(),
                "created_at": body.getCreatedAt(),
                "updated_at": body.getUpdatedAt(),
                "content"   : body.getContent().toString(),
                "status"    : body.getStatus(),
                "memo"  : body.getMemo(),
                "type"  : body.getType(),
                "tag"   : body.getTag(),
                "proof" : body.getProof()
            }
            await this.vault.insertDBData(feeds.TABLE_POSTS, doc)
        }).then(result => {
            // TODO: deal with result.
        }).catch(error => {
            logger.error('Post data error: ', error)
            throw new Error(error)
        })
    }

    /**
     *
     * @param postId
     */
    public async deletePost(postId: string) {
        return new Promise<void>( async() => {
            const doc = {
                "updated_at": new Date().getTime(),
                "status": 1,
            }
            let filter = {
                "channel_id": this.channelInfo.getChannelId(),
                "post_id": postId
            }
            let update = { "$set": doc }
            await this.vault.updateOneDBData(feeds.TABLE_POSTS, filter, update, new UpdateOptions(false, true))
        }).then( result => {
            // TODO: deal with result.
        }).catch (error => {
            logger.error('Delete data from postDB error: ', error)
            throw new Error(error)
        })
    }

    static parse(targetDid: string, channels: any): ChannelInfo[] {
        let parseResult = []
        channels.forEach(item => {
            const channelInfo = ChannelInfo.parse(targetDid, item)
            parseResult.push(channelInfo)
        })

        return parseResult
    }

    static parseOne(targetDid: string, channels: any): ChannelInfo {
        let parseResult = []
        channels.forEach(item => {
            const channelInfo = ChannelInfo.parse(targetDid, item)
            parseResult.push(channelInfo)
        })

        return parseResult[0]
    }
}
