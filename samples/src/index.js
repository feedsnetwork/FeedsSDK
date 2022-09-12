import React from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import { Web3ReactProvider } from '@web3-react/core'
import { Web3Provider } from "@ethersproject/providers";
import App from './App';
import MyProfile from './myprofile'

const getLibrary = (provider) => {
  const library = new Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
};

const RouterCom = ()=>{
  return <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path='/myprofile' element={MyProfile}/>
    </Routes>
  </BrowserRouter>
}
ReactDOM.render(
  <Web3ReactProvider getLibrary={getLibrary}>
    <RouterCom />
  </Web3ReactProvider>,
  document.getElementById('root')
);
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
