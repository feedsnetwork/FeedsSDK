import { Logger } from './utils/logger'
import { hiveService } from "./hiveService"
import { ScriptingNames, CollectionNames, FeedsLocalScriptVersion } from './vault/constants'
import { UpdateOptions, UpdateExecutable, FindExecutable, QueryHasResultCondition, AndCondition, InsertExecutable, DeleteExecutable } from "@elastosfoundation/hive-js-sdk"
import { RuntimeContext } from './runtimecontext'

const logger = new Logger("register")
export class Register {
    private vault: hiveService

    constructor() { }

    // isForce TODO:
    checkCreateAndRregiste(isForce: boolean): Promise<boolean> {
        return new Promise<any>(async (resolve, reject) => {
            let remoteVersion = ''
            const userDid = RuntimeContext.getInstance().getUserDid()

            const key = userDid + 'localScriptVersion'
            let localStorageVersion = localStorage.getItem(key) || ''
            if (localStorageVersion == "" && isForce === false) {
                resolve(true)
            }
            if (localStorageVersion != FeedsLocalScriptVersion) {
                try {
                    if (localStorageVersion === '') {
                        let result = await this.queryRemoteFeedsScriptingVersion()
                        remoteVersion = result[0]["laster_version"]
                    }
                    else { }
                }
            catch (error) {
                    if (error["code"] === 404) {
                    }
                }
            }
            else {
                // 不需要注册 return
                resolve(true)
            }
            if (FeedsLocalScriptVersion !== remoteVersion) {
                try {
                    await this.createCollectionAndRregisteScript()
                    remoteVersion = FeedsLocalScriptVersion
                    localStorageVersion = remoteVersion
                    //update
                    await this.updateRemoteFeedsScriptingVersion(remoteVersion)
                    localStorage.setItem(key, localStorageVersion)
                } catch (error) {
                    logger.log("create and registe error: ", error)
                    reject(error)
                }
            } else if (localStorageVersion === '' && FeedsLocalScriptVersion === remoteVersion) {
                localStorageVersion = FeedsLocalScriptVersion
                localStorage.setItem(key, localStorageVersion)
            }
            resolve(true)
        })
    }

    private async createCollectionAndRregisteScript() {
        try {
            await this.createAllCollections()
        } catch (error) {
            // ignore
        }
        await this.registeAllScripting()
    }

    private registeAllScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                //channel
                const p1 = this.registerQueryChannelInfoScripting()

                //post
                const p2 = this.registerQueryPostByChannelIdScripting()
                const p3 = this.registerQueryPostRangeOfTimeScripting()
                const p4 = this.registerQueryPostByIdScripting()

                //subscription
                const p5 = this.registerSubscribeScripting()
                const p6 = this.registerQuerySubscriptionInfoByChannelIdScripting()
                const p7 = this.registerQuerySubscriptionInfoByUserDidScripting()
                const p8 = this.registerUnsubscribeScripting()
                const p9 = this.registerUpdateSubscription()

                //comment
                const p10 = this.registerCreateCommentScripting()
                const p11 = this.registerFindCommentByIdScripting()
                const p12 = this.registerQueryCommentByPostIdScripting()
                const p13 = this.registerUpdateCommentScripting()
                const p14 = this.registerDeleteCommentScripting()
                const p15 = this.registerQueryCommentByChannelScripting()
                const p16 = this.registerQueryCommentsFromPostsScripting()

                //like
                const p17 = this.registerCreateLikeScripting()
                const p18 = this.registerQueryLikeByIdScripting()
                const p19 = this.registerRemoveLikeScripting()
                const p20 = this.registerQueryLikeByChannelScripting()
                const p21 = this.registerQueryLikeByPostScripting()
                const p22 = this.registerUpdateLike()
                const p23 = this.registerQuerySelfLikeByIdScripting()

                //DisplayName
                const p24 = this.registerQueryDisplayNameScripting()

                //Public post
                const p25 = this.registerQueryPublicPostByIdScripting()
                const p26 = this.registerQueryPublicPostByChannelIdScripting()
                const p27 = this.registerQueryPublicPostRangeOfTimeScripting()

                const p28 = this.registerQuerySubscriptionInfoByUserDIDAndChannelIdScripting()
                const array = [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, p17, p18, p19, p20, p21, p22, p23, p24, p25, p26, p27, p28] as const
                Promise.all(array).then(values => {
                    logger.debug('Registe all scripting success: ', values)
                    resolve('SUCCESS')
                }, reason => {
                    reject(reason)
                })
            } catch (error) {
                logger.error("Registe all scripting error: ", error)
                reject(error)
            }
        })
    }

    private createAllCollections(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            const p1 = this.createCollection(CollectionNames.FEEDS_SCRIPTING)
            const p2 = this.createCollection(CollectionNames.CHANNELS)
            const p3 = this.createCollection(CollectionNames.POSTS)
            const p4 = this.createCollection(CollectionNames.SUBSCRIPTION)
            const p5 = this.createCollection(CollectionNames.COMMENTS)
            const p6 = this.createCollection(CollectionNames.LIKES)
            const p7 = this.createCollection(CollectionNames.BACKUP_SUBSCRIBEDCHANNELS)

            const array = [p1, p2, p3, p4, p5, p6, p7] as const
            Promise.all(array).then(values => {
                logger.debug('Create all collections success: ', values)
                resolve('SUCCESS')
            }, async reason => {
                logger.error('Create all collections error: ', reason)
                reject(reason)
            })
        })
    }

    prepareConnectHive(): Promise<string> {
        return this.registerQueryChannelInfoScripting()
    }

    private createCollection(collectName: string): Promise<void> {
        return this.vault.createCollection(collectName)
    }

    private updateRemoteFeedsScriptingVersion(lasterVersion: string): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                const doc =
                {
                    "laster_version": lasterVersion,
                }
                const option = new UpdateOptions(false, true)
                let filter = { "laster_version": lasterVersion }
                let update = { "$set": doc }

                const updateResult = await this.vault.updateOneDBData(CollectionNames.FEEDS_SCRIPTING, filter, update, option)
                logger.log('update remote feeds scripting version: ', updateResult)
                resolve(true)
            } catch (error) {
                logger.error('update remote feeds scripting version error: ', error)
                reject(error)
            }
        })
    }

    private queryRemoteFeedsScriptingVersion(): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const filter = {}
                const result = this.vault.queryDBData(CollectionNames.FEEDS_SCRIPTING, filter)
                resolve(result)
            } catch (error) {
                logger.error('Query remote feeds scripting version error: ', error)
                reject(error)
            }
        })
    }

    private registerQueryChannelInfoScripting(): Promise<string> {
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
