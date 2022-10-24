import { RuntimeContext } from '@feedsnetwork/feeds-sdk-development';
import { connectivity, DID as ConDID } from "@elastosfoundation/elastos-connectivity-sdk-js"
import { JWTHeader, JWTParserBuilder, VerifiablePresentation } from '@elastosfoundation/did-js-sdk'

// export class Provider {

  // private appInstanceDIDDocument: DIDDocument // todo
  // private localDataDir: string // todo

  // public constructor(localDataDir: string) {
  //   this.localDataDir = localDataDir
  // }

  export const createHiveContextProvider = (localDataDir) => {
    // let self = this
    return {
      getLocalDataDir: () => localDataDir,
      getAppInstanceDocument: () => Promise.resolve(getAppInstanceDIDDocument()),
      getAuthorization: (jwtToken) => {
        return new Promise(async (resolve, reject) => {
          try {
            const authToken = await generateHiveAuthPresentationJWT(jwtToken)
            resolve(authToken)
          } catch (error) {
            console.log("Generate hive auth presentation JWT error: ", error)
            reject(error)
          }
        })
      }
    }
  }

  let appInstanceDIDDocument

 const getAppInstanceDIDDocument = async () => {
    if (appInstanceDIDDocument === null || appInstanceDIDDocument === undefined) {
      const didAccess = new ConDID.DIDAccess()
      const info = await didAccess.getOrCreateAppInstanceDID()
      const instanceDIDDocument = await info.didStore.loadDid(info.did.toString())
    appInstanceDIDDocument = instanceDIDDocument
    }

    return appInstanceDIDDocument
  }

  const generateHiveAuthPresentationJWT = async (challeng) => {

    if (challeng === null || challeng === undefined || challeng === '') {
      // throw error // todo
    }

    // Parse, but verify on chain that this JWT is valid first
    const JWTParser = new JWTParserBuilder().build()
    const parseResult = await JWTParser.parse(challeng)
    const claims = parseResult.getBody()
    if (claims === undefined) {
      return // 抛出error
    }
    const payload = claims.getJWTPayload()
    const nonce = payload['nonce']
    const hiveDid = claims.getIssuer()
    const appIdCredential = await issueDiplomaFor()
    const presentation = await createPresentation(appIdCredential, hiveDid, nonce)
    const token = await createChallengeResponse(presentation, hiveDid)

    return token
  }

  const createPresentation = async (vc, hiveDid, nonce) => {
    const access = new ConDID.DIDAccess()
    const info = await access.getOrCreateAppInstanceDID()
    const info2 = await access.getExistingAppInstanceDIDInfo()
    const vpb = await VerifiablePresentation.createFor(info.did, null, info.didStore)
    const vp = await vpb.credentials(vc).realm(hiveDid).nonce(nonce).seal(info2.storePassword)
    return vp
  }


  const createChallengeResponse = async (vp, hiveDid) => {
    const exp = new Date()
    const iat = new Date().getTime()
    exp.setFullYear(exp.getFullYear() + 2)
    const expTime = exp.getTime()

    // Create JWT token with presentation.
    const doc = await getAppInstanceDIDDocument()
    const info = await new ConDID.DIDAccess().getExistingAppInstanceDIDInfo()
    const token = await doc.jwtBuilder()
      .addHeader(JWTHeader.TYPE, JWTHeader.JWT_TYPE)
      .addHeader("version", "1.0")
      .setSubject("DIDAuthResponse")
      .setAudience(hiveDid)
      .setIssuedAt(iat)
      .setExpiration(expTime)
      .claimsWithJson("presentation", vp.toString(true))
      .sign(info.storePassword)
    return token
  }

  const issueDiplomaFor = async () =>  {
    const applicationDID = RuntimeContext.getInstance().getAppDid()
    connectivity.setApplicationDID(applicationDID)
    const didAccess = new ConDID.DIDAccess()
    let credential = await didAccess.getExistingAppIdentityCredential()
    if (credential) {
      return credential
    }
    credential = await didAccess.generateAppIdCredential()
    if (credential) {
      return credential
    }
  }
// }

