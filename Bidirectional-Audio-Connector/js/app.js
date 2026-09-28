/* global OT APPLICATION_ID TOKEN SESSION_ID SAMPLE_SERVER_BASE_URL */

let applicationId;
let sessionId;
let token;
let webSocketToken;
let connectionId;

const publishVideoTrueBtn = document.querySelector('#publish-video-true');
const publishVideoFalseBtn = document.querySelector('#publish-video-false');
const audioConnectStartBtn = document.querySelector('#audio-connector-start');
const audioConnectStopBtn = document.querySelector('#audio-connector-stop');

function handleError(error) {
  if (error) {
    console.error(error);
  }
}

async function initializeSession() {
  const session = OT.initSession(applicationId, sessionId);

  // Subscribe to a newly created stream
  session.on('streamCreated', async (event) => {
    const subscriberOptions = {
      insertMode: 'append',
      width: '100%',
      height: '100%'
    };
    try {
      await session.subscribe.promise(event.stream, 'subscriber', subscriberOptions);
    } catch (error) {
      handleError(error);
    }
  });

  session.on('sessionDisconnected', (event) => {
    console.log('You were disconnected from the session.', event.reason);
  });

  try {
    // initialize the publisher
    const publisherOptions = {
      insertMode: 'append',
      width: '100%',
      height: '100%',
      resolution: '1280x720'
    };
    const publisher = await OT.initPublisher.promise('publisher', publisherOptions);

    // fires if user revokes permission to camera and/or microphone
    publisher.on('accessDenied', (event) => {
      alert(event?.message);
    });

    // Connect to the session
    await session.connect.promise(token);

    // If the connection is successful, publish the publisher to the session
    await session.publish.promise(publisher);

    publishVideoTrueBtn.addEventListener('click', async () => {
      try {
        await publisher.publishVideo.promise(true);
        publishVideoTrueBtn.style.display = 'none';
        publishVideoFalseBtn.style.display = 'block';
      } catch (error) {
        handleError(error);
      }
    });

    publishVideoFalseBtn.addEventListener('click', async () => {
      try {
        await publisher.publishVideo.promise(false);
        publishVideoFalseBtn.style.display = 'none';
        publishVideoTrueBtn.style.display = 'block';
      } catch (error) {
        alert('error: ', error);
      }
    });
  } catch (error) {
    handleError(error);
  }
}

async function initializeAudioConnector() {
  try {
    // Make a POST request to the Audio Connector endpoint
    const apiResponse = await fetch(`${SAMPLE_SERVER_BASE_URL}/audio-connector/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        "sessionId": sessionId,
        "webSocketHost": location.host
      })
    });
    const apiResponseJson = await apiResponse.json();
    connectionId = apiResponseJson.connectionId;
  } catch (error) {
    handleError(error);
  };
}

async function stopAudioConnector() {
  try {
    // Make a POST request to the Audio Connector endpoint
    await fetch(`${SAMPLE_SERVER_BASE_URL}/audio-connector/disconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        sessionId,
        connectionId
      })
    });
  } catch (error) {
    handleError(error);
  };
}

audioConnectStartBtn.addEventListener('click',async () => {
  try {
    audioConnectStartBtn.style.display = 'none';
    audioConnectStopBtn.style.display = 'inline';
    await initializeAudioConnector();
  } catch (error) { 
    audioConnectStopBtn.style.display = 'none';
    audioConnectStartBtn.style.display = 'inline';
    handleError(error);
    alert('Failed to connect to the Audio Connector endpoint.',error);
  }
});

audioConnectStopBtn.addEventListener('click',async () => {
  try {
    audioConnectStopBtn.style.display = 'none';
    audioConnectStartBtn.style.display = 'inline';
    await stopAudioConnector();
  } catch (error) { 
    handleError(error);
    alert('Failed to stop the Audio Connector connection.',error);
  }
});

// See the config.js file.
if (SAMPLE_SERVER_BASE_URL) {
  // Make a GET request to get the Vonage Video Application ID, session ID, and token from the server
  fetch(SAMPLE_SERVER_BASE_URL + '/session')
  .then((response) => response.json())
  .then((json) => {
    applicationId = json.applicationId;
    sessionId = json.sessionId;
    token = json.token;
    // Initialize an Vonage Video Session object
    initializeSession();
  }).catch((error) => {
    handleError(error);
    alert('Failed to get Vonage Video sessionId and token. Make sure you have updated the config.js file.');
  });
}
