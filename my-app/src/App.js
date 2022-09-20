import React, {useEffect, useState} from 'react';
import './App.css';
import alarmSrc from './alarm.wav';

let intervalId = null;
const INTERVAL_DELAY = 1000;

const sound = new Audio(alarmSrc);
sound.loop = true;

const getData = async () => {
    const res = await fetch('http://192.168.4.1/status');
    const data = await res.json();
    console.log('data', data);
    return data;
}



const ConnectionStep = ({onNext}) => {
    return  (
        <div className="step-container">
            <div className="description">First lets see if the connection its working</div>
            <div className="btn" onClick={onNext}>Next</div>
        </div>
    )
};


const TestingStep = ({onNext}) => {
    return  (
        <div className="step-container">
            <div className="description">Make sure to text it before using it</div>
            <div className="btn" onClick={onNext}>Next</div>
        </div>
    )
};

const Main = () => {
    const [isActive, setIsActive] = useState(false);
    useEffect(() => {
        const polling = async () => {
            const data = await getData();
            setIsActive(data === 1);
        };

        polling();
        intervalId = setInterval(polling, INTERVAL_DELAY);

        return () => {
            clearInterval(intervalId)
        }
    }, []);

    useEffect(() => {
        if(isActive) {
            sound.currentTime = 0;
            sound.play();
        }else {
            sound.pause();
        }
    }, [isActive]);


    const muteSound = () => {
        sound.pause();
    };

    return (
            <>
                <div className="image"/>
                <div onClick={muteSound} className={`status ${isActive ? 'active' : 'in-active' }`}>
                    <div className="ocean">
                        <div className="wave"></div>
                        <div className="wave"></div>
                    </div>

                </div>
            </>
    );
};


function App() {
    const [step, setStep] = useState(1);

    const onNext = () => {
        setStep(step + 1)
    }

    const Comp = step === 3 ? Main : step === 2 ? TestingStep : ConnectionStep;


    return (
        <div className="App">
            <div className="header">
                <div className="header-logo"/>
                <div className="header-text">Safe Swim</div>
            </div>
            <div className="content">
                <div className="image"/>
                <Comp onNext={onNext}/>
            </div>
        </div>
    )

}

export default App;
