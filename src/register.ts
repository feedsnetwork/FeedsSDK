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

    private async setupOnVault() {
        return await Promise.all([
            this.installScripts(),
            this.createCollections()
        ]).then (_ => {
            console.log("Prepare everything on vault")
        }).catch( error => {
            throw new Error(error);
        })
    }

    private async installScripts() {
        return await Promise.all([
            // Channels
            installScriptToQueryChannelInfo(this.vault),
            installScriptToQueryProfileOwnedChannels(this.vault),
            installScriptToQueryChannelSubscribers(this.vault),
            installScriptToQueryPostsByEndTimeAndLimit(this.vault),

            // post related
            installScriptToQueryPostsByChannel(this.vault),
            installScriptToQueryPostsByRangeOfTime(this.vault),
            installScriptToQueryPostById(this.vault),

            // subscription related
            installScriptForSubscription(this.vault),
            installScriptToQuerySubscribersOfChannel(this.vault),
            installScriptToQuerySubscriptionsByUser(this.vault),
            installScriptForUnsubscription(this.vault),
            installScriptToUpdateSubscription(this.vault),

            // comment related.
            installScriptToComment(this.vault),
            installScriptToQueryCommentById(this.vault),
            installScriptToQueryCommentsByPost(this.vault),
            installScriptToUpdateComment(this.vault),
            installScriptToDeleteComment(this.vault),
            installScriptToQueryCommentsByChannel(this.vault),
            installScriptToQueryCommentsFromPosts(this.vault),
            installQueryCommentRangeOfTimeScripting(this.vault),
            installScriptToQueryCommentByEndTimeAndLimit(this.vault),

            //like related.
            installScriptToAddLike(this.vault),
            installScriptToRemoveLike(this.vault),
            installScriptToUpdateLike(this.vault),
            installScriptToQueryLikesByChannel(this.vault),
            installScriptToQueryLikesByPost(this.vault),
            installScriptToQueryLikesByComment(this.vault),
            installScriptToQueryMyLikes(this.vault),

            //DisplayName
            installScriptToQueryDisplayNameOfChannel(this.vault),

            //Published post
            installScriptToQueryPublishedPostById(this.vault),
            installScriptToQueryPublishedPostsByChannel(this.vault),
            installScriptToQueryPublishedPostsByRangeOfTime(this.vault),

            installScriptToQuerySubscriptionToChannelByDID(this.vault)
        ]).then(values => {
            logger.debug('Registe all scripting success: ', values)
        }).catch (error => {
            throw new Error(error)
        })
    }

    private async createCollections() {
        return await Promise.all([
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
        return installScriptToQueryChannelInfo(this.vault)
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

const createCollection = async (collectioName: string, vault: hiveService) => {
    return await vault.createCollection(collectioName);
}

const installScriptToQueryChannelInfo = async (vault: hiveService) => {
    let cfilter = {
        "channel_id": "$params.channel_id",
        "type": "public"
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }

    let executable = new FindExecutable("find_message", CollectionNames.CHANNELS,
        cfilter, options).setOutput(true);

    return await vault.registerScript(ScriptingNames.SCRIPT_QUERY_CHANNEL_INFO,
        executable, null, false).catch( error => {
        logger.error(`Failed to register script on vault to query channel information: ${error}`)
        throw new Error(error)
    })
}

// 新增开始
// query owned channel by profile. // 已过
const installScriptToQueryProfileOwnedChannels = async (vault: hiveService) => {
    let filter = {
        "type": "public"
    }
    let options = {
        "projection": { "_id": false },
        "sort": {"updated_at": -1 }
    }

    let executable = new FindExecutable("find_message", CollectionNames.CHANNELS,
        filter, options).setOutput(true)

    return await vault.registerScript(ScriptingNames.SCRIPT_PRIFILE_CHANNELS,
        executable, null, false, false).catch(error => {
        logger.error(`Failed to register script on vault to query owned channels: ${error}`)
        throw new Error(error);
    })
}

// 暂定 已过
const installScriptToQueryPostsByEndTimeAndLimit = async (vault: hiveService) => {
    let conditionfilter = {
        "channel_id": "$params.channel_id",
        // "user_did": "$caller_did"
    }
    let executablefilter = {
        "channel_id": "$params.channel_id",
        "updated_at": {
            $lt: "$params.end"
        }
    }
    let options = {
        "projection": { "_id": false },
        "limit": "$params.limit", 
        "sort": {
            "updated_at": -1
        }
    }

    let condition = new QueryHasResultCondition("verify_user_permission",
        CollectionNames.CHANNELS, conditionfilter, null)
    let executable = new FindExecutable("find_message", CollectionNames.POSTS,
        executablefilter, options).setOutput(true)

    return await vault.registerScript(ScriptingNames.SCRIPT_CHANNEL_POST_BY_END_TIME_AND_LIMIT,
        executable, condition, false, false).catch(error => {
        logger.error(`Failed to register script to query posts by start time and limit: ${error}`)
        throw new Error(error)
    })
}

// 待讨论
const installScriptToQueryChannelSubscribers = async (vault: hiveService) => {
    let options = {
        "projection": { "_id": false },
        "limit": "$params.limit", 
        "sort": {
            "updated_at": -1
        }
    }
    let executablefilter = {
        "channel_id": "$params.channel_id",
        "updated_at": {
            $lt: "$params.end"
        }
    }

    let findExecutable = new FindExecutable("find_message", CollectionNames.SUBSCRIPTION,
        executablefilter, options).setOutput(true)
    return await vault.registerScript(ScriptingNames.SCRIPT_CHANNEL_SUBSCRIBERS,
        findExecutable, null, false, false).catch(error => {
            logger.error("Register a script to query profile subscriptions error: ", error)
            throw new Error(error);
        })
}

// 待讨论
const installScriptToQueryCommentByEndTimeAndLimit = async (vault: hiveService) => {
    let executablefilter = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
        "updated_at": {
            $lt: "$params.end"
        }
    }
    let options = {
        "projection": { "_id": false },
        "limit": "$params.limit",
        "sort": {
            "updated_at": -1
        }
    }

    let executable = new FindExecutable("find_message", CollectionNames.COMMENTS,
        executablefilter, options).setOutput(true)

    return await vault.registerScript(ScriptingNames.SCRIPT_COMMENT_BY_END_TIME_AND_LIMIT,
        executable, null, false, false).catch(error => {
            logger.error(`Failed to register script to query posts by start time and limit: ${error}`)
            throw new Error(error)
        })
}

// 待讨论：feeds 中有实现，但是没有调用注册（等同于新增）, 添加了条件 "status": "$params.status"
const installQueryCommentRangeOfTimeScripting = async (vault: hiveService) => {
    let executablefilter =
    {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
        "updated_at": { $gt: "$params.start", $lt: "$params.end" },
        "status": "$params.status"
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100,
        "sort": { "updated_at": -1 }
    }
    let conditionfilter = {
        "channel_id": "$params.channel_id",
    }
    let queryCondition = new QueryHasResultCondition("verify_user_permission", CollectionNames.CHANNELS, conditionfilter, null)
    let findExe = new FindExecutable("find_message", CollectionNames.COMMENTS, executablefilter, options).setOutput(true)
    return vault.registerScript(ScriptingNames.SCRIPT_SOMETIME_COMMENT, findExe, queryCondition, false, false)
        .catch(error => {
            logger.error(`Install query comment range of time scripting error: ${error}`)
            throw new Error(error)
        })
}
// 新增结束

const installScriptToQueryPostsByChannel = async (vault: hiveService) => {
    let conditionfilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did"
    }
    let executablefilter = {
        "channel_id": "$params.channel_id"
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }

    let condition = new QueryHasResultCondition("verify_user_permission",
        CollectionNames.SUBSCRIPTION, conditionfilter, null)
    let executable = new FindExecutable("find_message", CollectionNames.POSTS,
        executablefilter, options).setOutput(true)

    return await vault.registerScript(ScriptingNames.SCRIPT_QUERY_POST_BY_CHANNEL,
        executable, condition, false, false).catch(error => {
            logger.error(`Failed to regsiter script to query Posts on specific channel: ${error}`)
            throw new Error(error)
        })
}

const installScriptToQueryPostsByRangeOfTime = async (vault: hiveService) => {
    let cfilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did"
    }
    let efilter = {
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

    let condition = new QueryHasResultCondition("verify_user_permission",
        CollectionNames.SUBSCRIPTION, cfilter, null)
    let executable = new FindExecutable("find_message",
        CollectionNames.POSTS, efilter, options).setOutput(true)


    return await vault.registerScript(ScriptingNames.SCRIPT_SOMETIME_POST, executable,
        condition, false, false).catch(error => {
        logger.error(`Failed to register script to query posts by range of time: ${error}`)
        throw error
    })
}

const installScriptToQueryPublishedPostById = async (vault: hiveService) => {
    let cfilter1 = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did"
    }
    let cfilter2 = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
        "type": "public"
    }
    let efilter = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id"
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }

    let condition = new AndCondition( "verify_user_permission", [
        new QueryHasResultCondition("subscription_permission", CollectionNames.SUBSCRIPTION, cfilter1, null),
        new QueryHasResultCondition("post_permission", CollectionNames.POSTS, cfilter2, null)
    ])
    let executable = new FindExecutable("find_message", CollectionNames.POSTS, efilter, options)
        .setOutput(true)

    return await vault.registerScript(ScriptingNames.SCRIPT_SPECIFIED_POST, executable,
        condition, false, false).catch(error => {
        logger.error(`Failed to register script to query specific post : ${error}`)
        throw new Error(error)
    })
}

const installScriptForSubscription = async (vault: hiveService) => {
    let cfilter = {
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
    let options = {
        "projectxsion": { "_id": false }
    }

    let condition = new QueryHasResultCondition("verify_user_permission",
        CollectionNames.CHANNELS, cfilter, null)
    let executable = new InsertExecutable("database_insert",
        CollectionNames.SUBSCRIPTION, document, options)

    return await vault.registerScript(ScriptingNames.SCRIPT_SUBSCRIBE_CHANNEL,
        executable, condition).catch(error => {
        logger.error(`Failed to register script for subscription to channel: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQuerySubscribersOfChannel = async (vault: hiveService) => {
    let efilter = {
        "channel_id": "$params.channel_id",
        "status": "$params.status"
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }

    let executable = new FindExecutable("find_message", CollectionNames.SUBSCRIPTION,
        efilter, options).setOutput(true)

    return await vault.registerScript(ScriptingNames.SCRIPT_QUERY_SUBSCRIPTION_BY_CHANNELID,
        executable, null, false).catch(error => {
        logger.error(`Failed to register script query subscribers of a channel: ${error}`)
        throw new Error(error);
    })
}

const installScriptToQuerySubscriptionsByUser = async (vault: hiveService) => {
    let efilter = {
        "user_did": "$params.user_did"
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }

    let executable = new FindExecutable("find_message", CollectionNames.SUBSCRIPTION,
        efilter, options).setOutput(true)

    return await vault.registerScript(ScriptingNames.SCRIPT_QUERY_SUBSCRIPTION_BY_USERDID,
        executable, null, false).catch(error => {
        logger.error(`Failed to regsiter script to query subscription by an user: ${error}`)
        throw new Error(error)
    })
}

const installScriptForUnsubscription = async (vault: hiveService) => {
    let filter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did"
    }
    let executable = new DeleteExecutable("database_delete", CollectionNames.SUBSCRIPTION, filter)

    return await vault.registerScript(ScriptingNames.SCRIPT_UNSUBSCRIBE_CHANNEL,
        executable, null).catch(error => {
        logger.error(`Failed to registery script to unsubscribe to a chennel: ${error}`)
        throw new Error(error)
    })
}

const installScriptToUpdateSubscription = async (vault: hiveService) => {
    let cfilter = {
        "channel_id": "$params.channel_id",
    }
    let set = {
        "status": "$params.status",
        "updated_at": "$params.updated_at",
    }
    let efilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did",
    }
    let update = { "$set": set }
    let options = {
        "bypass_document_validation": false,
        "upsert": true
    }

    let condition = new QueryHasResultCondition("verify_user_permission",
        CollectionNames.SUBSCRIPTION, cfilter, null)
    let executable = new UpdateExecutable("database_update",
        CollectionNames.SUBSCRIPTION, efilter, update, options).setOutput(true)

    return await vault.registerScript(ScriptingNames.SCRIPT_UPDATE_SUBSCRIPTION,
        executable, condition, false).catch(error => {
        logger.error(`Failed to register script to update subscription: ${error}`)
        throw new Error(error)
    })
}

const installScriptToComment = async (vault: hiveService) => {
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

    let condition = new QueryHasResultCondition("verify_user_permission",
        CollectionNames.SUBSCRIPTION, conditionfilter, null)
    let executable = new InsertExecutable("database_update",
        CollectionNames.COMMENTS, executablefilter, options).setOutput(true)

    return await vault.registerScript(ScriptingNames.SCRIPT_CREATE_COMMENT,
        executable, condition, false).catch(error => {
        logger.error(`Failed to register script to make comment: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQueryCommentById = async (vault: hiveService) => {
    let conditionFilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did"
    }
    let executableFilter = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
        "comment_id": "$params.comment_id"
    }
    let options = { "projection":
        { "_id": false }, "limit": 100
    }

    let condition = new QueryHasResultCondition("verify_user_permission",
        CollectionNames.SUBSCRIPTION, conditionFilter, null)
    let executable = new FindExecutable("find_message",
        CollectionNames.COMMENTS, executableFilter, options).setOutput(true)

    return await vault.registerScript(ScriptingNames.SCRIPT_QUERY_COMMENT_BY_COMMENTID,
        executable, condition, false).catch(error => {
        logger.error(`Failed to register script to query comment by Id: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQueryCommentsByPost = async (vault: hiveService) => {
    let conditionFilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did"
    }
    let executableFilter = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }

    let condition = new QueryHasResultCondition("verify_user_permission",
        CollectionNames.SUBSCRIPTION, conditionFilter, null)
    let executable = new FindExecutable("find_message",
        CollectionNames.COMMENTS, executableFilter, options).setOutput(true)

    return await vault.registerScript(ScriptingNames.SCRIPT_QUERY_COMMENT_BY_POSTID,
        executable, condition, false).catch(error => {
        logger.error(`Failed to register script to query comments related to a post: ${error}`)
        throw new Error(error)
    })
}

const installScriptToUpdateComment = async (vault: hiveService) => {
    let cfilter = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
        "comment_id": "$params.comment_id",
        "creater_did": "$caller_did"
    }
    let efilter = {
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

    let condition = new QueryHasResultCondition("verify_user_permission",
        CollectionNames.COMMENTS, cfilter, null)
    let executable = new UpdateExecutable("database_update",
        CollectionNames.COMMENTS, efilter, update, options).setOutput(true)

    return await vault.registerScript(ScriptingNames.SCRIPT_UPDATE_COMMENT, executable,
        condition, false).catch(error => {
        logger.error(`Failed to register script to update comment: ${error}`)
        throw new Error(error)
    })
}

const installScriptToDeleteComment = async (vault: hiveService) => {
    let cfilter = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
        "comment_id": "$params.comment_id",
        "creater_did": "$caller_did"
    }
    let efilter = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
        "comment_id": "$params.comment_id"
    }
    let set = { "status": 1, /* deleted */}
    let update = { "$set": set }
    let options = {
        "bypass_document_validation": false,
        "upsert": true
    }

    let condition = new QueryHasResultCondition("verify_user_permission",
        CollectionNames.COMMENTS, cfilter, null)
    let executable = new UpdateExecutable("database_update",
        CollectionNames.COMMENTS, efilter, update, options).setOutput(true)

    return await vault.registerScript(ScriptingNames.SCRIPT_DELETE_COMMENT, executable,
        condition, false).catch(error => {
        logger.error(`Failed to register script to delete a comment: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQueryCommentsByChannel = async (vault: hiveService) => {
    let cfilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did"
    }
    let efilter = {
        "channel_id": "$params.channel_id"
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }

    let condition = new QueryHasResultCondition("verify_user_permission",
        CollectionNames.SUBSCRIPTION, cfilter, null)
    let executable = new FindExecutable("find_message",
        CollectionNames.COMMENTS, efilter, options).setOutput(true)

    return await vault.registerScript(ScriptingNames.SCRIPT_QUERY_COMMENT_BY_CHANNELID,
        executable, condition, false).catch(error => {
        logger.error(`Failed to register script to query comments related to channel: ${error}`)
        throw new Error(error)
    })
}

const installScriptToAddLike = async (vault: hiveService) => {
    let cfilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did"
    }
    let efilter = {
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

    let condition = new QueryHasResultCondition("verify_user_permission",
        CollectionNames.SUBSCRIPTION, cfilter, null)
    let executable = new InsertExecutable("database_insert",
        CollectionNames.LIKES, efilter, options).setOutput(true)

    return await vault.registerScript(ScriptingNames.SCRIPT_CREATE_LIKE, executable,
        condition, false).catch(error => {
        logger.error(`Failed to register script to give like: ${error}`)
        throw new Error(error)
    })
}

const installScriptToRemoveLike = async (vault: hiveService) => {
    let cfilter = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
        "comment_id": "$params.comment_id",
        "creater_did": "$caller_did"
    }
    let efilter = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
        "comment_id": "$params.comment_id"
    }

    let condition = new QueryHasResultCondition("verify_user_permission",
        CollectionNames.LIKES, cfilter, null)
    let executable = new DeleteExecutable("database_delete",
        CollectionNames.LIKES, efilter).setOutput(true)

    return await vault.registerScript(ScriptingNames.SCRIPT_REMOVE_LIKE, executable,
        condition, false).catch(error => {
        logger.error(`Failed to register script to remove like: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQueryLikesByChannel = async (vault: hiveService) =>{
    let cfilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did",
    }
    let efilter = {
        "channel_id": "$params.channel_id",
        "status": "$params.status"
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }

    let condition = new QueryHasResultCondition("verify_user_permission",
        CollectionNames.SUBSCRIPTION, cfilter, null)
    let executable = new FindExecutable("find_message",
        CollectionNames.LIKES, efilter, options).setOutput(true)

    return await vault.registerScript(ScriptingNames.SCRIPT_QUERY_LIKE_BY_CHANNEL, executable,
        condition, false).catch(error => {
        logger.error(`Failed to register script to query likes related to a channel: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQueryLikesByPost = async (vault: hiveService) => {
    let cfilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did",
    }
    let efilter = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
        "status": "$params.status"
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }

    let condition = new QueryHasResultCondition("verify_user_permission",
        CollectionNames.SUBSCRIPTION, cfilter, null)
    let executable = new FindExecutable("find_message",
        CollectionNames.LIKES, efilter, options).setOutput(true)

    return await vault.registerScript(ScriptingNames.SCRIPT_QUERY_LIKE_BY_POST, executable,
        condition, false).catch(error => {
        logger.error(`Failed to register script to query likes related a post: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQueryLikesByComment = async (vault: hiveService) => {
    let cfilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did",
    }
    let efilter = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
        "comment_id": "$params.comment_id",
        "status": "$params.status"
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }

    let condition = new QueryHasResultCondition("verify_user_permission",
        CollectionNames.SUBSCRIPTION, cfilter, null)
    let executable = new FindExecutable("find_message",
        CollectionNames.LIKES, efilter, options).setOutput(true)

    return await vault.registerScript(ScriptingNames.SCRIPT_QUERY_LIKE_BY_ID, executable,
        condition, false).catch(error => {
        logger.error(`Failed to register script to query likes related to a comment: ${error}`)
        throw new Error(error)
    })
}

const installScriptToUpdateLike = async (vault: hiveService) => {
    let cfilter = {
        "like_id": "$params.like_id",
        "creater_did": "$caller_did",
    }
    let set = {
        "status": "$params.status",
        "updated_at": "$params.updated_at",
    }
    let efilter = {
        "like_id": "$params.like_id",
    }
    let update = { "$set": set }
    let options = {
        "bypass_document_validation": false,
        "upsert": true
    }

    let condition = new QueryHasResultCondition("verify_user_permission",
        CollectionNames.LIKES, cfilter, null)
    let executable = new UpdateExecutable("database_update",
        CollectionNames.LIKES, efilter, update, options).setOutput(true)

    return await vault.registerScript(ScriptingNames.SCRIPT_UPDATE_LIKE, executable,
        condition, false).catch(error => {
        logger.error(`Failed to register script to update a like: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQueryCommentsFromPosts = async (vault: hiveService) => {
    let cfilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did",
    }
    let efilter = {
        "post_id": { "$in": "$params.post_ids" }
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }

    let condition = new QueryHasResultCondition("verify_user_permission",
        CollectionNames.SUBSCRIPTION, cfilter, null)
    let executable = new FindExecutable("find_message",
        CollectionNames.COMMENTS, efilter, options).setOutput(true)

    return await vault.registerScript(ScriptingNames.QUERY_COMMENT_FROM_POSTS, executable,
        condition, false).catch(error => {
        logger.error(`Failed to register script to query comments from posts: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQueryMyLikes = async (vault: hiveService) => {
    let cfilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did",
    }
    let efilter = {
        "like_id": "$params.like_id",
        "creater_did": "$caller_did",
        "status": "$params.status"
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }

    let condition = new QueryHasResultCondition("verify_user_permission",
        CollectionNames.SUBSCRIPTION, cfilter, null)
    let executable = new FindExecutable("find_message",
        CollectionNames.LIKES, efilter, options).setOutput(true)

    return await vault.registerScript(ScriptingNames.QUERY_SELF_LIKE_BY_ID, executable,
        condition, false).catch(error => {
        logger.error(`Failed to register script to query my likes: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQueryDisplayNameOfChannel = async (vault: hiveService) => {
    let efilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$params.user_did"
    }
    let options = {
         "projection": { "_id": false },
         "limit": 100
    }

    let executable = new FindExecutable("find_message", CollectionNames.SUBSCRIPTION,
        efilter, options).setOutput(true)

    return await vault.registerScript(ScriptingNames.SCRIPT_QUERY_USER_DISPLAYNAME,
        executable, null, false).catch(error => {
        logger.error(`Failed to register script to query display name: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQueryPostById = async (vault: hiveService) => {
    let cfilter = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
        "type": 'public'
    }
    let efilter = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
        "type": 'public'
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }

    let condition = new QueryHasResultCondition("post_permission",CollectionNames.POSTS,
        cfilter, null)
    let executable = new FindExecutable("find_message", CollectionNames.POSTS,
        efilter, options).setOutput(true)

    return await vault.registerScript(ScriptingNames.QUERY_PUBLIC_SPECIFIED_POST, executable,
        condition, false, false).catch(error => {
        logger.error(`Failed to register script to query posts: ${error}`)
        throw error
    })
}

const installScriptToQueryPublishedPostsByChannel = async (vault: hiveService) => {
    let cfilter = {
        "channel_id": "$params.channel_id",
        "type": 'public'
    }
    let efilter = {
        "channel_id": "$params.channel_id",
        "type": 'public'
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }

    let condition = new QueryHasResultCondition("channel_permission",
        CollectionNames.CHANNELS, cfilter, null)
    let executable = new FindExecutable("find_message", CollectionNames.POSTS,
        efilter, options).setOutput(true)

    return await vault.registerScript(ScriptingNames.QUERY_PUBLIC_POST_BY_CHANNEL, executable,
        condition, false, false).catch(error => {

        logger.error(`Failed to register script to query published posts by channel: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQueryPublishedPostsByRangeOfTime = async (vault: hiveService) => {
    let cfilter = {
        "channel_id": "$params.channel_id",
        "type": 'public'
    }
    let efilter = {
        "channel_id": "$params.channel_id",
        "updated_at": {
             $gt: "$params.start",
             $lt: "$params.end"
        },
        "type": 'public'
    }
    let options = {
        "projection": { "_id": false },
        "limit": 30,
        "sort": { "updated_at": -1 }
    }

    let condition = new QueryHasResultCondition("channel_permission",
        CollectionNames.CHANNELS, cfilter, null)
    let executable = new FindExecutable("find_message",
        CollectionNames.POSTS, efilter, options).setOutput(true)

    return await vault.registerScript(ScriptingNames.QUERY_PUBLIC_SOMETIME_POST,
        executable, condition, false, false).catch(error => {

        logger.error(`Failed to regsiter script to query published posts by range of time : ${error}`)
        throw new Error(error)
    })
}

const installScriptToQuerySubscriptionToChannelByDID = async (vault: hiveService) => {
    const efilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$params.user_did"
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }

    let executable = new FindExecutable("find_message", CollectionNames.SUBSCRIPTION,
        efilter, options).setOutput(true)

    return await vault.registerScript(ScriptingNames.SCRIPT_QUERY_SUBSCRIPTION_BY_USERDID_CHANNELID,
        executable, null, false).catch(error => {

        logger.error(`Failed to query subscription on specific channel by user DID: ${error}`)
        throw new Error(error)
    })
}
function resolve(arg0: string) {
    throw new Error('Function not implemented.')
}
