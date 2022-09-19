import { Executable, InsertOptions, ScriptRunner, Vault, Logger as HiveLogger, UpdateResult, UpdateOptions, Condition, InsertResult, DatabaseService, ScriptingService, FilesService } from "@elastosfoundation/hive-js-sdk"
import { JSONObject } from '@elastosfoundation/did-js-sdk'
import { Logger } from './utils/logger'
import { RuntimeContext } from './runtimecontext'

const logger = new Logger("Channel")
export class hiveService {
  private vault: Vault
  private scriptRunner: ScriptRunner 

  constructor() { }

  async getScriptRunner(userDid: string): Promise<ScriptRunner> {
    try {
      const appContext = RuntimeContext.getInstance()
      this.scriptRunner = appContext.getScriptRunners[userDid]

      if (this.scriptRunner === undefined || this.scriptRunner === null) {
        this.scriptRunner = await appContext.creatScriptRunner(userDid)
      }
      return this.scriptRunner
    } catch (error) {
      throw error
    }
  }

  async getVault(): Promise<Vault> {
    if (this.vault === undefined || this.vault === null) {
      const appContext = RuntimeContext.getInstance()
      this.vault = await appContext.createVault()
    }
    return this.vault
  }

  async getDatabaseService() {
    return (await this.getVault()).getDatabaseService()
  }

  async getFilesService() {
    return (await this.getVault()).getFilesService()
  }

  async getScriptingService() {
    return (await this.getVault()).getScriptingService()
  }

  async createCollection(channelName: string): Promise<void> {
    return (await this.getDatabaseService()).createCollection(channelName)
  }

  async deleteCollection(collectionName: string): Promise<void> {
    return (await this.getDatabaseService()).deleteCollection(collectionName);
  }

  async registerScript(scriptName: string, executable: Executable, condition?: Condition, allowAnonymousUser?: boolean, allowAnonymousApp?: boolean): Promise<void> {
    return (await this.getScriptingService()).registerScript(scriptName, executable,
      condition, allowAnonymousUser, allowAnonymousApp)
  }

  async callScript(scriptName: string, document: any, targetDid: string, appid: string): Promise<any> {
    return (await this.getScriptRunner(targetDid)).callScript<any>(scriptName, document, targetDid, appid)
  }

  uploadScriting(transactionId: string, data: string): Promise<void> {
    return this.scriptRunner.uploadFile(transactionId, data)
  }

  downloadScripting(transaction_id: string): Promise<Buffer> {
    return this.scriptRunner.downloadFile(transaction_id)
  }

  async downloadFile(remotePath: string): Promise<Buffer> {
    return (await this.getFilesService()).download(remotePath)
  }

  getUploadDataFromScript(transactionId: string, img: any): Promise<void> {
    return this.scriptRunner.uploadFile(transactionId, img)
  }

  uploadDataFromScript(transactionId: string, img: any): Promise<void> {
    return this.scriptRunner.uploadFile(transactionId, img)
  }

  async uploadScriptWithBuffer(remotePath: string, img: Buffer): Promise<string> {
    return (await this.getFilesService()).upload(remotePath, img)
  }

  async uploadScriptWithString(remotePath: string, img: any): Promise<string> {
    return (await this.getFilesService()).upload(remotePath, Buffer.from(img, 'utf8'))
  }

  async insertDBData(collectName: string, doc: any,): Promise<InsertResult> {
    return (await this.getDatabaseService()).insertOne(collectName, doc, new InsertOptions(false, true))
  }

  async updateOneDBData(collectName: string, filter: JSONObject, update: JSONObject, option: UpdateOptions): Promise<UpdateResult> {
    return (await this.getDatabaseService()).updateOne(collectName, filter, update, option)
  }

  async deleateOneDBData(collectName: string, fillter: JSONObject): Promise<void> {
    return (await this.getDatabaseService()).deleteOne(collectName, fillter)
  }

  async queryDBData(collectionName: string, filter: any): Promise<JSONObject[]> {
    return (await this.getDatabaseService()).findMany(collectionName, filter)
  }

  async queryDBDataWithOptions(collectionName: string, filter: any, options: any): Promise<JSONObject[]> {
    return (await this.getDatabaseService()).findMany(collectionName, filter, options)
  }
}