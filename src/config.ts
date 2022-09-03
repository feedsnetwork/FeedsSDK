export class config {
  // namespace('gu.config')
  static TABLE_FEEDS_SCRIPTING = "feeds_scripting" // 存储feeds信息：版本号等

  static TABLE_CHANNELS = "channels" // 存储所有的channle 信息，已订阅者可以访问，仅自己写入
  static TABLE_POSTS = "posts" // 存储所有的post: 已订阅者可以访问，仅自己写入
  static TABLE_SUBSCRIPTIONS = "subscriptions" // 存储所有的订阅者的信息，订阅者可写入
  static TABLE_COMMENTS = "comments" // 存储所有的评论， 订阅者可写入
  static TABLE_LIKES = "likes" // 存储所有的like，订阅者可写入
  static TABLE_BACKUP_SUBSCRIBEDCHANNEL = "backup_subscribed_channel" // 存储备份，仅自己写入

  static SCRIPT_SPECIFIED_POST = "script_specified_post_name"
  static SCRIPT_SOMETIME_POST = "script_sometime_post_name"
  static SCRIPT_CHANNEL = "script_channel_name"
  static SCRIPT_COMMENT = "script_comment_name"
  static SCRIPT_SUBSCRIPTION = "script_subscriptions_name"

  static SCRIPT_QUERY_POST_BY_CHANNEL = "script_query_post_by_channel"//all
  static SCRIPT_QUERY_CHANNEL_INFO = "script_query_channel_info"

  static SCRIPT_SUBSCRIBE_CHANNEL = "script_subscribe_channel"
  static SCRIPT_UNSUBSCRIBE_CHANNEL = "script_unsubscribe_channel"
  static SCRIPT_QUERY_SUBSCRIPTION_BY_CHANNELID = "script_query_subscription_by_channelid"
  static SCRIPT_QUERY_SUBSCRIPTION_BY_USERDID = "script_query_subscription_by_userdid"
  static SCRIPT_QUERY_SUBSCRIPTION_BY_USERDID_CHANNELID = "script_query_subscription_by_userdid_channelid"
  static SCRIPT_UPDATE_SUBSCRIPTION = "script_update_subscription"

  static SCRIPT_CREATE_COMMENT = "script_create_comment"
  static SCRIPT_UPDATE_COMMENT = "script_update_comment"
  static SCRIPT_QUERY_COMMENT = "script_query_comment"
  static SCRIPT_DELETE_COMMENT = "script_delete_comment"
  static SCRIPT_QUERY_COMMENT_BY_POSTID = "script_query_comment_by_postid"
  static SCRIPT_QUERY_COMMENT_BY_COMMENTID = "script_query_comment_by_commentid"
  static SCRIPT_QUERY_COMMENT_BY_CHANNELID = "script_query_comment_by_channelid"
  static SCRIPT_SOMETIME_COMMENT = "script_sometime_comment"

  static SCRIPT_CREATE_LIKE = "script_add_like"
  static SCRIPT_REMOVE_LIKE = "script_remove_like"
  static SCRIPT_QUERY_LIKE_BY_ID = "script_query_like_by_id"
  static SCRIPT_QUERY_LIKE_BY_POST = "script_query_like_by_post"
  static SCRIPT_QUERY_LIKE_BY_CHANNEL = "script_query_like_by_channel"
  static SCRIPT_QUERY_USER_DISPLAYNAME = "script_query_user_displayname"
  static SCRIPT_UPDATE_LIKE = "script_update_like"
  static SCRIPT_SOMETIME_LIKE = "script_sometime_like"

  static SCRIPT_QUERY_SELF_LIKE_BY_ID = "script_query_self_like_by_id"

  static SCRIPT_QUERY_COMMENT_FROM_POSTS = "script_query_comment_from_posts"
  static SCRIPT_QUERY_COMMENT_COUNTS = "script_query_comment_counts"

  //public
  static QUERY_PUBLIC_SPECIFIED_POST = "query_public_specified_post"
  static QUERY_PUBLIC_SOMETIME_POST = "query_public_sometime_post"
  static QUERY_PUBLIC_POST_BY_CHANNEL = "query_public_post_by_channel"
}
