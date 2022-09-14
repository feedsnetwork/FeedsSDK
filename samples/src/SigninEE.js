
import React, {useState} from 'react'
import { signin, signout, checkSignin, RuntimeContext } from '@feedsnetwork/feeds-sdk-development';
import {
  useNavigate
} from "react-router-dom";

function SigninEE() {
  const navigate = useNavigate();
  const [login, setLogin] = useState(checkSignin());
  const applicationDid = 'did:elastos:iZvAak2SUHaKwBHmPFsgtVVMGtTpi4r2kY'
  const currentNet = "mainnet".toLowerCase()
  const localDataDir = "/data/userDir/data/store/develop"
  const resolveCache = '/data/userDir/data/store/catch'
  const appCtx = RuntimeContext.initialize(applicationDid, currentNet, localDataDir, resolveCache)
  const handleSigninEE = async () => {
    const myprofile = await signin(appCtx);

    console.log(`name: ${myprofile.getName()}`);
    console.log(`description: ${myprofile.getDescription()}`);

    setLogin(checkSignin(appCtx));
  }

  const handleSignout = async () => {
    await signout(appCtx);
    setLogin(checkSignin(appCtx));
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
