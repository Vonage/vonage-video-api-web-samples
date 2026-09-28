/* global OT API_KEY TOKEN SESSION_ID SAMPLE_SERVER_BASE_URL */

const publishButton = document.getElementById('publishButton');
const unpublishButton = document.getElementById('unpublishButton');
const panControls = document.getElementById('panControls');
const panValueLabel = document.getElementById('panValueLabel');
const panValueSlider = document.getElementById('panValueSlider');
const errorEl = document.getElementById('error');

let applicationId;
let sessionId;
let token;
let session;
let publisher;
let panner;

function handleError(error) {
  if (error) {
    console.error(error);
    errorEl.innerText = 'Error: ' + error.message;
  }
}

async function initializeSession() {
  if (session && session.isConnected()) {
    session.disconnect();
  }
  session = OT.initSession(applicationId, sessionId);

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
    publishButton.style.display = "none";
    unpublishButton.style.display = "none";
    panControls.style.display = "none";
  });

  try {
    // Connect to the session
    await session.connect.promise(token);
    // If the connection is successful, show publish button
    publishButton.style.display = "block";
  } catch (error) {
    handleError(error);
  }
}

function getAudioBuffer(url, audioContext) {
    return fetch(url)
        .then(res => res.arrayBuffer())
        .then(audioData => new Promise((resolve, reject) => {
          audioContext.decodeAudioData(audioData, resolve, reject);
        }))
}

function setPanValue(value) {
  panner.pan.value = Number(value).toFixed(1);
  panValueLabel.innerText = value;
}

function createAudioStream(audioBuffer, audioContext) {
  const startTime = audioContext.currentTime;

  const player = audioContext.createBufferSource();
  player.buffer = audioBuffer;
  player.start(startTime);
  player.loop = true;

  const destination = audioContext.createMediaStreamDestination();

  // createStereoPanner available in Chrome 42+, Firefox 37+, Edge
  panner = audioContext.createStereoPanner();
  panner.pan.value = 0;
  panner.connect(destination);
  player.connect(panner);

  setPanValue(0);

  return {
    audioStream: destination.stream,
    stop() {
      panner.disconnect();
      player.disconnect();
      player.stop();
    }
  };
}

async function publish() {
  publishButton.style.display = "none";
  panValueSlider.value = 0;
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  let stop;
  try {
    // Create audio stream from mp3 file and video stream from webcam
    const [audioBuffer, videoStream] = await Promise.all([
      getAudioBuffer('./media/funkloop.mp3', audioContext),
      OT.getUserMedia({ audioSource: null })
    ]);
    const audioStreamData = createAudioStream(audioBuffer, audioContext);
    const audioStream = audioStreamData.audioStream;
    stop = audioStreamData.stop;

    // initialize the publisher
    const publisherOptions = {
      insertMode: 'append',
      width: '100%',
      height: '100%',
      // Pass in the video track from our underlying mediaStream as the videoSource
      videoSource: videoStream.getVideoTracks()[0],
      // Pass in the generated audio track as our custom audioSource
      audioSource: audioStream.getAudioTracks()[0],
      // Enable stereo audio
      enableStereo: true,
      // Increasing audio bitrate is recommended for stereo music
      audioBitrate: 128000
    };

    publisher = await OT.initPublisher.promise('publisher', publisherOptions);
  } catch (error) {
    if (stop) {
      stop();
    }
    audioContext.close();
    publishButton.style.display = "block";
    handleError(error);
    return;
  }

  publisher.on('destroyed', () => {
    // When the publisher is destroyed we cleanup
    stop();
    audioContext.close();
    publishButton.style.display = "block";
    unpublishButton.style.display = "none";
    panControls.style.display = "none";
  });

  try {
    // If initialization is successful, publish the publisher to the session
    await session.publish.promise(publisher);
    unpublishButton.style.display = "block";
    panControls.style.display = "block";
  } catch (error) {
    publishButton.style.display = "block";
    handleError(error);
  }
}

function unpublish() {
  publisher.destroy();
  publishButton.style.display = "block";
  unpublishButton.style.display = "none";
  panControls.style.display = "none";
}

function updateValue(event) {
  setPanValue(event.target.value);
}

publishButton.addEventListener('click', publish);
unpublishButton.addEventListener('click', unpublish);
panValueSlider.addEventListener('input', updateValue);
panValueSlider.addEventListener('change', updateValue);

// See the config.js file.
if (APPLICATION_ID && TOKEN && SESSION_ID) {
  applicationId = APPLICATION_ID;
  sessionId = SESSION_ID;
  token = TOKEN;
  initializeSession();
} else if (SAMPLE_SERVER_BASE_URL) {
  // Make a GET request to get the Vonage Video application ID, session ID, and token from the server
  fetch(SAMPLE_SERVER_BASE_URL + '/session')
  .then((response) => response.json())
  .then((json) => {
    applicationId = json.applicationId;
    sessionId = json.sessionId;
    token = json.token;
    // Initialize a Vonage Video Session object
    initializeSession();
  }).catch((error) => {
    handleError(error);
    alert('Failed to get Vonage Video sessionId and token. Make sure you have updated the config.js file.');
  });
}
