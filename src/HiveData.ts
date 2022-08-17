import BigNumber from 'bignumber.js'

const TAG: string = 'HiveData'

export declare namespace HiveData {
  export type CommonStatus = {
    available: 0,
    deleted: 1,
    edited: 2,
    sending: 11,
    error: 12,
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
    paymentAddress: string, // replease tipping_address
    nft: string,
    category: string,
    proof: string
    memo: string,
  }
}

