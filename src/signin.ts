
import { VerifiablePresentation, DefaultDIDAdapter, DIDBackend } from '@elastosfoundation/did-js-sdk';
import { DID, connectivity } from '@elastosfoundation/elastos-connectivity-sdk-js';
import { EssentialsConnector } from '@elastosfoundation/essentials-connector-client-browser';
import { AppContext, ApplicationNotFoundException } from '@elastosfoundation/hive-js-sdk/typings';
//import { statSync } from 'fs';
import { MyProfile } from "./myprofile"

import { Logger } from './utils/logger'

const logger = new Logger("Authentication")

const essentialsConnector = new EssentialsConnector();
const isInAppBrowser = () => window['elastos'] !== undefined && window['elastos'].name === 'essentialsiab';
let connectivityInitialized = false;
let isSignin = false;

const isUsingEssentialsConnector = () => {
    const activeConnector = connectivity.getActiveConnector();
    return activeConnector && activeConnector.name === essentialsConnector.name;
}

const initConnectivitySDK = async () => {
    if (connectivityInitialized) return;

    console.log('Preparing the Elastos connectivity SDK');

    // unregistear if already registerd
    const arrIConnectors = connectivity.getAvailableConnectors();
    if (arrIConnectors.findIndex((option) => option.name === essentialsConnector.name) !== -1) {
        await connectivity.unregisterConnector(essentialsConnector.name);
        console.log('unregister connector succeed.');
    }

    await connectivity.registerConnector(essentialsConnector).then(async () => {
        connectivity.setApplicationDID("");
        connectivityInitialized = true;

        console.log('essentialsConnector', essentialsConnector);
        console.log('Wallet connect provider', essentialsConnector.getWalletConnectProvider());

        const hasLink = isUsingEssentialsConnector() && essentialsConnector.hasWalletConnectSession();
        console.log('Has link to essentials?', hasLink);

        // Restore the wallet connect session - TODO: should be done by the connector itself?
        if (hasLink && !essentialsConnector.getWalletConnectProvider().connected)
            await essentialsConnector.getWalletConnectProvider().enable();
    });
}

const signOutWithEssentials = async () => {
    if (isUsingEssentialsConnector() && essentialsConnector.hasWalletConnectSession()) {
        await essentialsConnector.disconnectWalletConnect().catch (error => {
            console.log("Error while disconnecting the Essentials wallet", error);
        })
    }

    if (isInAppBrowser() && (await window['elastos'].getWeb3Provider().isConnected())) {
        await window['elastos'].getWeb3Provider().disconnect().catch (error => {
            console.log("Error while disconnecting the wallet")
        })
    }
};

const signInWithEssentials = async (appContext: AppContext): Promise<MyProfile> => {
    await initConnectivitySDK().catch(error => {
        throw new Error("");
    })

    const didAccess = new DID.DIDAccess();
    const claims = [
        DID.simpleIdClaim('Your avatar', 'avatar', false),
        DID.simpleIdClaim('Your name', 'name', false),
        DID.simpleIdClaim('Your description', 'description', false)
    ]

    await didAccess.requestCredentials({ claims: claims }).then (presentation => {

        const did = presentation.getHolder().getMethodSpecificId() || '';

        //DIDBackend.initialize(new DefaultDIDAdapter(DidResolverUrl));

        const vp = VerifiablePresentation.parse(JSON.stringify(presentation.toJSON()));
        const hoderDid = vp.getHolder().toString();
        if (!hoderDid) {
            logger.error('Unable to extract owner DID from the presentation')
            throw new Error("");
        }
        // Optional name
        const nameCredential = vp.getCredential(`name`);
        const name = nameCredential ? nameCredential.getSubject().getProperty('name') : '';
        // Optional bio
        const bioCredential = vp.getCredential(`description`);
        const bio = bioCredential ? bioCredential.getSubject().getProperty('description') : '';

        let essentialAddress = essentialsConnector.getWalletConnectProvider().wc.accounts[0]
        if (isInAppBrowser())
            essentialAddress = window['elastos'].getWeb3Provider().addres

        return new MyProfile();
    }).catch (async error => {
        await essentialsConnector.getWalletConnectProvider().disconnect();
        throw new Error("");
    }).catch (error => {
        throw new Error(error);
    }).finally (()=> {
        throw new Error("");
    })

    return new MyProfile();
}

const signin = async (appContext: AppContext): Promise<MyProfile> => {
    if (isUsingEssentialsConnector()) {
      await signOutWithEssentials();
    } else if (essentialsConnector.hasWalletConnectSession()) {
      await essentialsConnector.disconnectWalletConnect();
    }

    let result = await signInWithEssentials(appContext);
    isSignin = true;
    return result;
}

const signout = async () => {
  await signOutWithEssentials();
  isSignin = false;
}

const checkSignin = () => {
  return isSignin;
}

export {
    signin,
    signout,
    checkSignin
}