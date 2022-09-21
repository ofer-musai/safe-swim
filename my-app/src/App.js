import React, { useEffect, useState } from "react";
import "./App.css";
import alarmSrc from "./alarm.wav";

let intervalId = null;
const INTERVAL_DELAY = 1000;
const RETRY_MAX = 3;

const sound = new Audio(alarmSrc);
sound.loop = true;

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 2000 } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);
  return response;
}

const getData = async () => {
  const res = await fetchWithTimeout("http://192.168.4.1/status");
  const data = await res.json();
  console.log("data", data);
  return data;
};

const ConnectionStep = ({ onNext, isMockServer }) => {
  const [error, setError] = useState(false);

  const connect = (isMockServer) => {
    let retryCount = 0;

    const polling = async () => {
      if (isMockServer) {
        setTimeout(() => {
          onNext();
        }, 1000);
        return;
      }

      try {
        const data = await getData();
        console.log("data", data);
        onNext();
      } catch (e) {
        console.log("e", e);
        if (retryCount < RETRY_MAX) {
          retryCount++;
          setTimeout(() => {
            polling();
          }, 1000);
        } else {
          setError(true);
        }
      }
    };
    polling();
  };

  useEffect(() => {
    connect(isMockServer);
  }, []);

  const reconnect = () => {
    connect();
    setError(false);
  };

  if (error) {
    return (
      <div className="step-container">
        <div className="description">Cant connect to device.</div>
        <div className="btn" onClick={reconnect}>
          Reconnect
        </div>
      </div>
    );
  }

  return (
    <div className="step-container">
      <div className="description">
        First let's see if the connection its working.
      </div>
      <div className="loader" />
      <div></div>
    </div>
  );
};

const TestingStep = ({ onNext, isMockServer }) => {
  const [isTested, setIsTested] = useState(false);

  useEffect(() => {
    const polling = async () => {
      if (isMockServer) {
        setTimeout(() => {
          setIsTested(true);
        }, INTERVAL_DELAY * 2);

        return;
      }

      const data = await getData();

      if (!isTested && data === 1) {
        setIsTested(true);
      }
    };

    polling();
    intervalId = setInterval(polling, INTERVAL_DELAY);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="step-container">
      <div className="description">Make sure to test it before using it</div>
      <div className={`icon testing-icon ${isTested ? "enable" : "disable"}`} />
      <div
        className={`btn ${isTested ? "enable" : "disable"}`}
        onClick={isTested ? onNext : () => {}}
      >
        Done
      </div>
    </div>
  );
};

let isMockReturnActiveCurrIndex = 1;
const MOCK_RETURNS_ACTIVE_INDEX = 14;

const Main = ({ isMockServer }) => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const polling = async () => {
      const data = await getData();
      setIsActive(data === 1);
    };

    const mockPolling = () => {
      setIsActive(isMockReturnActiveCurrIndex % MOCK_RETURNS_ACTIVE_INDEX > 7);
      isMockReturnActiveCurrIndex =
        (isMockReturnActiveCurrIndex + 1) % MOCK_RETURNS_ACTIVE_INDEX;
    };

    intervalId = setInterval(
      isMockServer ? mockPolling : polling,
      INTERVAL_DELAY
    );

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (isActive) {
      sound.currentTime = 0;
      sound.play();
    } else {
      sound.pause();
    }
  }, [isActive]);

  const muteSound = () => {
    sound.pause();
  };

  return (
    <>
      <div className="image" />
      <div
        onClick={muteSound}
        className={`status ${isActive ? "active" : "in-active"}`}
      >
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
  const [isMockServer, setIsMockServer] = useState(false);

  const mockServerButtonHandler = () => {
    const newIsMockServer = !isMockServer;
    if (newIsMockServer) {
      setStep(2);
    }

    setIsMockServer(newIsMockServer);
  };

  const onNext = () => {
    setStep(step + 1);
  };

  const Comp = step === 3 ? Main : step === 2 ? TestingStep : ConnectionStep;

  return (
    <div className="App">
      <button className="mock-button" onClick={mockServerButtonHandler}>
        Mock Server
      </button>
      {isMockServer && <div className="demo-text">Demo</div>}
      <div className="header">
        <div className="header-logo" />
        <div className="header-text">Safe Swim</div>
      </div>
      <div className="content">
        <div className="image" />
        <Comp onNext={onNext} isMockServer={isMockServer} />
      </div>

      <div className="wave pre-loading"></div>
    </div>
  );
}

export default App;
