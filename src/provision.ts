import { Logger } from './utils/logger'
import { ScriptingNames, CollectionNames, FeedsLocalScriptVersion } from './vault/constants'
import { UpdateOptions, UpdateExecutable, FindExecutable, QueryHasResultCondition, AndCondition, InsertExecutable, DeleteExecutable,  Vault } from "@elastosfoundation/hive-js-sdk"
import { JSONObject } from '@elastosfoundation/did-js-sdk'

const logger = new Logger("provision")

// isForce TODO:
const prepreFeedsVault = async(vault: Vault, userDid: string, forced: boolean) => {
    let remoteVersion = ''
    let cachedVersion = ''
    let key = userDid + "-scriptVersion"

    cachedVersion = localStorage.getItem(key)
    if (cachedVersion == "") {
        if (!forced)
            return

        let version = await queryRemoteFeedsScriptingVersion(vault)
        remoteVersion = version[0]["laster_version"] as string
    } else if (cachedVersion == FeedsLocalScriptVersion) {
        return
    }

    if (remoteVersion !== FeedsLocalScriptVersion) {
        await setupScriptingAndCollection(vault)
        remoteVersion = FeedsLocalScriptVersion
        cachedVersion = remoteVersion
        //update
        await updateRemoteFeedsScriptingVersion(vault, remoteVersion)
        localStorage.setItem(key, cachedVersion)
    } else {
        if (cachedVersion === '') {
            cachedVersion = FeedsLocalScriptVersion
            localStorage.setItem(key, cachedVersion)
        }
    }
}

const updateRemoteFeedsScriptingVersion = async (vault: Vault, lasterVersion: string) => {
    await vault.getDatabaseService().updateOne(
        CollectionNames.FEEDS_SCRIPTING,
        {},
        { "$set": {
            "laster_version": lasterVersion }
        },
        new UpdateOptions(false, true)
    ).catch(error => {
        logger.error("update remote feeds scripting version error: ", error)
        throw error
    })
}

const queryRemoteFeedsScriptingVersion = async (vault: Vault): Promise<JSONObject[]> => {
    return await vault.getDatabaseService().findMany(
        CollectionNames.FEEDS_SCRIPTING,
        {}
    ).catch(error => {
        logger.error("query remote feeds scripting version error: ", error)
        throw error
    })
}

const setupScriptingAndCollection = async (vault: Vault) => {
    await Promise.all([
        // Channels
        installScriptToQueryChannelInfo(vault),
        installScriptToQueryOwnedChannels(vault),
        installScriptToQueryChannelSubscribers(vault),
        installScriptToQueryPostsByEndTimeAndLimit(vault),

        // post related
        installScriptToQueryPostsByChannel(vault),
        installScriptToQueryPostsByRangeOfTime(vault),
        installScriptToQueryPostById(vault),

        // subscription related
        installScriptForSubscription(vault),
        installScriptToQuerySubscribersOfChannel(vault),
        installScriptToQuerySubscriptionsOfUser(vault),
        installScriptForUnsubscription(vault),
        installScriptToUpdateSubscription(vault),

        // comment related.
        installScriptToComment(vault),
        installScriptToQueryCommentById(vault),
        installScriptToQueryCommentsByPost(vault),
        installScriptToUpdateComment(vault),
        installScriptToDeleteComment(vault),
        installScriptToQueryCommentsByChannel(vault),
        installScriptToQueryCommentsFromPosts(vault),
        installQueryCommentRangeOfTimeScripting(vault),
        installScriptToQueryCommentByEndTimeAndLimit(vault),

        //like related.
        installScriptToAddLike(vault),
        installScriptToRemoveLike(vault),
        installScriptToUpdateLike(vault),
        installScriptToQueryLikesByChannel(vault),
        installScriptToQueryLikesByPost(vault),
        installScriptToQueryLikesByComment(vault),
        installScriptToQueryMyLikes(vault),

        //DisplayName
        installScriptToQueryDisplayNameOfChannel(vault),

        //Published post
        installScriptToQueryPublishedPostById(vault),
        installScriptToQueryPublishedPostsByChannel(vault),
        installScriptToQueryPublishedPostsByRangeOfTime(vault),
        installScriptToQuerySubscriptionToChannelByDID(vault),
    ]).then(() => {
        logger.debug('Install scripts for feeds channel in success: ')
    }).catch (error => {
        logger.debug(`Install scripts for feeds channel failed: ${error}`)
        throw new Error(error)
    })

    await Promise.all([
        createCollection(vault, CollectionNames.FEEDS_SCRIPTING),
        createCollection(vault, CollectionNames.CHANNELS),
        createCollection(vault, CollectionNames.POSTS),
        createCollection(vault, CollectionNames.SUBSCRIPTION),
        createCollection(vault, CollectionNames.COMMENTS),
        createCollection(vault, CollectionNames.LIKES),
        createCollection(vault, CollectionNames.BACKUP_SUBSCRIBEDCHANNELS)
    ]).then(() => {
        logger.debug('Create all collections in success: ')
    }).catch(error => {
        logger.error('Create all collections for Feeds failed: ', error)
        throw new Error(error)
    })
}

const createCollection = async (vault: Vault, collectioName: string,) => {
    await vault.getDatabaseService().createCollection(collectioName).catch(error => {
        if (error.message === "Already exists") {
            // ignore
        } else {
            throw new Error(error);
        }
    })
}

const installScriptToQueryChannelInfo = async (vault: Vault) => {
    let filter = {
        "channel_id": "$params.channel_id",
        "type": "public"
    }
    let options = {
        "projection": {
            "_id": false
        },
        "limit": 100
    }

    let executable = new FindExecutable("find_message",
        CollectionNames.CHANNELS,
        filter,
        options
    ).setOutput(true);

    await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_QUERY_CHANNEL_INFO,
        executable,
        null,
        false
    ).catch( error => {
        logger.error(`installScriptToQueryChannelInfo failed: ${error}`)
        throw new Error(error)
    })
}

// 新增开始
// query owned channel by profile. // 已过
const installScriptToQueryOwnedChannels = async (vault: Vault) => {
    let filter = {
        "type": "public"
    }
    let options = {
        "projection": { "_id": false },
        "sort": {"updated_at": -1 }
    }

    let executable = new FindExecutable("find_message",
        CollectionNames.CHANNELS,
        filter,
        options
    ).setOutput(true)

    await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_PRIFILE_CHANNELS,
        executable,
        null,
        false,
        false
    ).catch(error => {
        logger.error(`installScriptToQueryOwnedChannels failed: ${error}`)
        throw new Error(error);
    })
}

// 待讨论
const installScriptToQueryChannelSubscribers = async (vault: Vault) => {
    let options = {
        "projection": { "_id": false },
        "limit": "$params.limit",
        "sort": {
            "updated_at": -1
        }
    }
    let filter = {
        "channel_id": "$params.channel_id",
        "updated_at": {
            $lt: "$params.end"
        }
    }

    let executable = new FindExecutable("find_message",
        CollectionNames.SUBSCRIPTION,
        filter,
        options
    ).setOutput(true)

    await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_CHANNEL_SUBSCRIBERS,
        executable,
        null,
        false,
        false
    ).catch(error => {
        logger.error("installScriptToQueryChannelSubscribers failed: ", error)
        throw new Error(error);
    })
}

// 暂定 已过
const installScriptToQueryPostsByEndTimeAndLimit = async (vault: Vault) => {
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
        CollectionNames.CHANNELS,
        conditionfilter, null
    )
    let executable = new FindExecutable("find_message",
        CollectionNames.POSTS,
        executablefilter,
        options
    ).setOutput(true)

    await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_CHANNEL_POST_BY_END_TIME_AND_LIMIT,
        executable,
        condition,
        false,
        false
    ).catch(error => {
        logger.error(`installScriptToQueryPostsByEndTimeAndLimit failed: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQueryPostsByChannel = async (vault: Vault) => {
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
        CollectionNames.SUBSCRIPTION,
        conditionfilter,
        null
    )
    let executable = new FindExecutable("find_message",
        CollectionNames.POSTS,
        executablefilter,
        options
    ).setOutput(true)

    await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_QUERY_POST_BY_CHANNEL,
        executable,
        condition,
        false,
        false
    ).catch(error => {
        logger.error(`installScriptToQueryPostsByChannel failed: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQueryPostsByRangeOfTime = async (vault: Vault) => {
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
        CollectionNames.SUBSCRIPTION,
        cfilter,
        null
    )
    let executable = new FindExecutable("find_message",
        CollectionNames.POSTS,
        efilter,
        options
    ).setOutput(true)

    await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_SOMETIME_POST,
        executable,
        condition,
        false,
        false
    ).catch(error => {
        logger.error(`installScriptToQueryPostsByRangeOfTime failed: ${error}`)
        throw error
    })
}

const installScriptToQueryPostById = async (vault: Vault) => {
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

    let condition = new QueryHasResultCondition("post_permission",
        CollectionNames.POSTS,
        cfilter,
        null
    )
    let executable = new FindExecutable("find_message",
        CollectionNames.POSTS,
        efilter,
        options
    ).setOutput(true)

    await vault.getScriptingService().registerScript(
        ScriptingNames.QUERY_PUBLIC_SPECIFIED_POST,
        executable,
        condition,
        false,
        false
    ).catch(error => {
        logger.error(`installScriptToQueryPostById failed: ${error}`)
        throw error
    })
}

// 待讨论
const installScriptToQueryCommentByEndTimeAndLimit = async (vault: Vault) => {
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

    let executable = new FindExecutable("find_message",
        CollectionNames.COMMENTS,
        executablefilter,
        options
    ).setOutput(true)

    await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_COMMENT_BY_END_TIME_AND_LIMIT,
        executable,
        null,
        false,
        false
    ).catch(error => {
        logger.error(`installScriptToQueryCommentByEndTimeAndLimit failed: ${error}`)
        throw new Error(error)
    })
}

// 新增结束
const installQueryCommentRangeOfTimeScripting = async (vault: Vault) => {
    let executablefilter = {
        "channel_id": "$params.channel_id",
        "post_id": "$params.post_id",
        "updated_at": { $gt: "$params.start", $lt: "$params.end" }
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100,
        "sort": { "updated_at": -1 }
    }
    let conditionfilter = {
        "channel_id": "$params.channel_id",
    }
    let queryCondition = new QueryHasResultCondition("verify_user_permission",
        CollectionNames.CHANNELS,
        conditionfilter,
        null
    )
    let executable = new FindExecutable("find_message",
        CollectionNames.COMMENTS,
        executablefilter,
        options
    ).setOutput(true)

    await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_SOMETIME_COMMENT,
        executable,
        queryCondition,
        false,
        false
    ).catch(error => {
        logger.error(`installQueryCommentRangeOfTimeScripting failed: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQueryPublishedPostById = async (vault: Vault) => {
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
        new QueryHasResultCondition("subscription_permission",
            CollectionNames.SUBSCRIPTION,
            cfilter1,
            null
        ),
        new QueryHasResultCondition("post_permission",
            CollectionNames.POSTS,
            cfilter2,
            null
        )
    ])
    let executable = new FindExecutable("find_message",
        CollectionNames.POSTS,
        efilter,
        options
    ).setOutput(true)

    await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_SPECIFIED_POST,
        executable,
        condition,
        false,
        false
    ).catch(error => {
        logger.error(`installScriptToQueryPublishedPostById : ${error}`)
        throw new Error(error)
    })
}

const installScriptForSubscription = async (vault: Vault) => {
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
        CollectionNames.CHANNELS,
        cfilter,
        null
    )
    let executable = new InsertExecutable("database_insert",
        CollectionNames.SUBSCRIPTION,
        document,
        options
    )

    await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_SUBSCRIBE_CHANNEL,
        executable,
        condition
    ).catch(error => {
        logger.error(`installScriptForSubscription failed: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQuerySubscribersOfChannel = async (vault: Vault) => {
    let efilter = {
        "channel_id": "$params.channel_id",
        "status": "$params.status"
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }

    let executable = new FindExecutable("find_message",
        CollectionNames.SUBSCRIPTION,
        efilter,
        options
    ).setOutput(true)

    await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_QUERY_SUBSCRIPTION_BY_CHANNELID,
        executable,
        null,
        false
    ).catch(error => {
        logger.error(`installScriptToQuerySubscribersOfChannel failed: ${error}`)
        throw new Error(error);
    })
}

const installScriptToQuerySubscriptionsOfUser = async (vault: Vault) => {
    let efilter = {
        "user_did": "$params.user_did"
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }
    let executable = new FindExecutable("find_message",
        CollectionNames.SUBSCRIPTION,
        efilter,
        options
    ).setOutput(true)

    await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_QUERY_SUBSCRIPTION_BY_USERDID,
        executable,
        null,
        false
    ).catch(error => {
        logger.error(`installScriptToQuerySubscriptionsOfUser failed: ${error}`)
        throw new Error(error)
    })
}

const installScriptForUnsubscription = async (vault: Vault) => {
    let filter = {
        "channel_id": "$params.channel_id",
        "user_did": "$caller_did"
    }
    let executable = new DeleteExecutable("database_delete",
        CollectionNames.SUBSCRIPTION,
        filter
    )

    await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_UNSUBSCRIBE_CHANNEL,
        executable,
        null
    ).catch(error => {
        logger.error(`installScriptForUnsubscription failed: ${error}`)
        throw new Error(error)
    })
}

const installScriptToUpdateSubscription = async (vault: Vault) => {
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
        CollectionNames.SUBSCRIPTION,
        cfilter,
        null
    )
    let executable = new UpdateExecutable("database_update",
        CollectionNames.SUBSCRIPTION,
        efilter,
        update,
        options
    ).setOutput(true)

    await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_UPDATE_SUBSCRIPTION,
        executable,
        condition,
        false
    ).catch(error => {
        logger.error(`installScriptToUpdateSubscription failed: ${error}`)
        throw new Error(error)
    })
}

const installScriptToComment = async (vault: Vault) => {
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
        CollectionNames.SUBSCRIPTION,
        conditionfilter,
        null
    )
    let executable = new InsertExecutable("database_update",
        CollectionNames.COMMENTS,
        executablefilter,
        options
    ).setOutput(true)

    return await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_CREATE_COMMENT,
        executable,
        condition,
        false
    ).catch(error => {
        logger.error(`installScriptToComment failed: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQueryCommentById = async (vault: Vault) => {
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
        CollectionNames.SUBSCRIPTION,
        conditionFilter,
        null
    )
    let executable = new FindExecutable("find_message",
        CollectionNames.COMMENTS,
        executableFilter,
        options
    ).setOutput(true)

    await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_QUERY_COMMENT_BY_COMMENTID,
        executable,
        condition,
        false
    ).catch(error => {
        logger.error(`installScriptToQueryCommentById failed: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQueryCommentsByPost = async (vault: Vault) => {
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
        CollectionNames.SUBSCRIPTION,
        conditionFilter,
        null
    )
    let executable = new FindExecutable("find_message",
        CollectionNames.COMMENTS,
        executableFilter,
        options
    ).setOutput(true)

    await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_QUERY_COMMENT_BY_POSTID,
        executable,
        condition,
        false
    ).catch(error => {
        logger.error(`installScriptToQueryCommentsByPost failed: ${error}`)
        throw new Error(error)
    })
}

const installScriptToUpdateComment = async (vault: Vault) => {
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
        CollectionNames.COMMENTS,
        cfilter,
        null
    )
    let executable = new UpdateExecutable("database_update",
        CollectionNames.COMMENTS,
        efilter,
        update,
        options
    ).setOutput(true)

    await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_UPDATE_COMMENT, executable,
        condition,
        false
    ).catch(error => {
        logger.error(`installScriptToUpdateComment failed: ${error}`)
        throw new Error(error)
    })
}

const installScriptToDeleteComment = async (vault: Vault) => {
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
        CollectionNames.COMMENTS,
        cfilter,
        null
    )
    let executable = new UpdateExecutable("database_update",
        CollectionNames.COMMENTS,
        efilter,
        update,
        options
    ).setOutput(true)

    await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_DELETE_COMMENT,
        executable,
        condition,
        false
    ).catch(error => {
        logger.error(`installScriptToDeleteComment failed: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQueryCommentsByChannel = async (vault: Vault) => {
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
        CollectionNames.SUBSCRIPTION,
        cfilter,
        null
    )
    let executable = new FindExecutable("find_message",
        CollectionNames.COMMENTS,
        efilter,
        options
    ).setOutput(true)

    return await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_QUERY_COMMENT_BY_CHANNELID,
        executable,
        condition,
        false
    ).catch(error => {
        logger.error(`installScriptToQueryCommentsByChannel failed: ${error}`)
        throw new Error(error)
    })
}

const installScriptToAddLike = async (vault: Vault) => {
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
        CollectionNames.SUBSCRIPTION,
        cfilter,
        null
    )
    let executable = new InsertExecutable("database_insert",
        CollectionNames.LIKES,
        efilter,
        options
    ).setOutput(true)

    return await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_CREATE_LIKE,
        executable,
        condition,
        false
    ).catch(error => {
        logger.error(`installScriptToAddLike failed: ${error}`)
        throw new Error(error)
    })
}

const installScriptToRemoveLike = async (vault: Vault) => {
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
        CollectionNames.LIKES,
        cfilter,
        null
    )
    let executable = new DeleteExecutable("database_delete",
        CollectionNames.LIKES,
        efilter
    ).setOutput(true)

    return await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_REMOVE_LIKE,
        executable,
        condition,
        false
    ).catch(error => {
        logger.error(`installScriptToRemoveLike failed: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQueryLikesByChannel = async (vault: Vault) =>{
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
        CollectionNames.SUBSCRIPTION,
        cfilter,
        null
    )
    let executable = new FindExecutable("find_message",
        CollectionNames.LIKES,
        efilter,
        options
    ).setOutput(true)

    return await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_QUERY_LIKE_BY_CHANNEL,
        executable,
        condition,
        false
    ).catch(error => {
        logger.error(`installScriptToQueryLikesByChannel failed: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQueryLikesByPost = async (vault: Vault) => {
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
        CollectionNames.SUBSCRIPTION,
        cfilter,
        null
    )
    let executable = new FindExecutable("find_message",
        CollectionNames.LIKES,
        efilter,
        options
    ).setOutput(true)

    await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_QUERY_LIKE_BY_POST,
        executable,
        condition,
        false
    ).catch(error => {
        logger.error(`installScriptToQueryLikesByPost failed: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQueryLikesByComment = async (vault: Vault) => {
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
        CollectionNames.SUBSCRIPTION,
        cfilter,
        null
    )
    let executable = new FindExecutable("find_message",
        CollectionNames.LIKES,
        efilter,
        options
    ).setOutput(true)

    await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_QUERY_LIKE_BY_ID,
        executable,
        condition,
        false
    ).catch(error => {
        logger.error(`installScriptToQueryLikesByComment failed: ${error}`)
        throw new Error(error)
    })
}

const installScriptToUpdateLike = async (vault: Vault) => {
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
        CollectionNames.LIKES,
        cfilter,
        null
    )
    let executable = new UpdateExecutable("database_update",
        CollectionNames.LIKES,
        efilter,
        update,
        options
    ).setOutput(true)

    await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_UPDATE_LIKE,
        executable,
        condition,
        false
    ).catch(error => {
        logger.error(`installScriptToUpdateLike failed: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQueryCommentsFromPosts = async (vault: Vault) => {
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
        CollectionNames.SUBSCRIPTION,
        cfilter,
        null
    )
    let executable = new FindExecutable("find_message",
        CollectionNames.COMMENTS,
        efilter,
        options
    ).setOutput(true)

    await vault.getScriptingService().registerScript(
        ScriptingNames.QUERY_COMMENT_FROM_POSTS,
        executable,
        condition,
        false
    ).catch(error => {
        logger.error(`installScriptToQueryCommentsFromPosts failed: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQueryMyLikes = async (vault: Vault) => {
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
        CollectionNames.SUBSCRIPTION,
        cfilter,
        null
    )
    let executable = new FindExecutable("find_message",
        CollectionNames.LIKES,
        efilter,
        options
    ).setOutput(true)

    await vault.getScriptingService().registerScript(
        ScriptingNames.QUERY_SELF_LIKE_BY_ID,
        executable,
        condition,
        false
    ).catch(error => {
        logger.error(`installScriptToQueryMyLikes failed: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQueryDisplayNameOfChannel = async (vault: Vault) => {
    let efilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$params.user_did"
    }
    let options = {
         "projection": { "_id": false },
         "limit": 100
    }

    let executable = new FindExecutable("find_message",
        CollectionNames.SUBSCRIPTION,
        efilter,
        options
    ).setOutput(true)

    await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_QUERY_USER_DISPLAYNAME,
        executable,
        null,
        false
    ).catch(error => {
        logger.error(`installScriptToQueryDisplayNameOfChannel failed: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQueryPublishedPostsByChannel = async (vault: Vault) => {
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
        CollectionNames.CHANNELS,
        cfilter,
        null
    )
    let executable = new FindExecutable("find_message",
        CollectionNames.POSTS,
        efilter,
        options
    ).setOutput(true)

    await vault.getScriptingService().registerScript(
        ScriptingNames.QUERY_PUBLIC_POST_BY_CHANNEL,
        executable,
        condition,
        false,
        false
    ).catch(error => {
        logger.error(`installScriptToQueryPublishedPostsByChannel failed: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQueryPublishedPostsByRangeOfTime = async (vault: Vault) => {
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
        CollectionNames.CHANNELS,
        cfilter,
        null
    )
    let executable = new FindExecutable("find_message",
        CollectionNames.POSTS,
        efilter,
        options
    ).setOutput(true)

    await vault.getScriptingService().registerScript(ScriptingNames.QUERY_PUBLIC_SOMETIME_POST,
        executable,
        condition,
        false,
        false
    ).catch(error => {
        logger.error(`installScriptToQueryPublishedPostsByRangeOfTime failled: ${error}`)
        throw new Error(error)
    })
}

const installScriptToQuerySubscriptionToChannelByDID = async (vault: Vault) => {
    const efilter = {
        "channel_id": "$params.channel_id",
        "user_did": "$params.user_did"
    }
    let options = {
        "projection": { "_id": false },
        "limit": 100
    }

    let executable = new FindExecutable("find_message",
        CollectionNames.SUBSCRIPTION,
        efilter,
        options
    ).setOutput(true)

    await vault.getScriptingService().registerScript(
        ScriptingNames.SCRIPT_QUERY_SUBSCRIPTION_BY_USERDID_CHANNELID,
        executable,
        null,
        false
    ).catch(error => {
        logger.error(`installScriptToQuerySubscriptionToChannelByDID failed: ${error}`)
        throw new Error(error)
    })
}

export {
    prepreFeedsVault
}
