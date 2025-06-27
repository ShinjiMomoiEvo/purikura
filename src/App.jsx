import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Purikura from './Purikura.jsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
        <Purikura />
    </>
  )
}

export default App
