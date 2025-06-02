import React from 'react'
import LoginForm from '../LogInReg/Login'
import RegisterForm from '../LogInReg/Register';
import background from '../../Images/background.jpg'
import { useState } from 'react';



const LogInRegRotation = () => {

      const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="h-full flex items-center justify-center"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
       
      <div className="w-full max-w-md -mt-96 bg-indigo-300">

        <div
          className={`relative w-full transform transition-transform duration-700 preserve-3d ${
            flipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Front: Login */}
          <div className="absolute w-full backface-hidden">
            <LoginForm onSwitch={() => setFlipped(true)} />
          </div>

          {/* Back: Registration */}
          <div className="absolute w-full backface-hidden rotate-y-180">
            <RegisterForm onSwitch={() => setFlipped(false)} />
          </div>
        </div>
      </div>
    </div>

  )
}

export default LogInRegRotation