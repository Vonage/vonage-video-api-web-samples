/* global OT APPLICATION_ID TOKEN SESSION_ID SAMPLE_SERVER_BASE_URL */

let applicationId;
let sessionId;
let token;

const initializeSession = async () => {
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
      console.error(error);
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
      height: '100%'
    };

    // Check to see if the browser can apply the filter
    if (OT.hasMediaProcessorSupport('video')) {
      publisherOptions.videoFilter = {
        type: 'backgroundBlur',
        blurStrength: 'high'
      };
    }

    const publisher = await OT.initPublisher.promise('publisher', publisherOptions);

    // Connect to the session
    await session.connect.promise(token);

    // If the connection is successful, publish the publisher to the session
    await session.publish.promise(publisher);
  } catch (error) {
    console.error(error);
  }
};

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
    console.error(error);
    alert('Failed to get Vonage Video sessionId and token. Make sure you have updated the config.js file.');
  });
}
