import React, {useState} from 'react'
import {RuntimeContext, ChannelInfo, ChannelEntry, MyProfile, MyChannel } from '@feedsnetwork/feeds-sdk-development';
import {
  useNavigate
} from "react-router-dom";

function SigninEE() {
  const navigate = useNavigate();
  const applicationDid = 'did:elastos:iqtWRVjz7gsYhyuQEb1hYNNmWQt1Z9geXg'
  const currentNet = "mainnet".toLowerCase()
  const localDataDir = "/data/store/develop1"
  const resolveCache = '/data/store/catch1'
  RuntimeContext.initialize(applicationDid, currentNet, localDataDir, resolveCache)
  const appCtx = RuntimeContext.getInstance()
  const [login, setLogin] = useState(appCtx.checkSignin());

  const handleSigninEE = async () => {
    const myprofile = await appCtx.signin()
    console.log(`name: ${myprofile.getName()}`);
    console.log(`description: ${myprofile.getDescription()}`);
    const resultCount = await myprofile.queryOwnedChannelCount()
    console.log(`myprofile resultCount: `, resultCount);
    const resultChannelInfos = await myprofile.queryOwnedChannels()
    console.log(`myprofile resultChannelInfos: `, resultChannelInfos);
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

    const item0 = resultChannelInfos[0]
    console.log("item0 ============================================ ", item0)
    const channelId0 = item0.getChannelId()
    console.log("channelId0 ============================================ ", channelId0)
   const channelInfo0 = await myprofile.queryOwnedChannnelById(channelId0)
   console.log("channelInfo0 ============================================ ", channelInfo0)

    const myChannel0 = new MyChannel(appCtx, item0)
   const mychannelInfo0 = await myChannel0.queryChannelInfo()
   console.log("mychannelInfo0 ==== ", mychannelInfo0)

  /*
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
    setLogin(appCtx.checkSignin());
  }

  const creatChannel = async (myProfile) => {

  }

  const handleSignout = async () => {
    await appCtx.signout();
    setLogin(appCtx.checkSignin());
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
