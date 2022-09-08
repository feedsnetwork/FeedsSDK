import { Executable, InsertOptions, File as HiveFile, ScriptRunner, Vault, AppContext, Logger as HiveLogger, UpdateResult, UpdateOptions, Condition, InsertResult, DatabaseService, ScriptingService, FilesService } from "@elastosfoundation/hive-js-sdk"
import { Claims, DIDDocument, JWTHeader, JWTParserBuilder, DID, DIDBackend, DefaultDIDAdapter, JSONObject, VerifiablePresentation } from '@elastosfoundation/did-js-sdk'
import { connectivity, DID as ConDID, Hive } from "@elastosfoundation/elastos-connectivity-sdk-js"
import { Logger } from './utils/logger'

const logger = new Logger("Channel")
export class hiveService {
  public appinstanceDid: string
  private databaseService: DatabaseService // TODO:
  private scriptingService: ScriptingService // TODO:
  private scriptRunner: ScriptRunner // TODO:
  private fileService: FilesService // TODO:
  private dbService: DatabaseService // TODO:

  constructor() { }

  createCollection(channelName: string): Promise<void> {
    return this.databaseService.createCollection(channelName)
  }

  deleteCollection(collectionName: string): Promise<void> {
    return this.databaseService.deleteCollection(collectionName);
  }

  registerScript(scriptName: string, executable: Executable, condition?: Condition, allowAnonymousUser?: boolean, allowAnonymousApp?: boolean): Promise<void> {
    return this.scriptingService.registerScript(scriptName, executable,
      condition, allowAnonymousUser, allowAnonymousApp)
  }

  async callScript(scriptName: string, document: any, targetDid: string, appid: string): Promise<any> {
    return this.scriptRunner.callScript<any>(scriptName, document, targetDid, appid)
  }

  uploadScriting(transactionId: string, data: string): Promise<void> {
    return this.scriptRunner.uploadFile(transactionId, data)
  }

  downloadScripting(transaction_id: string): Promise<Buffer> {
    return this.scriptRunner.downloadFile(transaction_id)
  }

  downloadFile(remotePath: string): Promise<Buffer> {
    return this.fileService.download(remotePath)
  }

  getUploadDataFromScript(transactionId: string, img: any): Promise<void> {
    return this.scriptRunner.uploadFile(transactionId, img)
  }

  uploadDataFromScript(transactionId: string, img: any): Promise<void> {
    return this.scriptRunner.uploadFile(transactionId, img)
  }

  uploadScriptWithBuffer(remotePath: string, img: Buffer): Promise<string> {
    return this.fileService.upload(remotePath, img)
  }

  uploadScriptWithString(remotePath: string, img: any): Promise<string> {
    return this.fileService.upload(remotePath, Buffer.from(img, 'utf8'))
  }

  insertDBData(collectName: string, doc: any,): Promise<InsertResult> {
    return this.dbService.insertOne(collectName, doc, new InsertOptions(false, true))
  }

  updateOneDBData(collectName: string, filter: JSONObject, update: JSONObject, option: UpdateOptions): Promise<UpdateResult> {
    return this.dbService.updateOne(collectName, filter, update, option)
  }

  deleateOneDBData(collectName: string, fillter: JSONObject): Promise<void> {
    return this.dbService.deleteOne(collectName, fillter)
  }

  queryDBData(collectionName: string, filter: any): Promise<JSONObject[]> {
    return this.dbService.findMany(collectionName, filter)
  }
}