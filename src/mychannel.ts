import { Logger } from './utils/logger'
import { Dispatcher } from './dispatcher'
import { ChannelInfo } from './channelinfo'
import { Post } from './post';
import { ChannelHandler } from './channelhandler';
import { hiveService as VaultService } from "./hiveService"
import { PostBody } from './postbody';
import { Profile } from './profile';
import { RuntimeContext } from './runtimecontext';
import { CollectionNames, CollectionNames as collections, ScriptingNames as scripts } from './vault/constants';
import { UpdateOptions, FindOptions } from "@elastosfoundation/hive-js-sdk"

const logger = new Logger("MyChannel")

export class MyChannel {
    private context: RuntimeContext;
    private channelInfo: ChannelInfo;
    private published: boolean;
    private vault: VaultService

    public constructor(context: RuntimeContext, channelInfo: ChannelInfo) {
        this.context = context
        this.channelInfo = channelInfo
        this.vault = new VaultService()
    }

    public getChannelInfo() {
        return this.channelInfo
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
        const channelId = this.channelInfo.getChannelId()
        console.log("queryChannelInfo channelId ============================================ ", channelId)
        const filter = {
            "channel_id": channelId
        }
        const ownerDid = this.channelInfo.getOwnerDid()
        const appDid = this.context.getAppDid()
        console.log("queryChannelInfo filter ============================================ ", filter)
        console.log("queryChannelInfo ownerDid ============================================ ", ownerDid)
        console.log("queryChannelInfo appDid ============================================ ", appDid)

        return this.vault.queryDBData(CollectionNames.CHANNELS, filter)
            .then(result => {
                console.log("queryChannelInfo result ============================================ ", result)
                return ChannelInfo.parse(this.channelInfo.getOwnerDid(), result[0])
            }).catch(error => {
                logger.log('Query channel information error: ', error)
                throw new error
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
    public updateChannelInfo(channelInfo: ChannelInfo): Promise<boolean> {

            const filter = { "channel_id": channelInfo.getChannelId() }
            const doc = {
                "display_name": channelInfo.getDisplayName(),
                "intro" : channelInfo.getDescription(),
                "avatar": channelInfo.getAvatar(),
                "updated_at": channelInfo.getUpdatedAt(),
                "type"  : channelInfo.getType(),
                "tipping_address": channelInfo.getReceivingAddress(),
                "nft"   : channelInfo.getNft(),
                "memo"  : channelInfo.getMmemo(),
            }
            const update = { "$set": doc }
        return this.vault.updateOneDBData(collections.CHANNELS, filter, update, new UpdateOptions(false, true)).then(result => {
            return true
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
            const filter = {
                "channel_id": this.channelInfo.getChannelId(),
                "updated_at": { "$lt": earilerThan }
            }
        const queryOptions = new FindOptions()
        queryOptions.limit = upperLimit
        return this.vault.queryDBDataWithOptions(CollectionNames.POSTS, filter, queryOptions)
            .then((result: any) => {
            let posts = []
                result.forEach(item => {
                const post = Post.parse(this.channelInfo.getOwnerDid(), item)
                posts.push(post)
            })
            return posts
        }).catch (error => {
            logger.error('Query posts error:', error)
            throw error
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
        const channelId = this.channelInfo.getChannelId()
        const filter = {
            "channel_id": channelId,
            "updated_at": { $gt: start, $lt: end }
        }
        return this.vault.queryDBData(CollectionNames.POSTS, filter)
            .then((data: any) => {
                console.log("queryPostsByRangeOfTime data ==============================", data)
            let posts = []
            data.forEach(item => {
                console.log("queryPostsByRangeOfTime item ==============================", item)
                const postBody = PostBody.parse(this.channelInfo.getOwnerDid(), item)
                posts.push(postBody)
            })
            return posts
        }).catch (error => {
            logger.error("Query posts by range of time error:", error)
            throw error
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
        const filter = {
            "channel_id": this.channelInfo.getChannelId(),
            "post_id": postId
        }
        console.log("filter ====== ", filter)
        return this.vault.queryDBData(collections.POSTS, filter)
            .then((data) => {
            let posts = []
            data.forEach(item => {
                const post = Post.parse(this.channelInfo.getOwnerDid(), item)
                posts.push(post)
            })
            return posts[0]
        }).catch (error => {
            logger.error("Query post:", error)
            throw error
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
            const filter = {
                "channel_id": this.channelInfo.getChannelId()
            }
        return this.vault.queryDBData(collections.SUBSCRIPTION, filter)
            .then((result: any) => {
                console.log("querySubscriberCount result ========== ", result)
            return result.length
        }).catch ( error => {
            logger.error("Query script error: ", error)
            throw error
        })
    }

    /**
     *
     * @param earilerThan
     * @param upperlimit
     */
    public querySubscribers(earilerThan: number, upperlimit: number): Promise<Profile[]> {
        const filter = {
            "channel_id": this.channelInfo.getChannelId(),
            "updated_at": { "$lt": earilerThan }
        }
        const findOptions = new FindOptions()
        findOptions.limit = upperlimit
        return this.vault.queryDBDataWithOptions(collections.SUBSCRIPTION, filter, findOptions)
            .then((result: any) => {
                let profiles = []
                result.forEach(item => {
                    const profile = Profile.parse(this.context, this.channelInfo.getOwnerDid(), item)
                    profiles.push(profile)
                })
                return profiles
            }).catch(error => {
                logger.error("Query script error: ", error)
                throw error
            })
    }

    /**
     *
     * @param until
     * @param upperLimit
     * @param dispatcher
     */
    public queryAndDispatchSubscribers(earilerThan: number, upperLimit: number, dispatcher: Dispatcher<Profile>): Promise<void> {
        return this.querySubscribers(earilerThan, upperLimit).then(profiles => {
            profiles.forEach(item => {
                dispatcher.dispatch(item)
            })
        }).catch(error => {
            logger.log('query and dispatch subscribers error: ', error)
            throw new Error(error)
        })
    }

    /**
     *
     * @param postBody
     */
    public post(post: Post) {
        const body = post.getBody()
        const doc = {
            "channel_id": body.getChannelId(),
            "post_id"   : body.getPostId(),
            "created_at": body.getCreatedAt(),
            "updated_at": body.getUpdatedAt(),
            "content": body.getContent().toString(),
            "status"    : body.getStatus(),
            "memo"  : body.getMemo(),
            "type"  : body.getType(),
            "tag"   : body.getTag(),
            "proof" : body.getProof()
        }
        console.log("post doc =============================== ", doc)
        return this.vault.insertDBData(collections.POSTS, doc)
            .then(result => {
                console.log("result ====== ", result)
                return true
            }).catch(error => {
                logger.error('Post data error: ', error)
                throw error
            })
    }

    /**
     *
     * @param postId
     */
    public deletePost(postId: string): Promise<boolean> {
        const doc = {
            "updated_at": new Date().getTime(),
            "status": 1,
        }
        const filter = {
            "channel_id": this.channelInfo.getChannelId(),
            "post_id": postId
        }
        const update = { "$set": doc }
        return this.vault.updateOneDBData(collections.POSTS, filter, update, new UpdateOptions(false, true))
            .then(result => {
                console.log("result ====== ", result)
                return true
        }).catch (error => {
            logger.error('Delete data from postDB error: ', error)
            throw error
        })
    }

    // 为了测试提供： 硬删除
    public removePost(postId: string): Promise<boolean> {
        const filter = {
            "channel_id": this.channelInfo.getChannelId(),
            "post_id": postId
        }
        return this.vault.deleateOneDBData(collections.POSTS, filter)
            .then(result => {
                console.log("result ====== ", result)
                return true
            }).catch(error => {
                logger.error('Remove data from postDB error: ', error)
                throw error
            })
    }

    static parse(targetDid: string, context: RuntimeContext, channel: any): MyChannel {
        const channelInfo = ChannelInfo.parse(targetDid, channel)
        const myChannel = new MyChannel(context, channelInfo)

        return myChannel
    }
}
