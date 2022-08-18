import BigNumber from 'bignumber.js'

const TAG: string = 'HiveData'

export declare namespace HiveData {
  export enum CommonStatus {
    available = 0,
    deleted = 1,
    edited = 2,
    sending = 11,
    error = 12,
  }

  const enum MediaType {
    noMeida = 0,
    containsImg = 1,
    containsVideo = 2,
  }

  export type InsertResult = {
    destDid: string,
    channelId: string,
    createdAt: number,
    updatedAt: number
  }

  export type DeleteResult = {
    updatedAt: number,
    status: number
  }

  export type ChannelInfo = {
    destDid: string,
    channelId: string,
    avatar: string,
    name: string,
    intro: string,
    createdAt: number,
    updatedAt: number,
    type: string,
    paymentAddress: string, // replace tipping_address
    nft: string,
    category: string,
    proof: string
    memo: string,
  }

  type SubscriptionInfo = {
    destDid: string,
    channelId: string,
    userDid: string,
    createdAt: number,
    displayName: string,
    updatedAt: number,
    status: CommonStatus.available | CommonStatus.deleted
  }

  type postContent = {
    version: string,
    content: string,
    mediaData: mediaData[],// 已经上传的到hive(size/type/scriptName@path)
    mediaType: MediaType
  }

  type mediaData = {
    kind: string,           //"image/video/audio"
    originMediaPath: string,
    type: string,           //"image/jpg",
    size: number,           //origin file size
    thumbnailPath: string    //"thumbnailCid"
    duration: number,
    imageIndex: number,
    additionalInfo: any,
    memo: any
  }

  type PostInfo = {
    destDid: string,
    postId: string,
    channelId: string,
    createdAt: number,
    updatedAt: number,
    content: postContent,
    status: CommonStatus,
    type: string,
    tag: string,
    proof: string,
    memo: string
  }
}

