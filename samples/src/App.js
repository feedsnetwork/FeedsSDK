import SigninEE from './SigninEE'
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
