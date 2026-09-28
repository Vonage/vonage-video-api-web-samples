/* global OT APPLICATION_ID TOKEN SESSION_ID SAMPLE_SERVER_BASE_URL */

let applicationId;
let sessionId;
let token;
const videoEl = document.querySelector('#video');

function handleError(error) {
  if (error) {
    console.error(error);
  }
}

async function initializeSession() {
  const stream = videoEl.captureStream();
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

  let publisher;
  async function publish() {
    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();

    // initialize the publisher
    const publisherOptions = {
      videoSource: videoTracks[0],
      audioSource: audioTracks[0],
      fitMode: 'contain',
      width: 320,
      height: 240
    };
    if (!publisher && videoTracks.length > 0 && audioTracks.length >= 0) {
      stream.removeEventListener('addtrack', publish);
      try {
        publisher = await OT.initPublisher.promise('publisher', publisherOptions);
      } catch (error) {
        videoEl.pause();
        handleError(error);
        return;
      }

      publisher.on('destroyed', () => {
        videoEl.pause();
      });
      videoEl.play();

      try {
        // Connect to the session
        await session.connect.promise(token);

        // If the connection is successful, publish the publisher to the session
        await session.publish.promise(publisher);
      } catch (error) {
        handleError(error);
      }
    }
  }
  stream.addEventListener('addtrack', publish);
  publish();
}

// See the config.js file.
if (APPLICATION_ID && TOKEN && SESSION_ID) {
  applicationId = APPLICATION_ID;
  sessionId = SESSION_ID;
  token = TOKEN;
  if (!videoEl.captureStream) {
    alert('This browser does not support VideoElement.captureStream(). You must use Google Chrome.');
  } else {
    initializeSession();
  }
} else if (SAMPLE_SERVER_BASE_URL) {
  // Make a GET request to get the Vonage Video application ID, session ID, and token from the server
  fetch(SAMPLE_SERVER_BASE_URL + '/session')
  .then((response) => response.json())
  .then((json) => {
    applicationId = json.applicationId;
    sessionId = json.sessionId;
    token = json.token;
    if (!videoEl.captureStream) {
      alert('This browser does not support VideoElement.captureStream(). You must use Google Chrome.');
    } else {
      // Initialize a Vonage Video Session object
      initializeSession();
    }
  }).catch((error) => {
    handleError(error);
    alert('Failed to get Vonage Video sessionId and token. Make sure you have updated the config.js file.');
  });
}
