/* global OT APPLICATION_ID TOKEN SESSION_ID SAMPLE_SERVER_BASE_URL */

let applicationId;
let sessionId;
let token;

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

  const randomColour = () => {
    return Math.round(Math.random() * 255);
  };

  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');

  // Draw a random colour in the Canvas every 3 seconds
  const interval = setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = `rgb(${randomColour()}, ${randomColour()}, ${randomColour()})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, 3000);

  // initialize the publisher
  const publisherOptions = {
    insertMode: 'append',
    width: '100%',
    height: '100%',
    videoSource: canvas.captureStream(3).getVideoTracks()[0] // Use canvas.captureStream at 3 fps and pass the video track to the Publisher
  };

  let publisher;
  try {
    publisher = await OT.initPublisher.promise('publisher', publisherOptions);
  } catch (error) {
    clearInterval(interval);
    handleError(error);
    alert(error.message);
    return;
  }

  publisher.on('destroyed', () => {
    clearInterval(interval);
  });

  try {
    // Connect to the session
    await session.connect.promise(token);

    // If the connection is successful, publish the publisher to the session
    await session.publish.promise(publisher);
  } catch (error) {
    handleError(error);
  }
}

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