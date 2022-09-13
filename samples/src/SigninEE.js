
import React, {useState} from 'react'
import { signin, signout, checkSignin } from '@feedsnetwork/feeds-sdk-development';
import {
  useNavigate
} from "react-router-dom";

function SigninEE() {
  const navigate = useNavigate();
  const [login, setLogin] = useState(checkSignin());

  const handleSigninEE = async () => {
    await signin();
    setLogin(checkSignin());
  }

  const handleSignout = async () => {
    await signout();
    setLogin(checkSignin());
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
          <button onClick={()=> handleClickButton('/create')}>Create New Channel</button>
        </div>

    </div>
  );
}

export default SigninEE;
