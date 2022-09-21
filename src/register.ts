import { Logger } from './utils/logger'
import { hiveService } from "./hiveService"
import { ScriptingNames, CollectionNames, FeedsLocalScriptVersion } from './vault/constants'
import { UpdateOptions, UpdateExecutable, FindExecutable, QueryHasResultCondition, AndCondition, InsertExecutable, DeleteExecutable, UpdateResult } from "@elastosfoundation/hive-js-sdk"
import { RuntimeContext } from './runtimecontext'

const logger = new Logger("register")
export class Register {
    private vault: hiveService

    constructor() {
        this.vault = new hiveService()
    }

    // isForce TODO:
    checkCreateAndRregiste(forced: boolean): Promise<void> {
        return new Promise<boolean>(async (resolve, reject) => {
            let remoteVersion = ''
            const userDid = RuntimeContext.getInstance().getUserDid()

            const key = userDid + 'localScriptVersion'
            let localStorageVersion = localStorage.getItem(key) || ''
            if (localStorageVersion == "" && forced === false) {
                resolve(true)
            }

            if (localStorageVersion != FeedsLocalScriptVersion) {
                try {
                    if (localStorageVersion === '' || localStorageVersion == null) {
                        let result = await this.queryRemoteFeedsScriptingVersion()
                        remoteVersion = result[0]["laster_version"]
                    }
                    else {
                        console.log("5.  ====== ")
                    }
                }
                catch (error) {
                    if (error["code"] === 404) {
                    }
                }
            } else {
                // 不需要注册 return
                resolve(true)
                return
            }

            if (FeedsLocalScriptVersion !== remoteVersion) {
                try {
                    await this.setupOnVault()
                    remoteVersion = FeedsLocalScriptVersion
                    localStorageVersion = remoteVersion
                    //update
                    await this.updateRemoteFeedsScriptingVersion(remoteVersion)
                    localStorage.setItem(key, localStorageVersion)

                } catch (error) {
                    reject(error)
                }
            } else if (localStorageVersion === '' && FeedsLocalScriptVersion === remoteVersion) {
                localStorageVersion = FeedsLocalScriptVersion
                localStorage.setItem(key, localStorageVersion)
            }
            resolve(true)
        }).then (_ => {
            return;
        }).catch (error => {
            throw new Error(error);
        })
    }

    private setupOnVault(): Promise<void> {
        return Promise.all([
            this.installScripts(),
            this.createCollections()
        ]).then (_ => {
            console.log("Prepare everything on vault")
        }).catch( error => {
            throw new Error(error);
        })
    }

    private installScripts(): Promise<void> {
        return Promise.all([
            // post related
            installScriptToQueryPostsByChannelId(this.vault),
            installScriptToQueryPostsByRangeOfTime(this.vault),
            installScriptToQueryPostById(this.vault),
            installScriptToQueryPostsByStartTimeAndLimit(this.vault),

            // subscription related
            installScriptForSubscription(this.vault),
            installScriptToQuerySubscriptionsByChannelId(this.vault),
            installScriptToQuerySubscriptionByUserDid(this.vault),
            installScriptForUnsubscription(this.vault),
            installScriptToUpdateSubscription(this.vault),

            // comment related.
            installScriptToComment(this.vault),
            installScriptToQueryCommentById(this.vault),
            installScriptToQueryCommentsByPostId(this.vault),
            installScriptToUpdateComment(this.vault),
            installScriptToDeleteComment(this.vault),
            installScriptToQueryCommentsByChannelId(this.vault),
            registerQueryCommentsFromPostsScripting(this.vault),

            //like related.
            registerCreateLikeScripting(this.vault),
            registerQueryLikeByIdScripting(this.vault),
            registerRemoveLikeScripting(this.vault),
            registerQueryLikeByChannelScripting(this.vault),
            registerQueryLikeByPostScripting(this.vault),
            registerUpdateLike(this.vault),
            registerQuerySelfLikeByIdScripting(this.vault),

            //channel
            registerQueryChannelInfoScripting(this.vault),

            //DisplayName
            registerQueryDisplayNameScripting(this.vault),

            //Public post
            registerQueryPublicPostByIdScripting(this.vault),
            registerQueryPublicPostByChannelIdScripting(this.vault),
            registerQueryPublicPostRangeOfTimeScripting(this.vault),

            registerQuerySubscriptionInfoByUserDIDAndChannelIdScripting(this.vault)
        ]).then(values => {
            logger.debug('Registe all scripting success: ', values)
        }).catch (error => {
            throw new Error(error)
        })
    }

    private createCollections(): Promise<void> {
        return Promise.all([
            createCollection(CollectionNames.FEEDS_SCRIPTING, this.vault),
            createCollection(CollectionNames.CHANNELS, this.vault),
            createCollection(CollectionNames.POSTS, this.vault),
            createCollection(CollectionNames.SUBSCRIPTION, this.vault),
            createCollection(CollectionNames.COMMENTS, this.vault),
            createCollection(CollectionNames.LIKES, this.vault),
            createCollection(CollectionNames.BACKUP_SUBSCRIBEDCHANNELS, this.vault)
        ]).then(values => {
            logger.debug('Create all collections success: ', values)
        }).catch(error => {
            logger.error('Create all collections error: ', error)
            throw new Error(error)
        })
    }

    prepareConnectHive(): Promise<void> {
        return registerQueryChannelInfoScripting(this.vault)
    }

    private updateRemoteFeedsScriptingVersion(lasterVersion: string): Promise<UpdateResult> {
        const doc = { "laster_version": lasterVersion,}
        let filter = { "laster_version": lasterVersion }
        let update = { "$set": doc }
        const option = new UpdateOptions(false, true)

        return this.vault.updateOneDBData(CollectionNames.FEEDS_SCRIPTING, filter, update, option).catch(error => {
            logger.error("update remote feeds scripting version error: ", error)
            throw error
        })
    }

    private queryRemoteFeedsScriptingVersion(): Promise<any> {
        const filter = {}
        return this.vault.queryDBData(CollectionNames.FEEDS_SCRIPTING, filter).catch(error => {
            logger.error("query remote feeds scripting version error: ", error)
            throw error
        })
    }
}

const createCollection = (collectioName: string, vault: hiveService): Promise<void> => {
    return vault.createCollection(collectioName);
}

const registerQueryChannelInfoScripting = (vault: hiveService): Promise<void> => {
    const filter = {
        "channel_id": "$params.channel_id",
        "type": "public"
    }
    const options = {
        "projection": { "_id": false },
        "limit": 100
    }

    const executable = new FindExecutable("find_message", CollectionNames.CHANNELS, filter, options).setOutput(true);
    return vault.registerScript(ScriptingNames.SCRIPT_QUERY_CHANNEL_INFO, executable, null, false).catch( error => {
        logger.error("Register query channel info scripting error: ", error);
        throw new Error(error);
    })
}

const installScriptToQueryPostsByStartTimeAndLimit = (vault: hiveService): Promise<void> => {
    let executablefilter = {
        "channel_id": "$params.channel_id",
        "updated_at": {
            $gt: "$params.start"
        }
    }
    let options = {
        "projection": { "_id": false },
        "limit": "$params.limit",
        "sort": {
            "updated_at": -1
        }
    }
    let conditionfilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did"
    }

    let queryCondition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionfilter, null)
    let findExecutable = new FindExecutable("find_message", CollectionNames.POSTS, executablefilter, options).setOutput(true)
    return vault.registerScript(ScriptingNames.SCRIPT_SOMETIME_POST, findExecutable, queryCondition, false, false).catch(error => {
        logger.error("Register a script to query posts by startTime and limit error", error)
        throw new Error(error);
    })
}

const installScriptToQueryPostsByChannelId = (vault: hiveService): Promise<void> => {
    let executablefilter = {
        "channel_id": "$params.channel_id"
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }
    let conditionfilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did"
    }

    let queryCondition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionfilter, null)
    let findExecutable = new FindExecutable("find_message", CollectionNames.POSTS, executablefilter, options).setOutput(true)

    return vault.registerScript(ScriptingNames.SCRIPT_QUERY_POST_BY_CHANNEL, findExecutable, queryCondition, false, false).catch( error => {
        logger.error("Register query post by channelId scripting error: ", error)
        throw new Error(error);
    })
}

const installScriptToQueryPostsByRangeOfTime = (vault: hiveService): Promise<void> => {
    let executablefilter = {
        "channel_id": "$params.channel_id",
        "updated_at": {
            $gt: "$params.start",
            $lt: "$params.end"
        }
    }
    let options = {
        "projection": {"_id": false},
        "limit": 30,
        "sort": {"updated_at": -1}
    }
    let conditionfilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did"
    }
    let queryCondition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionfilter, null)
    let findExe = new FindExecutable("find_message", CollectionNames.POSTS, executablefilter, options).setOutput(true)

    return vault.registerScript(ScriptingNames.SCRIPT_SOMETIME_POST, findExe, queryCondition, false, false).catch(error => {
        logger.error("Register query post range of time scripting error: ", error);
        throw error
    })
}

const installScriptToQueryPostById = (vault: hiveService): Promise<void> => {
    let checkSubscriptionFilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did"
    }
    let checkPostFilter = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
        "type": "public"
    }
    let executablefilter = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id"
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }
    let condition = new AndCondition( "verify_user_permission", [
        new QueryHasResultCondition("subscription_permission", CollectionNames.SUBSCRIPTION, checkSubscriptionFilter, null),
        new QueryHasResultCondition("post_permission", CollectionNames.POSTS, checkPostFilter, null)
    ])
    let executable = new FindExecutable("find_message", CollectionNames.POSTS,
        executablefilter, options).setOutput(true)

    return vault.registerScript(ScriptingNames.SCRIPT_SPECIFIED_POST, executable, condition, false, false).catch(error => {
        logger.error("Register query post by id scripting error: ", error)
        throw new Error(error)
    })
}

const installScriptForSubscription = (vault: hiveService): Promise<void> => {
    let conditionfilter = {
        "channel_id": "$params.channel_id",
        "type": 'public'    //Currently only public channels are found for subscription
    }
    let document = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did",
        "created_at": "$params.created_at",
        "display_name": "$params.display_name",
        "updated_at": "$params.updated_at",
        "status": "$params.status"
    }
    let options = { "projectxsion": { "_id": false } }

    const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.CHANNELS, conditionfilter, null)
    const executable = new InsertExecutable("database_insert", CollectionNames.SUBSCRIPTION, document, options)
    return vault.registerScript(ScriptingNames.SCRIPT_SUBSCRIBE_CHANNEL, executable, condition).catch(error => {
        logger.error("Register subscribe scripting error: ", error)
        throw new Error(error);
    })
}

const installScriptToQuerySubscriptionsByChannelId = (vault: hiveService): Promise<void> => {
    const executableFilter = {
        "channel_id": "$params.channel_id",
        "status": "$params.status"
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }

    const executable = new FindExecutable("find_message", CollectionNames.SUBSCRIPTION,
        executableFilter, options).setOutput(true)
    return vault.registerScript(ScriptingNames.SCRIPT_QUERY_SUBSCRIPTION_BY_CHANNELID, executable, null, false).catch(error => {
        logger.error("registerQuerySubscriptionInfoByChannelId error", error)
        throw new Error(error);
    })
}

const installScriptToQuerySubscriptionByUserDid = (vault: hiveService): Promise<void> => {
    const executableFilter = {
        "user_did": "$params.user_did"
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }
    const executable = new FindExecutable("find_message", CollectionNames.SUBSCRIPTION, executableFilter, options).setOutput(true)
    return vault.registerScript(ScriptingNames.SCRIPT_QUERY_SUBSCRIPTION_BY_USERDID, executable, null, false).catch(error => {
        logger.error("Register query subscription info by userDid scripting error: ", error)
        throw new Error(error);
    })
}

const installScriptForUnsubscription = (vault: hiveService) : Promise<void>  => {
    const filter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did"
    }

    const executable = new DeleteExecutable("database_delete", CollectionNames.SUBSCRIPTION, filter)
    return vault.registerScript(ScriptingNames.SCRIPT_UNSUBSCRIBE_CHANNEL, executable, null).catch(error => {
        logger.error("Register unsubscribe scripting error: ", error)
        throw new Error(error);
    })
}

const installScriptToUpdateSubscription = (vault: hiveService): Promise<void> => {
    const conditionfilter = {
        "channel_id": "$params.channel_id",
    }
    let set = {
        "status": "$params.status",
        "updated_at": "$params.updated_at",
    }
    const filter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did",
    }
    let update = { "$set": set }
    let options = {
        "bypass_document_validation": false,
        "upsert": true
    }
    const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionfilter, null)

    const executable = new UpdateExecutable("database_update", CollectionNames.SUBSCRIPTION, filter, update, options).setOutput(true)
    return vault.registerScript(ScriptingNames.SCRIPT_UPDATE_SUBSCRIPTION, executable, condition, false).catch(error => {
        logger.error("Register update subscription error: ", error)
        throw new Error(error);
    })
}

const installScriptToComment = (vault: hiveService): Promise<void> => {
    let conditionfilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did"
    }
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
        "projection": {"_id": false}
    }
    const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionfilter, null)
    const executable = new InsertExecutable("database_update", CollectionNames.COMMENTS, executablefilter, options).setOutput(true)

    return vault.registerScript(ScriptingNames.SCRIPT_CREATE_COMMENT, executable, condition, false).catch(error => {
        logger.error("Register create comment scripting error: ", error)
        throw new Error(error);
    })
}

const installScriptToQueryCommentById = (vault: hiveService): Promise<void> => {
    let conditionFilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did"
    }
    const executableFilter = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
        "comment_id": "$params.comment_id"
    }

    let options = { "projection":
        { "_id": false }, "limit": 100
    }

    const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionFilter, null)
    const executable = new FindExecutable("find_message", CollectionNames.COMMENTS, executableFilter, options).setOutput(true)

    return vault.registerScript(ScriptingNames.SCRIPT_QUERY_COMMENT_BY_COMMENTID, executable, condition, false).catch(error => {
        logger.error("Register find comment by id scripting error: ", error)
        throw new Error(error);
    })
}

const installScriptToQueryCommentsByPostId = (vault: hiveService): Promise<void> => {
    let conditionFilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did"
    }
    const executableFilter = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }

    const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionFilter, null)
    const executable = new FindExecutable("find_message", CollectionNames.COMMENTS, executableFilter, options).setOutput(true)

    return vault.registerScript(ScriptingNames.SCRIPT_QUERY_COMMENT_BY_POSTID, executable, condition, false).catch(error => {
        logger.error("Register query comment by postId scripting error: ", error)
        throw new Error(error);
    })
}

const installScriptToUpdateComment = (vault: hiveService): Promise<void> => {
    let conditionfilter = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
        "comment_id": "$params.comment_id",
        "creater_did": "$caller_did"
    }
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
    let options = {
        "bypass_document_validation": false,
        "upsert": true
    }

    const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.COMMENTS, conditionfilter, null)
    const executable = new UpdateExecutable("database_update", CollectionNames.COMMENTS, filter, update, options).setOutput(true)
    return vault.registerScript(ScriptingNames.SCRIPT_UPDATE_COMMENT, executable, condition, false).catch(error => {
        logger.error("Register update comment scripting error: ", error)
        throw new Error(error);
    })
}

const installScriptToDeleteComment = (vault: hiveService): Promise<void> => {
    let conditionfilter = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
        "comment_id": "$params.comment_id",
        "creater_did": "$caller_did"
    }
    const filter = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
        "comment_id": "$params.comment_id"
    }
    let set = {
        "status": 1, // deleted
    }
    let update = { "$set": set }
    let options = {
        "bypass_document_validation": false,
        "upsert": true
    }

    const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.COMMENTS, conditionfilter, null)
    const executable = new UpdateExecutable("database_update", CollectionNames.COMMENTS, filter, update, options).setOutput(true)
    return vault.registerScript(ScriptingNames.SCRIPT_DELETE_COMMENT, executable, condition, false).catch(error => {
        logger.error("Register delete comment scripting error: ", error)
        throw new Error(error);
    })
}

const installScriptToQueryCommentsByChannelId = (vault: hiveService): Promise<void> => {
    let conditionFilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did"
    }
    const executableFilter = {
        "channel_id": "$params.channel_id"
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }
    const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionFilter, null)
    const executable = new FindExecutable("find_message", CollectionNames.COMMENTS, executableFilter, options).setOutput(true)

    return vault.registerScript(ScriptingNames.SCRIPT_QUERY_COMMENT_BY_CHANNELID, executable, condition, false).catch(error => {
        logger.error("Register query comment by channel scripting error: ", error)
        throw new Error(error);
    })
}

const registerCreateLikeScripting = (vault: hiveService): Promise<void> => {
    let conditionfilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did"
    }
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
        "projection": {"_id": false}
    }

    const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionfilter, null)
    const executable = new InsertExecutable("database_insert", CollectionNames.LIKES, executablefilter, options).setOutput(true)
    return vault.registerScript(ScriptingNames.SCRIPT_CREATE_LIKE, executable, condition, false).catch(error => {
        logger.error("Register create like scripting error: ", error)
        throw error
    })
}

const registerQueryLikeByIdScripting = (vault: hiveService): Promise<void> => {
    let conditionFilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did",
    }
    const executableFilter = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
        "comment_id": "$params.comment_id",
        "status": "$params.status"
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }

    const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionFilter, null)
    const executable = new FindExecutable("find_message", CollectionNames.LIKES, executableFilter, options).setOutput(true)
    return vault.registerScript(ScriptingNames.SCRIPT_QUERY_LIKE_BY_ID, executable, condition, false).catch(error => {
        logger.error("Register query like by id scripting error: ", error)
        throw error
    })
}

const registerRemoveLikeScripting = (vault: hiveService): Promise<void> => {
    let conditionfilter = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
        "comment_id": "$params.comment_id",
        "creater_did": "$caller_did"
    }
    const filter = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
        "comment_id": "$params.comment_id"
    }
    const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.LIKES, conditionfilter, null)
    const executable = new DeleteExecutable("database_delete", CollectionNames.LIKES, filter).setOutput(true)
    return vault.registerScript(ScriptingNames.SCRIPT_REMOVE_LIKE, executable, condition, false).catch(error => {
        logger.error("Register remove like scripting error: ", error)
        throw error
    })
}

const registerQueryLikeByChannelScripting = (vault: hiveService): Promise<void> =>{
    let conditionFilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did",
    }
    const executableFilter = {
        "channel_id": "$params.channel_id",
        "status": "$params.status"
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }

    const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionFilter, null)
    const executable = new FindExecutable("find_message", CollectionNames.LIKES, executableFilter, options).setOutput(true)
    return vault.registerScript(ScriptingNames.SCRIPT_QUERY_LIKE_BY_CHANNEL, executable, condition, false).catch(error => {
        logger.error("Register query like by channel scripting error: ", error)
        throw error
    })
}

const registerQueryLikeByPostScripting = (vault: hiveService): Promise<void> => {
    let conditionFilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did",
    }
    const executableFilter = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
        "status": "$params.status"
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }

    const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionFilter, null)
    const executable = new FindExecutable("find_message", CollectionNames.LIKES, executableFilter, options).setOutput(true)
    return vault.registerScript(ScriptingNames.SCRIPT_QUERY_LIKE_BY_POST, executable, condition, false).catch(error => {
        logger.error("Register query like by post scripting error: ", error)
        throw error
    })
}

const registerUpdateLike = (vault: hiveService): Promise<void> => {
    const conditionfilter = {
        "like_id": "$params.like_id",
        "creater_did": "$caller_did",
    }
    let set = {
        "status": "$params.status",
        "updated_at": "$params.updated_at",
    }
    const filter = {
        "like_id": "$params.like_id",
    }
    let update = { "$set": set }
    let options = {
        "bypass_document_validation": false,
        "upsert": true
    }

    const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.LIKES, conditionfilter, null)
    const executable = new UpdateExecutable("database_update", CollectionNames.LIKES, filter, update, options).setOutput(true)
    return vault.registerScript(ScriptingNames.SCRIPT_UPDATE_LIKE, executable, condition, false).catch(error => {
        logger.error("Register update like error: ", error)
        throw error
    })
}

const registerQueryDisplayNameScripting = (vault: hiveService): Promise<void> => {
    const executableFilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$params.user_did"
    }
    let options = {
         "projection": { "_id": false },
         "limit": 100
    }

    const executable = new FindExecutable("find_message", CollectionNames.SUBSCRIPTION, executableFilter, options).setOutput(true)
    return vault.registerScript(ScriptingNames.SCRIPT_QUERY_USER_DISPLAYNAME, executable, null, false).catch(error => {
        logger.error("Register query display name scripting error: ", error)
        throw error
    })
}

const registerQueryCommentsFromPostsScripting = (vault: hiveService): Promise<void> => {
    let conditionFilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did",
    }
    const executableFilter = {
        "post_id": { "$in": "$params.post_ids" }
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }

    const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionFilter, null)
    const executable = new FindExecutable("find_message", CollectionNames.COMMENTS, executableFilter, options).setOutput(true)
    return vault.registerScript(ScriptingNames.QUERY_COMMENT_FROM_POSTS, executable, condition, false).catch(error => {
        logger.error("Register query comments from posts scripting error: ", error)
        throw error
    })
}

const registerQuerySelfLikeByIdScripting = (vault: hiveService): Promise<void> => {
    let conditionFilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did",
    }
    const executableFilter = {
        "like_id": "$params.like_id",
        "creater_did": "$caller_did",
        "status": "$params.status"
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }

    const condition = new QueryHasResultCondition("verify_user_permission", CollectionNames.SUBSCRIPTION, conditionFilter, null)
    const executable = new FindExecutable("find_message", CollectionNames.LIKES, executableFilter, options).setOutput(true)
    return vault.registerScript(ScriptingNames.QUERY_SELF_LIKE_BY_ID, executable, condition, false).catch(error => {
        logger.error("Register query self like byId scripting error: ", error)
        throw error
    })
}

const registerQueryPublicPostByIdScripting = (vault: hiveService): Promise<void> => {
    let postCondition = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
        "type": 'public'
    }
    let executablefilter = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
        "type": 'public'
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }

    let queryCondition = new QueryHasResultCondition("post_permission", CollectionNames.POSTS, postCondition, null)
    let findExe = new FindExecutable("find_message", CollectionNames.POSTS, executablefilter, options).setOutput(true)
    return vault.registerScript(ScriptingNames.QUERY_PUBLIC_SPECIFIED_POST, findExe, queryCondition, false, false).catch(error => {
        logger.error('Register query public post by id error: ', error)
        throw error
    })
}

const registerQueryPublicPostByChannelIdScripting = (vault: hiveService): Promise<void> => {
    let conditionfilter = {
        "channel_id": "$params.channel_id",
        "type": 'public'
    }
    let executablefilter = {
        "channel_id": "$params.channel_id",
        "type": 'public'
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }
    let queryCondition = new QueryHasResultCondition("channel_permission", CollectionNames.CHANNELS, conditionfilter, null)
    let findExe = new FindExecutable("find_message", CollectionNames.POSTS, executablefilter, options).setOutput(true)
    return vault.registerScript(ScriptingNames.QUERY_PUBLIC_POST_BY_CHANNEL, findExe, queryCondition, false, false).catch(error => {
        logger.error('Register query public post by channel error: ', error)
        throw error
    })
}

const registerQueryPublicPostRangeOfTimeScripting = (vault: hiveService): Promise<void> => {
    let conditionfilter = {
        "channel_id": "$params.channel_id",
        "type": 'public'
    }
    let executablefilter = {
        "channel_id": "$params.channel_id",
        "updated_at": {
             $gt: "$params.start",
             $lt: "$params.end"
        },
        "type": 'public'
    }
    let options = { "projection": { "_id": false }, "limit": 30, "sort": { "updated_at": -1 } }

    let queryCondition = new QueryHasResultCondition("channel_permission", CollectionNames.CHANNELS, conditionfilter, null)
    let findExe = new FindExecutable("find_message", CollectionNames.POSTS, executablefilter, options).setOutput(true)
    return vault.registerScript(ScriptingNames.QUERY_PUBLIC_SOMETIME_POST, findExe, queryCondition, false, false).catch(error => {
        logger.error("Register query public post range of time scripting error: ", error)
        throw error
    })
}

const registerQuerySubscriptionInfoByUserDIDAndChannelIdScripting = (vault: hiveService): Promise<void> => {
    const executableFilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$params.user_did"
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }

    const executable = new FindExecutable("find_message", CollectionNames.SUBSCRIPTION, executableFilter, options).setOutput(true)
    return vault.registerScript(ScriptingNames.SCRIPT_QUERY_SUBSCRIPTION_BY_USERDID_CHANNELID, executable, null, false).catch(error => {
        logger.error("Register query subscription info by userDid and channelId scripting error: ", error)
        throw error
    })
}
function resolve(arg0: string) {
    throw new Error('Function not implemented.')
}

