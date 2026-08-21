/* global OT APPLICATION_ID TOKEN SESSION_ID SAMPLE_SERVER_BASE_URL */

const enableBtn = document.querySelector('#enable');
const disableBtn = document.querySelector('#disable');

let applicationId;
let sessionId;
let token;

async function initializeSession() {
  if (!OT.hasMediaProcessorSupport('audio')) {
    enableBtn.style.display = 'none';
    disableBtn.style.display = 'none';
    console.log('Browser does not support media processors');
    alert('Browser does not support media processors.');
  }
  const session = OT.initSession(applicationId, sessionId);

  // Subscribe to a newly created stream
  session.on('streamCreated', async (event) => {
    const subscriberOptions = {
      insertMode: 'append',
      width: '100%',
      height: '100%',
    };
    try {
      await session.subscribe(
        event.stream,
        'subscriber',
        subscriberOptions,
      );
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
      height: '100%',
      resolution: '1280x720',
    };
    const publisher = await OT.initPublisher.promise(
      'publisher',
      publisherOptions
    );

    // Connect to the session
    await session.connect.promise(token);
    
    // If the connection is successful, publish the publisher to the session
    await session.publish.promise(publisher);

    enableBtn.addEventListener('click', async () => {
      try {
        await publisher.applyAudioFilter({
          type: 'advancedNoiseSuppression',
        });
        enableBtn.style.display = 'none';
        disableBtn.style.display = 'block';
        console.log(publisher.getAudioFilter());
      } catch (error) {
        console.error(error);
      }
    });

    disableBtn.addEventListener('click', async () => {
      try {
        await publisher.clearAudioFilter();
        disableBtn.style.display = 'none';
        enableBtn.style.display = 'block';
        console.log(publisher.getAudioFilter());
      } catch (error) {
        console.error(error);
      }
    });
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
  // Make a GET request to get the Vonage Video Application ID, session ID, and token from the server
  fetch(SAMPLE_SERVER_BASE_URL + '/session')
    .then((response) => response.json())
    .then((json) => {
      applicationId = json.applicationId;
      sessionId = json.sessionId;
      token = json.token;
      // Initialize an Vonage Video Session object
      initializeSession();
    })
    .catch((error) => {
      console.error(error);
      alert(
        'Failed to get Vonage Video sessionId and token. Make sure you have updated the config.js file.'
      );
    });
}
