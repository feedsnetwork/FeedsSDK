import { Logger } from './utils/logger'
import { hiveService } from "./hiveService"
import { ScriptingNames, CollectionNames } from './vault/constants'
import { UpdateExecutable, FindExecutable, QueryHasResultCondition, AndCondition, InsertExecutable, DeleteExecutable } from "@elastosfoundation/hive-js-sdk"

const logger = new Logger("register")
export class register {
    private vault: hiveService

    constructor() { }

    private registerQueryChannelInfoScripting(forceCreate: boolean = false): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let executablefilter = { "channel_id": "$params.channel_id", "type": "public" }
                let options = { "projection": { "_id": false }, "limit": 100 }
                const executable = new FindExecutable("find_message", CollectionNames.CHANNELS, executablefilter, options).setOutput(true)
                await this.vault.registerScript(ScriptingNames.SCRIPT_QUERY_CHANNEL_INFO, executable, null, false)
                resolve("SUCCESS")
            } catch (error) {
                logger.error("Register query channel info scripting error: ", error)
                reject(error)
            }
        })
    }

    private registerQueryPostByChannelIdScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let executablefilter = { "channel_id": "$params.channel_id" }
                let options = { "projection": { "_id": false }, "limit": 100 }
                let conditionfilter = { "channel_id": "$params.channel_id", "user_did": "$caller_did" }
                let queryCondition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionfilter, null)
                let findExe = new FindExecutable("find_message", CollectionNames.POSTS, executablefilter, options).setOutput(true)
                await this.vault.registerScript(ScriptingNames.SCRIPT_QUERY_POST_BY_CHANNEL, findExe, queryCondition, false, false)
                resolve("SUCCESS")
            } catch (error) {
                logger.error("Register query post by channelId scripting error: ", error)
                reject(error)
            }
        })
    }

    private registerQueryPostRangeOfTimeScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let executablefilter =
                    { "channel_id": "$params.channel_id", "updated_at": { $gt: "$params.start", $lt: "$params.end" } }
                let options = { "projection": { "_id": false }, "limit": 30, "sort": { "updated_at": -1 } }
                let conditionfilter = { "channel_id": "$params.channel_id", "user_did": "$caller_did" }
                let queryCondition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionfilter, null)
                let findExe = new FindExecutable("find_message", CollectionNames.POSTS, executablefilter, options).setOutput(true)
                await this.vault.registerScript(ScriptingNames.SCRIPT_SOMETIME_POST, findExe, queryCondition, false, false)
                resolve("SUCCESS")
            } catch (error) {
                logger.error("Register query post range of time scripting error: ", error)
                reject(error)
            }
        })
    }

    private registerQueryPostByIdScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let executablefilter = { "channel_id": "$params.channel_id", "post_id": "$params.post_id" }
                let options = { "projection": { "_id": false }, "limit": 100 }
                let conditionfilter1 = { "channel_id": "$params.channel_id", "user_did": "$caller_did" }
                let conditionfilter2 = { "channel_id": "$params.channel_id", "post_id": "$params.post_id", "type": "public" }
                let queryCondition1 = new QueryHasResultCondition("subscription_permission", CollectionNames.SUBSCRIPTION, conditionfilter1, null)
                let queryCondition2 = new QueryHasResultCondition("post_permission", CollectionNames.POSTS, conditionfilter2, null)
                let andCondition = new AndCondition("verify_user_permission", [queryCondition1, queryCondition2])
                let findExe = new FindExecutable("find_message", CollectionNames.POSTS, executablefilter, options).setOutput(true)
                await this.vault.registerScript(ScriptingNames.SCRIPT_SPECIFIED_POST, findExe, andCondition, false, false)
                resolve("SUCCESS")
            } catch (error) {
                logger.error("Register query post by id scripting error: ", error)
                reject(error)
            }
        })
    }

    private registerSubscribeScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const type = 'public'    //Currently only public channels are found for subscription
                let conditionfilter = {
                    "channel_id": "$params.channel_id",
                    "type": type
                }
                const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.CHANNELS, conditionfilter, null)

                let document = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did",
                    "created_at": "$params.created_at",
                    "display_name": "$params.display_name",
                    "updated_at": "$params.updated_at",
                    "status": "$params.status"
                }
                let options = { "projectxsion": { "_id": false } }

                const executable = new InsertExecutable("database_insert", CollectionNames.SUBSCRIPTION, document, options)
                await this.vault.registerScript(ScriptingNames.SCRIPT_SUBSCRIBE_CHANNEL, executable, condition)
                resolve("SUCCESS")
            } catch (error) {
                logger.error("Register subscribe scripting error: ", error)
                reject(error)
            }
        })
    }

    private registerQuerySubscriptionInfoByChannelIdScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const executableFilter = {
                    "channel_id": "$params.channel_id",
                    "status": "$params.status"
                }

                let options = { "projection": { "_id": false }, "limit": 100 }
                const executable = new FindExecutable("find_message", CollectionNames.SUBSCRIPTION, executableFilter, options).setOutput(true)
                await this.vault.registerScript(ScriptingNames.SCRIPT_QUERY_SUBSCRIPTION_BY_CHANNELID, executable, null, false)
                resolve("SUCCESS")
            } catch (error) {
                logger.error("registerQuerySubscriptionInfoByChannelId error", error)
                reject(error)
            }
        })
    }

    private registerQuerySubscriptionInfoByUserDidScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const executableFilter = {
                    "user_did": "$params.user_did"
                }

                let options = { "projection": { "_id": false }, "limit": 100 }
                const executable = new FindExecutable("find_message", CollectionNames.SUBSCRIPTION, executableFilter, options).setOutput(true)
                await this.vault.registerScript(ScriptingNames.SCRIPT_QUERY_SUBSCRIPTION_BY_USERDID, executable, null, false)
                resolve("SUCCESS")
            } catch (error) {
                logger.error("Register query subscription info by userDid scripting error: ", error)
                reject(error)
            }
        })
    }

    private registerUnsubscribeScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const filter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did"
                }

                const executable = new DeleteExecutable("database_delete", CollectionNames.SUBSCRIPTION, filter)
                await this.vault.registerScript(ScriptingNames.SCRIPT_UNSUBSCRIBE_CHANNEL, executable, null)
                resolve("SUCCESS")
            } catch (error) {
                logger.error("Register unsubscribe scripting error: ", error)
                reject(error)
            }
        })
    }

    private registerUpdateSubscription(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const conditionfilter = {
                    "channel_id": "$params.channel_id",
                }

                const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionfilter, null)
                let set = {
                    "status": "$params.status",
                    "updated_at": "$params.updated_at",
                }
                const filter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did",
                }
                let update = { "$set": set }
                let options = { "bypass_document_validation": false, "upsert": true }
                const executable = new UpdateExecutable("database_update", CollectionNames.SUBSCRIPTION, filter, update, options).setOutput(true)
                await this.vault.registerScript(ScriptingNames.SCRIPT_UPDATE_SUBSCRIPTION, executable, condition, false)
                resolve("SUCCESS")
            } catch (error) {
                logger.error("Register update subscription error: ", error)
                reject(error)
            }
        })
    }

    private registerCreateCommentScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let conditionfilter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did"
                }
                const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionfilter, null)

                let executablefilter = {
                    "comment_id": "$params.comment_id",
                    "channel_id": "$params.channel_id",
                    "post_id": "$params.post_id",
                    "refcomment_id": "$params.refcomment_id",
                    "content": "$params.content",
                    "status": 0, // available,
                    "created_at": "$params.created_at",
                    "updated_at": "$params.created_at",
                    "creater_did": "$caller_did"
                }

                let options = {
                    "projection":
                    {
                        "_id": false
                    }
                }
                const executable = new InsertExecutable("database_update", CollectionNames.COMMENTS, executablefilter, options).setOutput(true)

                await this.vault.registerScript(ScriptingNames.SCRIPT_CREATE_COMMENT, executable, condition, false)
                resolve("SUCCESS")
            } catch (error) {
                logger.error("Register create comment scripting error: ", error)
                reject(error)
            }
        })
    }

    private registerFindCommentByIdScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let conditionFilter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did"
                }
                const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionFilter, null)

                const executableFilter = {
                    "channel_id": "$params.channel_id",
                    "post_id": "$params.post_id",
                    "comment_id": "$params.comment_id"
                }

                let options = { "projection": { "_id": false }, "limit": 100 }
                const executable = new FindExecutable("find_message", CollectionNames.COMMENTS, executableFilter, options).setOutput(true)

                await this.vault.registerScript(ScriptingNames.SCRIPT_QUERY_COMMENT_BY_COMMENTID, executable, condition, false)
                resolve("SUCCESS")
            } catch (error) {
                logger.error("Register find comment by id scripting error: ", error)
                reject(error)
            }
        })
    }

    private registerQueryCommentByPostIdScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let conditionFilter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did"
                }
                const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionFilter, null)

                const executableFilter = {
                    "channel_id": "$params.channel_id",
                    "post_id": "$params.post_id",
                }

                let options = { "projection": { "_id": false }, "limit": 100 }
                const executable = new FindExecutable("find_message", CollectionNames.COMMENTS, executableFilter, options).setOutput(true)

                await this.vault.registerScript(ScriptingNames.SCRIPT_QUERY_COMMENT_BY_POSTID, executable, condition, false)
                resolve("SUCCESS")
            } catch (error) {
                logger.error("Register query comment by postId scripting error: ", error)
                reject(error)
            }
        })
    }

    private registerUpdateCommentScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let conditionfilter = {
                    "channel_id": "$params.channel_id",
                    "post_id": "$params.post_id",
                    "comment_id": "$params.comment_id",
                    "creater_did": "$caller_did"
                }
                const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.COMMENTS, conditionfilter, null)

                const filter = {
                    "channel_id": "$params.channel_id",
                    "post_id": "$params.post_id",
                    "comment_id": "$params.comment_id"
                }

                let set = {
                    "status": 2, // edited
                    "content": "$params.content",
                    "updated_at": `$params.updated_at`,
                    "creater_did": "$caller_did"
                }
                let update = { "$set": set }
                let options = { "bypass_document_validation": false, "upsert": true }

                const executable = new UpdateExecutable("database_update", CollectionNames.COMMENTS, filter, update, options).setOutput(true)
                await this.vault.registerScript(ScriptingNames.SCRIPT_UPDATE_COMMENT, executable, condition, false)
                resolve("SUCCESS")
            } catch (error) {
                logger.error("Register update comment scripting error: ", error)
                reject(error)
            }
        })
    }

    private registerDeleteCommentScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let conditionfilter = {
                    "channel_id": "$params.channel_id",
                    "post_id": "$params.post_id",
                    "comment_id": "$params.comment_id",
                    "creater_did": "$caller_did"
                }
                const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.COMMENTS, conditionfilter, null)

                const filter = {
                    "channel_id": "$params.channel_id",
                    "post_id": "$params.post_id",
                    "comment_id": "$params.comment_id"
                }

                let set = {
                    "status": 1, // deleted
                }
                let update = { "$set": set }
                let options = { "bypass_document_validation": false, "upsert": true }

                const executable = new UpdateExecutable("database_update", CollectionNames.COMMENTS, filter, update, options).setOutput(true)
                await this.vault.registerScript(ScriptingNames.SCRIPT_DELETE_COMMENT, executable, condition, false)
                resolve("SUCCESS")
            } catch (error) {
                logger.error("Register delete comment scripting error: ", error)
                reject(error)
            }
        })
    }

    private registerQueryCommentByChannelScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let conditionFilter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did"
                }
                const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionFilter, null)

                const executableFilter = {
                    "channel_id": "$params.channel_id"
                }

                let options = { "projection": { "_id": false }, "limit": 100 }
                const executable = new FindExecutable("find_message", CollectionNames.COMMENTS, executableFilter, options).setOutput(true)

                await this.vault.registerScript(ScriptingNames.SCRIPT_QUERY_COMMENT_BY_CHANNELID, executable, condition, false)
                resolve("SUCCESS")
            } catch (error) {
                logger.error("Register query comment by channel scripting error: ", error)
                reject(error)
            }
        })
    }

    private registerCreateLikeScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let conditionfilter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did"
                }
                const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionfilter, null)

                let executablefilter = {
                    "like_id": "$params.like_id",
                    "channel_id": "$params.channel_id",
                    "post_id": "$params.post_id",
                    "comment_id": "$params.comment_id",
                    "created_at": "$params.created_at",
                    "creater_did": "$caller_did",
                    "updated_at": "$params.updated_at",
                    "status": "$params.status"
                }

                let options = {
                    "projection":
                    {
                        "_id": false
                    }
                }
                const executable = new InsertExecutable("database_insert", CollectionNames.LIKES, executablefilter, options).setOutput(true)
                await this.vault.registerScript(ScriptingNames.SCRIPT_CREATE_LIKE, executable, condition, false)
                resolve("SUCCESS")
            } catch (error) {
                logger.error("Register create like scripting error: ", error)
                reject(error)
            }
        })
    }
    
    private registerQueryLikeByIdScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let conditionFilter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did",
                }
                const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionFilter, null)

                const executableFilter = {
                    "channel_id": "$params.channel_id",
                    "post_id": "$params.post_id",
                    "comment_id": "$params.comment_id",
                    "status": "$params.status"
                }

                let options = { "projection": { "_id": false }, "limit": 100 }
                const executable = new FindExecutable("find_message", CollectionNames.LIKES, executableFilter, options).setOutput(true)
                await this.vault.registerScript(ScriptingNames.SCRIPT_QUERY_LIKE_BY_ID, executable, condition, false)
                resolve("SUCCESS")
            } catch (error) {
                logger.error("Register query like by id scripting error: ", error)
                reject(error)
            }
        })
    }
    
    private registerRemoveLikeScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let conditionfilter = {
                    "channel_id": "$params.channel_id",
                    "post_id": "$params.post_id",
                    "comment_id": "$params.comment_id",
                    "creater_did": "$caller_did"
                }
                const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.LIKES, conditionfilter, null)

                const filter = {
                    "channel_id": "$params.channel_id",
                    "post_id": "$params.post_id",
                    "comment_id": "$params.comment_id"
                }
                const executable = new DeleteExecutable("database_delete", CollectionNames.LIKES, filter).setOutput(true)
                await this.vault.registerScript(ScriptingNames.SCRIPT_REMOVE_LIKE, executable, condition, false)
                resolve("SUCCESS")
            } catch (error) {
                logger.error("Register remove like scripting error: ", error)
                reject(error)
            }
        })
    }
    
    private registerQueryLikeByChannelScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let conditionFilter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did",
                }
                const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionFilter, null)

                const executableFilter = {
                    "channel_id": "$params.channel_id",
                    "status": "$params.status"
                }

                let options = { "projection": { "_id": false }, "limit": 100 }
                const executable = new FindExecutable("find_message", CollectionNames.LIKES, executableFilter, options).setOutput(true)
                await this.vault.registerScript(ScriptingNames.SCRIPT_QUERY_LIKE_BY_CHANNEL, executable, condition, false)
                resolve("SUCCESS")
            } catch (error) {
                logger.error("Register query like by channel scripting error: ", error)
                reject(error)
            }
        })
    }
    
    private registerQueryLikeByPostScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let conditionFilter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did",
                }
                const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionFilter, null)

                const executableFilter = {
                    "channel_id": "$params.channel_id",
                    "post_id": "$params.post_id",
                    "status": "$params.status"
                }

                let options = { "projection": { "_id": false }, "limit": 100 }
                const executable = new FindExecutable("find_message", CollectionNames.LIKES, executableFilter, options).setOutput(true)
                await this.vault.registerScript(ScriptingNames.SCRIPT_QUERY_LIKE_BY_POST, executable, condition, false)
                resolve("SUCCESS")
            } catch (error) {
                logger.error("Register query like by post scripting error: ", error)
                reject(error)
            }
        })
    }

    private registerUpdateLike(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const conditionfilter = {
                    "like_id": "$params.like_id",
                    "creater_did": "$caller_did",
                }

                const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.LIKES, conditionfilter, null)
                let set = {
                    "status": "$params.status",
                    "updated_at": "$params.updated_at",
                }
                const filter = {
                    "like_id": "$params.like_id",
                }
                let update = { "$set": set }
                let options = { "bypass_document_validation": false, "upsert": true }
                const executable = new UpdateExecutable("database_update", CollectionNames.LIKES, filter, update, options).setOutput(true)
                await this.vault.registerScript(ScriptingNames.SCRIPT_UPDATE_LIKE, executable, condition, false)
                resolve("SUCCESS")
            } catch (error) {
                logger.error("Register update like error: ", error)
                reject(error)
            }
        })
    }

    private registerQueryDisplayNameScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const executableFilter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$params.user_did"
                }

                let options = { "projection": { "_id": false }, "limit": 100 }
                const executable = new FindExecutable("find_message", CollectionNames.SUBSCRIPTION, executableFilter, options).setOutput(true)
                await this.vault.registerScript(ScriptingNames.SCRIPT_QUERY_USER_DISPLAYNAME, executable, null, false)
                resolve("SUCCESS")
            } catch (error) {
                logger.error("Register query display name scripting error: ", error)
                reject(error)
            }
        })
    }
    
    private registerQueryCommentsFromPostsScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let conditionFilter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did",
                }
                const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionFilter, null)

                const executableFilter = {
                    "post_id": { "$in": "$params.post_ids" }
                }

                let options = { "projection": { "_id": false }, "limit": 100 }
                const executable = new FindExecutable("find_message", CollectionNames.COMMENTS, executableFilter, options).setOutput(true)
                await this.vault.registerScript(ScriptingNames.QUERY_COMMENT_FROM_POSTS, executable, condition, false)
                resolve("SUCCESS")
            } catch (error) {
                logger.error("Register query comments from posts scripting error: ", error)
                reject(error)
            }
        })
    }
  
    private registerQuerySelfLikeByIdScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let conditionFilter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did",
                }
                const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionFilter, null)

                const executableFilter = {
                    "like_id": "$params.like_id",
                    "creater_did": "$caller_did",
                    "status": "$params.status"
                }

                let options = { "projection": { "_id": false }, "limit": 100 }
                const executable = new FindExecutable("find_message", CollectionNames.LIKES, executableFilter, options).setOutput(true)
                await this.vault.registerScript(ScriptingNames.QUERY_SELF_LIKE_BY_ID, executable, condition, false)
                resolve("SUCCESS")
            } catch (error) {
                logger.error("Register query self like byId scripting error: ", error)
                reject(error)
            }
        })
    }

    private registerQueryPublicPostByIdScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const postType = 'public'
                let postCondition = { "channel_id": "$params.channel_id", "post_id": "$params.post_id", "type": postType }
                let queryCondition = new QueryHasResultCondition("post_permission", CollectionNames.POSTS, postCondition, null)

                let executablefilter = { "channel_id": "$params.channel_id", "post_id": "$params.post_id", "type": postType }
                let options = { "projection": { "_id": false }, "limit": 100 }

                let findExe = new FindExecutable("find_message", CollectionNames.POSTS, executablefilter, options).setOutput(true)
                await this.vault.registerScript(ScriptingNames.QUERY_PUBLIC_SPECIFIED_POST, findExe, queryCondition, false, false)
                resolve("SUCCESS")
            } catch (error) {
                logger.error('Register query public post by id error: ', error)
                reject(error)
            }
        })
    }
    
    private registerQueryPublicPostByChannelIdScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const channelType = 'public'
                const postType = 'public'
                let conditionfilter = { "channel_id": "$params.channel_id", "type": channelType }
                let queryCondition = new QueryHasResultCondition("channel_permission", CollectionNames.CHANNELS, conditionfilter, null)

                let executablefilter = { "channel_id": "$params.channel_id", "type": postType }
                let options = { "projection": { "_id": false }, "limit": 100 }

                let findExe = new FindExecutable("find_message", CollectionNames.POSTS, executablefilter, options).setOutput(true)
                await this.vault.registerScript(ScriptingNames.QUERY_PUBLIC_POST_BY_CHANNEL, findExe, queryCondition, false, false)
                resolve("SUCCESS")
            } catch (error) {
                logger.error('Register query public post by channel error: ', error)
                reject(error)
            }
        })
    }
    
    private registerQueryPublicPostRangeOfTimeScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const channelType = 'public'
                const postType = 'public'
                let conditionfilter = { "channel_id": "$params.channel_id", "type": channelType }
                let queryCondition = new QueryHasResultCondition("channel_permission", CollectionNames.CHANNELS, conditionfilter, null)

                let executablefilter = { "channel_id": "$params.channel_id", "updated_at": { $gt: "$params.start", $lt: "$params.end" }, "type": postType }
                let options = { "projection": { "_id": false }, "limit": 30, "sort": { "updated_at": -1 } }

                let findExe = new FindExecutable("find_message", CollectionNames.POSTS, executablefilter, options).setOutput(true)
                await this.vault.registerScript(ScriptingNames.QUERY_PUBLIC_SOMETIME_POST, findExe, queryCondition, false, false)
                resolve("SUCCESS")
            } catch (error) {
                logger.error("Register query public post range of time scripting error: ", error)
                reject(error)
            }
        })
    }
    
    private registerQuerySubscriptionInfoByUserDIDAndChannelIdScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const executableFilter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$params.user_did"
                }

                let options = { "projection": { "_id": false }, "limit": 100 }
                const executable = new FindExecutable("find_message", CollectionNames.SUBSCRIPTION, executableFilter, options).setOutput(true)
                await this.vault.registerScript(ScriptingNames.SCRIPT_QUERY_SUBSCRIPTION_BY_USERDID_CHANNELID, executable, null, false)
                resolve("SUCCESS")
            } catch (error) {
                logger.error("Register query subscription info by userDid and channelId scripting error: ", error)
                reject(error)
            }
        })
    }

    //TODO: 12345
}
