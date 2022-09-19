import { Logger } from './utils/logger'
import { Dispatcher } from './dispatcher'
import { ChannelInfo } from './channelinfo'
import { Post } from './post';
import { ChannelHandler } from './channelhandler';
import { hiveService as VaultService } from "./hiveService"
import { PostBody } from './postbody';
import { Profile } from './profile';
import { RuntimeContext } from './runtimecontext';
import { CollectionNames as collections, ScriptingNames as scripts } from './vault/constants';

const logger = new Logger("MyChannel")

export class MyChannel {
    private context: RuntimeContext;
    private channelInfo: ChannelInfo;
    private published: boolean;
    private vault: VaultService

    public constructor(context: RuntimeContext, channelInfo: ChannelInfo) {
        this.context = context
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
    public queryChannelInfo(): Promise<ChannelInfo> {
        return new Promise<any>( (resolve, _reject) => {
            const params = {
                "channel_id": this.channelInfo.getChannelId()
            }
            const result = this.vault.callScript(scripts.SCRIPT_QUERY_CHANNEL_INFO, params,
                this.channelInfo.getOwnerDid(), this.context.getAppDid())

            // TODO: error
            resolve(result)
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
    public queryAndDispatchChannelInfo(dispatcher: Dispatcher<ChannelInfo>) {
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
    public updateChannelInfo(channelInfo: ChannelInfo) {
        return new Promise<void>( (resolve, _reject) => {
            const filter = { "channel_id": channelInfo.getChannelId() }
            const doc = {
                "name"  : channelInfo.getName(),
                "intro" : channelInfo.getDescription(),
                "avatar": channelInfo.getAvatar(),
                "updated_at": channelInfo.getUpdatedAt(),
                "type"  : channelInfo.getType(),
                "tipping_address": channelInfo.getReceivingAddress(),
                "nft"   : channelInfo.getNft(),
                "memo"  : channelInfo.getMmemo(),
            }
            const update = { "$set": doc }

            //this.vault.updateOneDBData(collections.CHANNELS, filter, null,
            //    new UpdateOptions(false, true))

            // TODO: error
            resolve()
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
    public queryPosts(earilerThan: number, upperLimit: number): Promise<PostBody[]> {
        return new Promise( (resolve, _reject) => {
            const filter = {
                "limit": { "$lt": upperLimit },
                "created": { "$gt": earilerThan }
            }
            const result = this.vault.queryDBData(scripts.SCRIPT_SOMETIME_POST, filter)
            // TODO:
            resolve(result)
        }).then ((result: any) => {
            let posts = []
            result.forEach(item => {
                Post.parse(this.channelInfo.getOwnerDid(), item)
                // posts.push()
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
    public queryAndDispatchPosts(until: number, upperLimit: number, dispatcher: Dispatcher<PostBody>) {
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
    public queryPostsByRangeOfTime(start: number, end: number): Promise<PostBody[]> {
        return new Promise( (resolve, _reject) => {
            const channelId = this.channelInfo.getChannelId()
            const filter = {
                "channel_id": channelId,
                "created": { $gt: start, $lt: end }
            }
            const result = this.vault.queryDBData(scripts.SCRIPT_SOMETIME_POST, filter)
            // TODO:
            resolve(result)
        }).then ((data: any) => {
            let posts = []
            data.forEach(item => {
                Post.parse(this.channelInfo.getOwnerDid(), item)
                // posts.push()
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
    public queryAndDispatchPostsByRangeOfTime(start: number, end: number, upperLimit: number,
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
    public queryPost(postId: string): Promise<PostBody> {
        return new Promise<any>( (resolve, _reject) => {
            const filter = {
                "channel_id": this.channelInfo.getChannelId(),
                "postId": postId
            }
            const result = this.vault.queryDBData(scripts.SCRIPT_SOMETIME_POST, filter)
            // TODO:
            resolve(result)
        }).then ((data) => {
            let posts = []
            data.forEach(item => {
                Post.parse(this.channelInfo.getOwnerDid(), item)
                // posts.push()
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
    public queryAndDispatchPost(postId: string, dispatcher: Dispatcher<PostBody>) {
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
    public querySubscriberCount(): Promise<number> {
        return new Promise( (resolve, _reject) => {
            const filter = {
                "channel_id": this.channelInfo.getChannelId()
            }
            const result = this.vault.queryDBData(collections.SUBSCRIPTION, filter)
            // TODO:
            resolve(result)
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
    public querySubscribers(earilerThan: number, upperlimit: number): Promise<Profile[]> {
        throw new Error('Method not implemented.');
    }

    /**
     *
     * @param until
     * @param upperLimit
     * @param dispatcher
     */
    public queryAndDispatchSubscribers(until: number, upperLimit: number, dispatcher: Dispatcher<Profile>): Promise<void> {
        throw new Error('Method not implemented.');
    }

    /**
     *
     * @param postBody
     */
    public post(postBody: Post) {
        return new Promise<void>( (resolve, _reject) => {
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
            const result = this.vault.insertDBData(collections.POSTS, doc)
            // TODO:
            resolve()
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
    public deletePost(postId: string) : Promise<void> {
        return new Promise<void>( (resolve, _reject) => {
            const doc = {
                "updated_at": new Date().getTime(),
                "status": 1,
            }
            const filter = {
                "channel_id": this.channelInfo.getChannelId(),
                "post_id": postId
            }
            const update = { "$set": doc }
            //this.vault.updateOneDBData(collections.POSTS, filter, update, new UpdateOptions(false, true))
            // TODO: error
            resolve()
        }).then( result => {
            // TODO: deal with result.
        }).catch (error => {
            logger.error('Delete data from postDB error: ', error)
            throw new Error(error)
        })
    }

    static parse(targetDid: string, context: RuntimeContext, channels: any): MyChannel {
        let parseResult: ChannelInfo[] = []
        channels.forEach(item => {
            const channelInfo = ChannelInfo.parse(targetDid, item)
            parseResult.push(channelInfo)
        })
        const myChannel = new MyChannel(context, parseResult[0])

        return myChannel
    }
}
