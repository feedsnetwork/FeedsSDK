class CollectionNames {
    static readonly FEEDS_SCRIPTING = "feeds_scripting"

    static readonly CHANNELS  = "channels"
    static readonly POSTS     = "posts"
    static readonly COMMENTS  = "comments"
    static readonly LIKES     = "likes"
    static readonly SUBSCRIPTION = "subscriptions"
    static readonly BACKUP_SUBSCRIBEDCHANNELS="backup_subscribed_channel"
}

class ScriptingNames {

    static readonly SCRIPT_PRIFILE_SUBSCRIPTIONS = "script_query_profile_subscriptions"
    static readonly SCRIPT_PRIFILE_CHANNEL_BY_CHANNEL_ID = "script_query_profile_channels_by_channel_id"
    static readonly SCRIPT_PRIFILE_CHANNELS = "script_query_profile_channels_by_targetdid"

    static readonly QUERY_SELF_LIKE_BY_ID = "script_query_self_like_by_id"

    static readonly QUERY_COMMENT_FROM_POSTS = "script_query_comment_from_posts"
    static readonly QUERY_COMMENT_COUNTS = "script_query_comment_counts"

    //public
    static readonly QUERY_PUBLIC_SPECIFIED_POST = "query_public_specified_post"
    static readonly QUERY_PUBLIC_SOMETIME_POST = "query_public_sometime_post"
    static readonly QUERY_PUBLIC_POST_BY_CHANNEL = "query_public_post_by_channel"

    static readonly SCRIPT_SPECIFIED_POST = "script_specified_post_name"
    static readonly SCRIPT_SOMETIME_POST = "script_sometime_post_name"
    static readonly SCRIPT_CHANNEL = "script_channel_name"
    static readonly SCRIPT_COMMENT = "script_comment_name"
    static readonly SCRIPT_SUBSCRIPTION = "script_subscriptions_name"

    static readonly SCRIPT_QUERY_POST_BY_CHANNEL = "script_query_post_by_channel"//all
    static readonly SCRIPT_QUERY_CHANNEL_INFO = "script_query_channel_info"

    static readonly SCRIPT_SUBSCRIBE_CHANNEL = "script_subscribe_channel"
    static readonly SCRIPT_UNSUBSCRIBE_CHANNEL = "script_unsubscribe_channel"
    static readonly SCRIPT_QUERY_SUBSCRIPTION_BY_CHANNELID = "script_query_subscription_by_channelid"
    static readonly SCRIPT_QUERY_SUBSCRIPTION_BY_USERDID = "script_query_subscription_by_userdid"
    static readonly SCRIPT_QUERY_SUBSCRIPTION_BY_USERDID_CHANNELID = "script_query_subscription_by_userdid_channelid"
    static readonly SCRIPT_UPDATE_SUBSCRIPTION = "script_update_subscription"

    static readonly SCRIPT_CREATE_COMMENT = "script_create_comment"
    static readonly SCRIPT_UPDATE_COMMENT = "script_update_comment"
    static readonly SCRIPT_QUERY_COMMENT = "script_query_comment"
    static readonly SCRIPT_DELETE_COMMENT = "script_delete_comment"
    static readonly SCRIPT_QUERY_COMMENT_BY_POSTID = "script_query_comment_by_postid"
    static readonly SCRIPT_QUERY_COMMENT_BY_COMMENTID = "script_query_comment_by_commentid"
    static readonly SCRIPT_QUERY_COMMENT_BY_CHANNELID = "script_query_comment_by_channelid"
    static readonly SCRIPT_SOMETIME_COMMENT = "script_sometime_comment"

    static readonly SCRIPT_CREATE_LIKE = "script_add_like"
    static readonly SCRIPT_REMOVE_LIKE = "script_remove_like"
    static readonly SCRIPT_QUERY_LIKE_BY_ID = "script_query_like_by_id"
    static readonly SCRIPT_QUERY_LIKE_BY_POST = "script_query_like_by_post"
    static readonly SCRIPT_QUERY_LIKE_BY_CHANNEL = "script_query_like_by_channel"
    static readonly SCRIPT_QUERY_USER_DISPLAYNAME = "script_query_user_displayname"
    static readonly SCRIPT_UPDATE_LIKE = "script_update_like"
    static readonly SCRIPT_SOMETIME_LIKE = "script_sometime_like"
}

export {
    CollectionNames,
    ScriptingNames
}

export const FeedsLocalScriptVersion = '1.0.3'
