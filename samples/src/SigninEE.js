import React, {useState} from 'react'
import {Logger as FeedsLogger, signin, RuntimeContext, Post, Channel, ChannelInfo, ChannelEntry, MyProfile, MyChannel, PostBody, PostContent } from '@feedsnetwork/feeds-sdk-development';
import { createHiveContextProvider } from './Provider'
import { Logger as HiveLogger } from '@elastosfoundation/hive-js-sdk'

import {
  useNavigate
} from "react-router-dom";

function SigninEE() {
  const navigate = useNavigate();
  const applicationDid = 'did:elastos:iqtWRVjz7gsYhyuQEb1hYNNmWQt1Z9geXg'
  const localDataDir = "/data/store/develop1"
  const hiveProvider = createHiveContextProvider(localDataDir)
  let userDid = ""
  const [login, setLogin] = useState(userDid !== "");

  const handleSigninEE = async () => {
    userDid = await signin(applicationDid)
    // HiveLogger.setDefaultLevel(HiveLogger.ERROR)
    FeedsLogger.setDefaultLevel(FeedsLogger.WARNING)

    console.log("开始初始化 RuntimeContext = ", RuntimeContext.isInitialized())
    const currentNet = "mainnet".toLowerCase()
    if (!RuntimeContext.isInitialized()) {
    // hiveProvider: AppContextProvider（@elastosfoundation/hive-js-sdk） 需要自己实现，
      RuntimeContext.createInstance(hiveProvider, userDid)
    }
    const appCtx = RuntimeContext.getInstance()
  
    console.log("userDid ========== ", userDid)
    const myprofile = new MyProfile(appCtx, userDid, null, null) 
    console.log("myprofile ========== ", myprofile)
    const currentTime = new Date().getTime()
    const count = await myprofile.queryOwnedChannelCount()
    console.log( "queryOwnedChannelCount ========================================", count)
    const channels = await myprofile.queryOwnedChannels()
    console.log( "queryOwnedChannels ========================================", channels)
    const channelId1 = "ee74ab5fdbc62b42f45c2af1803ba95b684adbab740c88cf30f9b11c61bc1318"
    const channelId2 = "50f0854a02059abb941849c5a66d7513091d1bbabec8b9fa582b17bbe3689b1d"
  
    const channels1 = await myprofile.queryOwnedChannnelById(channelId1)
    const channels2 = await myprofile.queryOwnedChannnelById(channelId2)
    console.log( "queryOwnedChannnelById channelId1: ========================================", channels1)
    console.log( "queryOwnedChannnelById channelId2: ========================================", channels2)
    
    const channelCount = await myprofile.querySubscribedChannelCount()
    console.log( "querySubscribedChannelCount: ========================================", channelCount)
    
    const subscribedChannels = await myprofile.querySubscribedChannels()
    console.log( "querySubscribedChannels: ========================================", subscribedChannels)

    for (let index = 0; index < subscribedChannels.length; index++) {
      const item = subscribedChannels[index]
      const channelId = item.getChannelId()
      const subscribedChannelInfo = await myprofile.querySubscribedChannelById(channelId)
      console.log(index + "querySubscribedChannelById: ========================================", subscribedChannelInfo)
    }
    // 
    /*
    const subscriptions = await myprofile.querySubscribedChannels()
    for (let index = 0; index < subscriptions.length; index++) {
      const item = subscriptions[index]
      const channel = new Channel(appCtx, item)
      // 看下哪个是feeds channel的信息，取出哪个channel， 
      // 这里循环获取所有订阅的channel
      const postBodys = await channel.queryPosts(0, currentTime)
      
      for (let index = 0; index < postBodys.length; index++) {
        const item = postBodys[index]
        const post = new Post(appCtx, item)
        const comments = await post.queryCommentsByRangeOfTime(0, currentTime)
        console.log(index + ": 多个 queryComments 0 ========================================", comments)
      }
    }
    */
    /* //发送文字
    const ownedChannels = await myprofile.queryOwnedChannels()
    for (let index = 0; index < ownedChannels.length; index++) {
      const item = ownedChannels[index]
      const channel = new MyChannel(appCtx, item)
    //   const c1 = "50f0854a02059abb941849c5a66d7513091d1bbabec8b9fa582b17bbe3689b1d"
    //   const p1 = "1bd13ec1794b421c5e22a0df57218aa2a938bd3bb8569bae9042c2a13ccea88d"
    //   const c2 = "ee74ab5fdbc62b42f45c2af1803ba95b684adbab740c88cf30f9b11c61bc1318"
    //  const p2 = "34c8f72af9c7afdc12dd028e33b8bd48aa1902e14b1d1942e7a51e46686d1eb4"
    //  const c3 = "50f0854a02059abb941849c5a66d7513091d1bbabec8b9fa582b17bbe3689b1d"
    //  const p3 = "2f27b2525620401b4a06233e7439831a12aa77a1c6c8659f3fdcde5e38d73715"
    //  const c4 = "ee74ab5fdbc62b42f45c2af1803ba95b684adbab740c88cf30f9b11c61bc1318"
    //  const p4 = "05365251aebcd1fbdac20364597137c1b506ab6ff37788b3b9df54694798ab69"
    //   await channel.removePost(c1, p1)
    //   await channel.removePost(c2, p2)
    //   await channel.removePost(c3, p3)
    //   await channel.removePost(c4, p4)

      const posts = await channel.queryPostsByRangeOfTime(0, currentTime)
      console.log("posts result ==================================== ", posts)

      let postBody = new PostBody(appCtx.getUserDid(), item.getChannelId())
      const text = index + "无图片：测试sdk发送post到feeds"
      const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANQAAACYCAYAAACcRMcPAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAA1KADAAQAAAABAAAAmAAAAAAhAQNyAAADeUlEQVR4Ae3TQQ0AIAwEQcC/2wqABA37nAq4x6S7Z+YuR4BAInCSFSMECHwBQXkEAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRF4AFcGwUI07hnwwAAAABJRU5ErkJggg=="
      const result = await postBody.progressPostContent(text, null, null)
      console.log("处理图片的结果：result ==================================== ", result)
      const content = result.toString()
      console.log("处理图片为string结果：resultStr ==================================== ", content)
      const postId = PostBody.generatePostId(appCtx.getUserDid(),item.getChannelId(), content)
      postBody.setPostId(postId)
      postBody.setContent(result)
      postBody.setStatus(0)
      postBody.setType("public")
      postBody.setTag('')
      postBody.setProof('')
      postBody.setMemo('')
      const post = new Post(appCtx, postBody)
      await channel.post(post)
      console.log("发送post 成功")
    }*/
    
    /*  // 发送图文
    const ownedChannels = await myprofile.queryOwnedChannels()
    for (let index = 0; index < ownedChannels.length; index++) {
      const item = ownedChannels[index]
      const channel = new MyChannel(appCtx, item)
      let postBody = new PostBody(appCtx.getUserDid(), item.getChannelId())
      const text = index + "测试sdk发送post到feeds"
      const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANQAAACYCAYAAACcRMcPAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAA1KADAAQAAAABAAAAmAAAAAAhAQNyAAADeUlEQVR4Ae3TQQ0AIAwEQcC/2wqABA37nAq4x6S7Z+YuR4BAInCSFSMECHwBQXkEAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRFQFB+gEAoIKgQ0xQBQfkBAqGAoEJMUwQE5QcIhAKCCjFNERCUHyAQCggqxDRF4AFcGwUI07hnwwAAAABJRU5ErkJggg=="
      const result = await postBody.progressPostContent(text, [image], null)
      console.log("处理图片的结果：result ==================================== ", result)
      const content = result.toString()
      console.log("处理图片为string结果：resultStr ==================================== ", content)
      const postId = PostBody.generatePostId(appCtx.getUserDid(),item.getChannelId(), content)
      postBody.setPostId(postId)
      postBody.setContent(result)
      postBody.setStatus(0)
      postBody.setType("public")
      postBody.setTag('')
      postBody.setProof('')
      postBody.setMemo('')
      const post = new Post(appCtx, postBody)
      await channel.post(post)
      console.log("发送post 成功")
    }
    */
    /*
    const subscriptions = await myprofile.querySubscriptions()

    for (let index = 0; index < subscriptions.length; index++) {
      const item = subscriptions[index]
      console.log(index + "itme ========================================",item)
        const channel = new Channel(appCtx, item)
        const postBodys = await channel.queryPosts(currentTime, 100)
        console.log(index + "channel: all posts0 ========================================", postBodys)

        for (let index = 0; index < postBodys.length; index++) {
          const postBody = postBodys[index]
          const post_1 = new Post(appCtx, postBody)
          const commentsRange = await post_1.queryComments(currentTime, 100)
          console.log(index + ": 多个 queryComments 0 ========================================", commentsRange)

          for (let index = 0; index < commentsRange.length; index++) {
            const commentInfo = commentsRange[index]
            const cId = commentInfo.getCommentId()
            const comments = await post_1.queryCommentById(cId)
            console.log(index + "查询 queryCommentById 0 ========================================", comments)
          }
        }
      }
      */
    /*
    console.log("resultSubscriptions ======================================== ", resultSubscriptions)
    for (let index = 0; index < resultSubscriptions.length; index++) {
      const item = resultSubscriptions[index]
      const channel = new Channel(item)
      const postBodys = await channel.queryPostsByRangeOfTime(0, currentTime)
      console.log(index + "postBodys ======================================== ", postBodys)
      for (let index = 0; index < postBodys.length; index++) {
        const item = postBodys[index]
        const post = new Post(item)
        const postId = item.getPostId()
        console.log(index + "postId ======================================== ", postId)

        const like = await post.queryLikeByPost()
        console.log(index + "like ======================================== ", like)

        console.log(index + "postBodys item ======================================== ", item)
        // const comments = await post.queryCommentsRangeOfTime(0, currentTime)
        // console.log(index + "comments ======================================== ", comments)
        // for (let index = 0; index < comments.length; index++) {
          // const item = comments[index]
          // const likeId = Post.generateLikeId(item.getCommentInfo().getPostId(), '0', myprofile.getUserDid())
          // const adLike = await post.addLike(item.getTargetDid(), likeId, item.getCommentInfo().getCommentId())
          // console.log(index + "adLike ======================================== ", adLike)
        // }
      }
    }

    */
    /*
    for (let index = 0; index < resultSubscriptions.length; index++) {
      const item = resultSubscriptions[index]
      const channel = new Channel(item)
      const postBodys = await channel.queryPostsByRangeOfTime(0, currentTime)
      console.log(index + "postBodys ======================================== ", postBodys)
      for (let index = 0; index < postBodys.length; index++) {
        const item = postBodys[index]
        const post = new Post(item)
        console.log(index + "postBodys item ======================================== ", item)
        const aLike = await post.removeLike(item.getTargetDid(), "0")
        console.log(index + "postBodys removeLike ======================================== ", aLike)
      }
    }*/
    /*
    for (let index = 0; index < resultSubscriptions.length; index++) {
      const item = resultSubscriptions[index]
      const channel = new Channel(item)
      const postBodys = await channel.queryPostsByRangeOfTime(0, currentTime)
      console.log(index + "postBodys ======================================== ", postBodys)
      for (let index = 0; index < postBodys.length; index++) {
        const item = postBodys[index]
        const post = new Post(item)
        console.log(index + "postBodys item ======================================== ", item)
        const likeId = Post.generateLikeId(item.getPostId(), '0', myprofile.getUserDid())
        const aLike = await post.addLike(item.getTargetDid(), likeId, "0")
        console.log(index + "postBodys aLike ======================================== ", aLike)
      }
    }
*/
    /*
    const resultChannelInfos = await myprofile.queryOwnedChannels()
    const myChannel = new MyChannel(appCtx, resultChannelInfos[0])
    console.log("myChannel ======================================== ", myChannel)
      
    const subscribers = await myChannel.querySubscribers(currentTime, 100)
    console.log("subscribers ========================================", subscribers)
    
    const subProfile0 = subscribers[0]
    const channelInfos0 = await subProfile0.queryOwnedChannels()
    console.log("channelInfos0 ========================================", channelInfos0)
  */
  /*
    for (let index = 0; index < channelInfos0.length; index++) {
      const item = channelInfos0[index]
        const channel = new Channel(item)
        const postBodys = await channel.queryPosts(currentTime, 100)
        console.log("all posts0 ========================================", postBodys)

        for (let index = 0; index < postBodys.length; index++) {
          const postBody = postBodys[index]
          const postId = postBody.getPostId()
          const post = await channel.queryPost(postId)
          console.log("单个post 0 ========================================", post)
          const post_1 = new Post(post)
          const commentsRange = await post_1.queryCommentsRangeOfTime(0, currentTime)
          console.log(index + ": 多个 queryCommentsRangeOfTime 0 ========================================", commentsRange)

          const commentsend = await post_1.queryComments(currentTime, 100)
          console.log(index + ": 多个 queryComments 0 ========================================", commentsend)

          for (let index = 0; index < commentsRange.length; index++) {
            const comment = commentsRange[index]
            const cId = comment.getCommentInfo().getCommentId()
            const comments = await post_1.queryCommentById(cId)
            console.log("查询 queryCommentById 0 ========================================", comments)
            const comments1 = await post_1.queryCommentByPostId()
            console.log("查询 queryCommentByPostId 0 ========================================", comments1)
            const comments2 = await post_1.queryCommentByChannel()
            console.log("查询 queryCommentByChannel 0 ========================================", comments2)
          }
        
          // const cid = "c745b7e1d83d09a10bde147b68443c6e247874fff1fdd23b8379fe0bc19d733a"
          // const rec = await post_1.deleteComment(cid)
          // console.log("删除 comments 0 ========================================", rec)

          // if (index === 1) {
          //   const re = await post_1.addComment("测试添加评论 ---" + index)
          //   console.log("添加 comments 0 ========================================", re)
          // }

          // if (index === 2) {
          //   const re = await post_1.addComment("测试添加评论 ---" + index)
          //   console.log("添加 comments 0 ========================================", re)
          //   const re0 = await post_1.updateComment(re.getCommentId() ,"修改新添加的评论 ---" + index)
          //   console.log("添加 comments 0 ========================================", re0)
          // }

        // if (index === 3) {
        //   const re = await post_1.addComment("测试添加评论 ---" + index)
        //   console.log("添加 comments 0 ========================================", re)
        //   const re0 = await post_1.updateComment(re.getCommentId() ,"修改新添加的评论 ---" + index)
        //   console.log("更新 comments 0 ========================================", re0)
        // }

        // if (index === 4) {
        //   const re = await post_1.addComment("测试添加评论 ---" + index)
        //   console.log("添加 comments 0 ========================================", re)
        //   const re0 = await post_1.updateComment(re.getCommentId() ,"修改新添加的评论 ---" + index)
        //   console.log("更新 comments 0 ========================================", re0)
        // }

        //   const comments = await post_1.queryCommentsRangeOfTime(0, currentTime)
        //   console.log("多个 comments 0 ========================================", comments)
        }
    }
  */
  /*
    const subProfile1 = subscribers[1]
    const channelInfos1 = await subProfile1.queryOwnedChannels()
    console.log("channelInfos1 ========================================", channelInfos1)

    for (let index = 0; index < channelInfos1.length; index++) {
      const item = channelInfos1[index]
      const channel = new Channel(item)
      const postBodys = await channel.queryPosts(currentTime, 100)
      console.log("all posts1 ========================================", postBodys)
    
      for (let index = 0; index < postBodys.length; index++) {
        const postBody = postBodys[index]
        const postId = postBody.getPostId()
        const post = await channel.queryPost(postId)
        console.log("单个post 1 ========================================", post)
        const post_1 = new Post(post)
        const commentsRange = await post_1.queryCommentsRangeOfTime(0, currentTime)
        console.log(index + ": 多个 queryCommentsRangeOfTime 1 ========================================", commentsRange)
        
        const commentsend = await post_1.queryComments(currentTime, 100)
        console.log(index + ": 多个 queryComments 1 ========================================", commentsend)

        for (let index = 0; index < commentsRange.length; index++) {
          const comment = commentsRange[index]
          const cId = comment.getCommentInfo().getCommentId()
          const comments = await post_1.queryCommentById(cId)
          console.log("查询 queryCommentById 1 ========================================", comments)
          const comments1 = await post_1.queryCommentByPostId()
          console.log("查询 queryCommentByPostId 1 ========================================", comments1)
          const comments2 = await post_1.queryCommentByChannel()
          console.log("查询 queryCommentByChannel 1 ========================================", comments2)
        }
        // if (index === 3) {
        //   const re = await post_1.addComment("测试添加评论 ---" + index)
        //   console.log("添加 comments 1 ========================================", re)
        //   const re0 = await post_1.updateComment(re.getCommentId() ,"修改新添加的评论 ---" + index)
        //   console.log("更新 comments 1 ========================================", re0)
        // }

        // if (index === 4) {
        //   const re = await post_1.addComment("测试添加评论 ---" + index)
        //   console.log("添加 comments 1 ========================================", re)
        //   const re0 = await post_1.updateComment(re.getCommentId() ,"修改新添加的评论 ---" + index)
        //   console.log("更新 comments 1 ========================================", re0)
        // }
      }
    }
  */
    // const result = await myprofile.querySubscriptions()
    // console.log("result ========================================", result)

    /*
    const subscribers = await myChannel.querySubscribers(currentTime, 100)
    console.log("subscribers ========================================", subscribers)
    
    const subProfile0 = subscribers[0]
    const channelInfos0 = await subProfile0.queryOwnedChannels()
    console.log("channelInfos0 ========================================", channelInfos0)
   
    for (let index = 0; index < channelInfos0.length; index++) {
      const item = channelInfos0[index]
        const channel = new Channel(item)
        const subscriberCount = await channel.querySubscriberCount()
        console.log("all subscriberCount 0 ========================================", subscriberCount)
        const subscriber = await channel.querySubscribers(currentTime, 100)
        console.log("all subscriber 0 ========================================", subscriber)
      }

    const subProfile1 = subscribers[1]
    const channelInfos1 = await subProfile1.queryOwnedChannels()
    console.log("channelInfos1 ========================================", channelInfos1)

    for (let index = 0; index < channelInfos1.length; index++) {
      const item = channelInfos1[index]
      const channel = new Channel(item)
      const subscriberCount = await channel.querySubscriberCount()
      console.log("all subscriberCount 1 ========================================", subscriberCount)
      const subscriber = await channel.querySubscribers(currentTime, 100)
      console.log("all subscriber 1 ========================================", subscriber)
    }
    */
    /*
    for (let index = 0; index < channelInfos0.length; index++) {
      const item = channelInfos0[index]
        const channel = new Channel(item)
        const postBodys = await channel.queryPosts(currentTime, 100)
        console.log("all posts0 ========================================", postBodys)

        for (let index = 0; index < postBodys.length; index++) {
          const postBody = postBodys[index]
          const postId = postBody.getPostId()
          const post = await channel.queryPost(postId)
          console.log("单个post 0 ========================================", post)
        }

    }

    const subProfile1 = subscribers[1]
    const channelInfos1 = await subProfile1.queryOwnedChannels()
    console.log("channelInfos1 ========================================", channelInfos1)

    for (let index = 0; index < channelInfos1.length; index++) {
      const item = channelInfos1[index]
      const channel = new Channel(item)
      const postBodys = await channel.queryPosts(currentTime, 100)
      console.log("all posts1 ========================================", postBodys)
    
      for (let index = 0; index < postBodys.length; index++) {
        const postBody = postBodys[index]
        const postId = postBody.getPostId()
        const post = await channel.queryPost(postId)
        console.log("单个post 1 ========================================", post)
      }
    }*/

    // for (let index = 0; index < channelInfos0.length; index++) {
    //   const item = channelInfos0[index]
    //     const channel = new Channel(item)
    //     const posts = await channel.queryPostsByRangeOfTime(0, currentTime)
    //     console.log("posts0 ========================================", posts)
    // }

    // const subProfile1 = subscribers[1]
    // const channelInfos1 = await subProfile1.queryOwnedChannels()
    // console.log("channelInfos1 ========================================", channelInfos1)

    // for (let index = 0; index < channelInfos1.length; index++) {
    //   const item = channelInfos1[index]
    //   const channel = new Channel(item)
    //   const posts = await channel.queryPostsByRangeOfTime(0, currentTime)
    //   console.log("posts1 ========================================", posts)
    // }
   
    // for (let index = 0; index < channelInfos0.length; index++) {
    //   const item = channelInfos0[index]
    //   const channel = new Channel(item)
    //   const result = await channel.queryChannelInfo()
    //   console.log("channelInfos0 result ========================================", result)
    // }

    // const subProfile1 = subscribers[1]
    // const channelInfos1 = await subProfile1.querySubscriptions()
    // console.log("channelInfos1 ========================================", channelInfos1)

    // for (let index = 0; index < channelInfos1.length; index++) {
    //   const item = channelInfos1[index]
    //   const channel = new Channel(item)
    //   const result = await channel.queryChannelInfo()
    //   console.log("channelInfos1 result ========================================", result)
    // }

    // const subscribers = await myChannel.querySubscribers(currentTime, 100)
    // console.log("subscribers ========================================", subscribers)
    // const subProfile0 = subscribers[0]
    // const subProfileSubscription0 = await subProfile0.querySubscriptionCount()
    // console.log("subProfileSubscription0 ========================================", subProfileSubscription0)

    // const subProfile1 = subscribers[1]
    // const subProfileSubscription1 = await subProfile1.querySubscriptionCount()
    // console.log("subProfileSubscription1 ========================================", subProfileSubscription1)

    // const subscribersOwnedChannels0 = await subProfile0.queryOwnedChannels()
    // console.log("subscribersOwnedChannels0 ========================================", subscribersOwnedChannels0)

    // const channelId0 = subscribersOwnedChannels0[0].getChannelId()
    // const channelInfo0 = await subProfile0.queryOwnedChannnelById(channelId0)
    // console.log("channelInfo0 ========================================", channelInfo0)

    // const channelId1 = subscribersOwnedChannels0[1].getChannelId()
    // const channelInfo1 = await subProfile0.queryOwnedChannnelById(channelId1)
    // console.log("channelInfo1 ========================================", channelInfo1)


    // const subProfile1 = subscribers[1]
    // const subscribersOwnedChannels1 = await subProfile1.queryOwnedChannels()
    // console.log("subscribersOwnedChannels1 ========================================", subscribersOwnedChannels1)

    // const channelId3 = subscribersOwnedChannels1[0].getChannelId()
    // const channelInfo3 = await subProfile1.queryOwnedChannnelById(channelId3)
    // console.log("channelInfo3 ========================================", channelInfo3)

    // const channelId4 = subscribersOwnedChannels1[1].getChannelId()
    // const channelInfo4 = await subProfile1.queryOwnedChannnelById(channelId4)
    // console.log("channelInfo4 ========================================", channelInfo4)

    // const pId0 = 'b40c35292d2ae711289aed4e2bf2da847075af724604bdb0fae4150f85897774'
    // const PId1 = 'bdd113d5e7f368996a51cf2960398ec6709f9ee7ade6ed59ec9682fad73a6245'
    // const PId2 = "bdd113d5e7f368996a51cf2960398ec6709f9ee7ade6ed59ec9682fad73a6245"
    // const re = await myChannel.removePost(pId0)
    // const re0 = await myChannel.removePost(PId1)
    // const re1 = await myChannel.removePost(PId2)

  // console.log("re ========================================", re)
    // const posts = await myChannel.queryPosts(currentTime, 100)
    // console.log("posts ======================================== ", posts)
    // const posts = await myChannel.queryPostsByRangeOfTime(1663569, currentTime)
    // console.log("posts ======================================== ", posts)
    // const post = posts[0]
    // const postId0 = "ec25653b298621cf0e1023d7d9ee9f0d6e58b61a36859a1b5d73ba30de5678dd"
    // const subscriberCount = await myChannel.querySubscribers(currentTime, 100)
    // console.log("subscriberCount ======================================== ", subscriberCount)
    // {"version":"3.0","content":"测试发送图片","mediaData":[{"kind":"image","originMediaPath":"68eacbf862f696300cba2efe5fa3a162@feeds/data/68eacbf862f696300cba2efe5fa3a162","type":"image/jpeg","size":8014599,"imageIndex":0,"thumbnailPath":"7f63752d5e50bbb244725d910b061c24@feeds/data/7f63752d5e50bbb244725d910b061c24","duration":0,"additionalInfo":{},"memo":{}}],"mediaType":1}
    // const contentJson = {
    //   "version": "3.0",
    //   "content": "复制-4过来的图片，为了测试",
    //   "mediaData": [{
    //     "kind": "image",
    //     "originMediaPath": "68eacbf862f696300cba2efe5fa3a162@feeds/data/68eacbf862f696300cba2efe5fa3a162",
    //     "type": "image/jpeg",
    //     "size": 8014599,
    //     "imageIndex": 0,
    //     "thumbnailPath": "7f63752d5e50bbb244725d910b061c24@feeds/data/7f63752d5e50bbb244725d910b061c24",
    //     "duration": 0,
    //     "additionalInfo": {},
    //     "memo": {}
    //   }],
    //   "mediaType": 1
    // }
    // const userDid = myChannel.getChannelInfo().getOwnerDid()
    // const channelId = myChannel.getChannelInfo().getChannelId()
    // const content = JSON.stringify(contentJson)
    // const postId = PostBody.generatePostId(userDid, channelId, content)
    // let postBody = new PostBody(userDid, postId, channelId)
    // postBody.setContentWithJson(contentJson)
    // postBody.setStatus(0)
    // postBody.setType("public")
    // postBody.setTag('')
    // postBody.setProof('')
    // postBody.setMemo('')
    // const sendPost = new Post(postBody)
    // const result = await myChannel.post(sendPost)
    // console.log("result ======================================== ", result)
    // const postId1 = posts[1].getPostId()
    // const post1 = await myChannel.queryPost(postId1)
    // console.log("post1 ======================================== ", post1)

    // const postId2 = posts[2].getPostId()
    // const post2 = await myChannel.queryPost(postId2)
    // console.log("post2 ======================================== ", post2)

    // const postId3 = posts[3].getPostId()
    // const post3 = await myChannel.queryPost(postId3)
    // console.log("post3 ======================================== ", post3)

    //     // 1970年： 1663569
    // // 现在： 1663569965
    // const currentTime = new Date().getTime()
    // const subscriptions = await myprofile.querySubscriptions(currentTime, 100)
    // console.log("subscriptions ======================================== ", subscriptions)
    // const subChannel = new Channel(appCtx, subscriptions[0])

    // console.log(`name: ${myprofile.getName()}`);
    // console.log(`description: ${myprofile.getDescription()}`);
    // const resultCount = await myprofile.queryOwnedChannelCount()
    // console.log(`myprofile resultCount: `, resultCount);
    // const resultChannelInfos = await myprofile.queryOwnedChannels()
    // console.log(`myprofile resultChannelInfos: `, resultChannelInfos);
    // const targetDid = 'did:elastos:ipkhCHvuxepfEoDffkZqWWfy9YM9AX4bw2'
    // const subChannelId = "f84d291671fa706522703a94e0c017c5dbde913b93aae45fa5174f255c9f4ebe"
    // const subDisplayName = myprofile.getName()
    // const status = 0 
    // const chnnelEntry = new ChannelEntry(targetDid, subChannelId, subDisplayName, status)
    // const unsubscribeNewChannel = await myprofile.subscribeChannel(chnnelEntry)
    // console.log("unsubscribeNewChannel ============================================ ", unsubscribeNewChannel)

    // await resultChannelInfos.forEach(async (item) => {
    //   // const channelId = item.getChannelId()
    // //   console.log("channelId ============================================ ", channelId)
    // //  const channelInfo = await myprofile.queryOwnedChannnelById(channelId)
    // //   console.log("channelInfo ============================================ ", channelInfo)
    //   console.log("item ============================================ ", item)
    //   const myChannel = new MyChannel(appCtx, item)
    //  const mychannelInfo = await myChannel.queryChannelInfo()
    //  console.log("mychannelInfo ==== ", mychannelInfo)
    // })

    // const channelInfoItem = resultChannelInfos[0]
    // const myChannel = new MyChannel(appCtx, channelInfoItem)
    // let mychannelInfo = await myChannel.queryChannelInfo()
    // console.log("mychannelInfo ============================================ ", mychannelInfo)
    // const disName = mychannelInfo.getDisplayName()
    // mychannelInfo = mychannelInfo.setDisplayName("大雁南飞")
    // mychannelInfo = mychannelInfo.setDescription("this is new description, the old displayname is: " + disName)
    // const result = await myChannel.updateChannelInfo(mychannelInfo)
    // console.log("updateChannelInfo result ============================================ ", result)
     
    // const channelId = mychannelInfo.getChannelId()
    // const channelInfo = await myprofile.queryOwnedChannnelById(channelId)
    // console.log("更新后：queryOwnedChannnelById channelInfo ============================================ ", channelInfo)

    // const time = (new Date()).getTime()
    // const posts = await myChannel.queryPosts(time, 100)
    // console.log("posts queryPosts ============================================ ", posts)



  /*
    const item0 = resultChannelInfos[0]
    console.log("item0 ============================================ ", item0)
    const channelId0 = item0.getChannelId()
    console.log("channelId0 ============================================ ", channelId0)
    const channelInfo0 = await myprofile.queryOwnedChannnelById(channelId0)
    console.log("channelInfo0 ============================================ ", channelInfo0)

    const myChannel0 = new MyChannel(appCtx, item0)
    const mychannelInfo0 = await myChannel0.queryChannelInfo()
    console.log("mychannelInfo0 ==== ", mychannelInfo0)

     const item1 = resultChannelInfos[1]
     console.log("item1 ============================================ ", item1)
     const channelId1 = item1.getChannelId()
     console.log("channelId1 ============================================ ", channelId1)
    const channelInfo1 = await myprofile.queryOwnedChannnelById(channelId1)
    console.log("channelInfo1 ============================================ ", channelInfo1)

     const myChannel1 = new MyChannel(appCtx, item1)
    const mychannelInfo1 = await myChannel1.queryChannelInfo()
    console.log("mychannelInfo1 ==== ", mychannelInfo1)

    const item2 = resultChannelInfos[2]
    const channelId2 = item2.getChannelId()
    console.log("channelId2 ============================================ ", channelId2)
   const channelInfo2 = await myprofile.queryOwnedChannnelById(channelId2)
   console.log("channelInfo2 ============================================ ", channelInfo2)

    console.log("item2 ============================================ ", item2)
    const myChannel2 = new MyChannel(appCtx, item2)
   const mychannelInfo2 = await myChannel2.queryChannelInfo()
   console.log("mychannelInfo2 ==== ", mychannelInfo2)

   const item3 = resultChannelInfos[3]
   const channelId3 = item3.getChannelId()
   console.log("channelId3 ============================================ ", channelId3)
  const channelInfo3 = await myprofile.queryOwnedChannnelById(channelId3)
  console.log("channelInfo3 ============================================ ", channelInfo3)

   console.log("item3 ============================================ ", item3)
   const myChannel3 = new MyChannel(appCtx, item3)
  const mychannelInfo3 = await myChannel3.queryChannelInfo()
  console.log("mychannelInfo3 ==== ", mychannelInfo3)
  */
  /*
    const subscriptionCount = await myprofile.querySubscriptionCount()
    console.log("查看订阅channle个数 结束：subscriptionCount ==== ", subscriptionCount)

    // 1970年： 1663569
    // 现在： 1663569965
    const currentTime = new Date().getTime()
    const subscriptions0 = await myprofile.querySubscriptions(currentTime, 100)
    console.log("subscriptions0 ======================================== ", subscriptions0)

    console.log("开始 create Channel ============================================== ")
    const name = 'New channel test for feeds js sdk - 5'
    const displayName = 'New channel test for feeds js sdk - 5'
    const description = "this is channel's Description - 5"

    const channelId = ChannelInfo.generateChannelId(myprofile.getUserDid(), name)
    const newChannelInfo = new ChannelInfo(myprofile.getUserDid(), channelId, name)
    newChannelInfo.setDisplayName(displayName)
    newChannelInfo.setDescription(description)
    newChannelInfo.setReceivingAddress("")
    newChannelInfo.setAvatar("26eac3c4bfb87d9f027c4810316e56d0@feeds/data/26eac3c4bfb87d9f027c4810316e56d0")
    newChannelInfo.setCategory("")
    const time = (new Date()).getTime()
    newChannelInfo.setCreatedAt(time)
    newChannelInfo.setUpdatedAt(time)
    newChannelInfo.setType("public")
    newChannelInfo.setNft("")
    newChannelInfo.setProof("")
    newChannelInfo.setMemo("")
    const createNewChannel = await myprofile.createChannel(newChannelInfo)
    console.log("createNewChannel 结束============================================== ", createNewChannel)

    await myprofile.deleteChannel(channelId)

    console.log("开始订阅 subscribeChannel ============================================== ")
    const targetDid = 'did:elastos:iUDbUWUFKjzNrnEfK8T2g61M77rbAQpAMj'
    const subChannelId = "34093f2a77e5649451153cb0f825be831896570a082165f29a78198a6928b217"
    const subDisplayName = myprofile.getName()
    const status = 0
    const subTime = (new Date()).getTime()
    const chnnelEntry = new ChannelEntry(targetDid, subChannelId, subDisplayName, status)
    chnnelEntry.setCreatedAt(subTime)
    chnnelEntry.setUpdatedAt(subTime)
    const subscribeNewChannel = await myprofile.subscribeChannel(chnnelEntry)
    console.log("订阅结束 subscribeNewChannel ============================================== ", subscribeNewChannel)
    const subscriptionCount1 = await myprofile.querySubscriptionCount()
    console.log("查看订阅channle个数 subscriptionCount1 ==== ", subscriptionCount1)

    const subscriptions1 = await myprofile.querySubscriptions((new Date()).getTime(), 100)
    console.log("subscriptions1 ======================================== ", subscriptions1)

    console.log("取消订阅 开始 subscribeNewChannel ============================================== ")
    const status1 = 1
    const chnnelEntry1 = new ChannelEntry(targetDid, subChannelId, subDisplayName, status1)
    const unsubscribeNewChannel = await myprofile.unsubscribeChannel(chnnelEntry1)
    console.log("取消订阅 结束 unsubscribeNewChannel ============================================== ", unsubscribeNewChannel)
    
    const subscriptionCount2 = await myprofile.querySubscriptionCount()
    console.log("查看订阅channle个数 subscriptionCount2 ==== ", subscriptionCount2)
    const subscriptions2 = await myprofile.querySubscriptions((new Date()).getTime(), 100)
    console.log("subscriptions2 ======================================== ", subscriptions2)
  */
    setLogin(userDid != "");
  }

  const creatChannel = async (myProfile) => {

  }

  const handleSignout = async () => {
    // await appCtx.signout();
    // setLogin(appCtx.checkSignin());
  }

  const handleClickButton = (path) => {
    navigate(path);
  }

  return (
    !login ?
    <div>
        <button onClick={handleSigninEE}>Sign in with EE</button>
    </div> :
    <div>
        <button onClick={handleSignout}>Sign out</button>

        <div>
          <button onClick={()=> handleClickButton('/myprofile')}>My Profile</button>
        </div>

    </div>
  );
}

export default SigninEE;
