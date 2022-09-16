import React, {useState} from 'react'
import {RuntimeContext } from '@feedsnetwork/feeds-sdk-development';
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
    await myprofile.queryOwnedChannelCount()
    setLogin(appCtx.checkSignin());
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
