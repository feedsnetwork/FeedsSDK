import SigninEE from './SigninEE'
<<<<<<< HEAD
import { initialize, getNftsOnMarketPlace } from '@pasarprotocol/pasar-sdk-development';
import { useEffect } from 'react';

function App() {

  useEffect(() => {
    initialize();
    getNFT();
  }, [])

  const getNFT = async () => {
    let result = await getNftsOnMarketPlace();
    console.log(result);
=======
import { useEffect } from 'react';


function App() {
  useEffect(() => {
    getNFT();
  }, [])


  const getNFT = async () => {
    console.log("getNFT");
>>>>>>> d3ec102 (Update a new version)
  }

  return (
    <div className="App">
      <header className="App-header">
        <SigninEE/>
      </header>
    </div>
  );
}

export default App;
