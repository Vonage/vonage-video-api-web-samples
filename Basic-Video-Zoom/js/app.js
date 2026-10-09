import { MediaProcessorConnector } from '../node_modules/@vonage/media-processor/dist/media-processor.es.js';
import { WorkerMediaProcessor } from './media-processor-helper-worker.js';
/* global OT APPLICATION_ID TOKEN SESSION_ID SAMPLE_SERVER_BASE_URL */
/* global ResizeTransformer MediaProcessor MediaProcessorConnector */

let applicationId;
let sessionId;
let token;

const handleError = (error) => {
  if (error) {
    console.error(error);
  }
};

const transformStream = (publisher) => {
  if (OT.hasMediaProcessorSupport()) {
    const mediaProcessor = new WorkerMediaProcessor();
    const mediaProcessorConnector = new MediaProcessorConnector(mediaProcessor);

    publisher
    .setVideoMediaProcessorConnector(mediaProcessorConnector)
    .catch((error) => {
      handleError(error);
    });
  }
};

const initializeSession = async () => {
  const session = OT.initSession(applicationId, sessionId);
  const publisherContainer = document.getElementById('publisher');
  const subscriberContainer = document.getElementById('subscriber');

  // Subscribe to a newly created stream
  session.on('streamCreated', async (event) => {
    const subscriberOptions = {
      insertMode: 'append'
    };
    try {
      await session.subscribe.promise(event.stream, 'subscriber', subscriberOptions);
    } catch (error) {
      handleError(error);
    }
  });

  session.on('streamPropertyChanged', (e) => {
    if (e.changedProperty !== 'videoDimensions') return;
    if (e.stream.connection.id === session.connection.id) {
      // change publisher container size
      const publisher = publisherContainer.getElementsByClassName('OT_publisher')[0];
      const width = (e.newValue.width / e.newValue.height) * 300; // fix height to 300px
      publisher.style.width = `${width}px`;
      publisher.style.height = '200px';
    } else {
      // change subscriber container size
      const subscriber = subscriberContainer.getElementsByClassName('OT_subscriber')[0];
      const width = (e.newValue.width / e.newValue.height) * screen.height * 0.7; // fix height to 0.7*screenHeight
      subscriber.style.width = `${width}px`;
      subscriber.style.height = `${screen.height * 0.7}px`;
    }
  });

  session.on('sessionDisconnected', (event) => {
    console.log('You were disconnected from the session.', event.reason);
  });

  try {
    // initialize the publisher
    const publisherOptions = {
      insertMode: 'append'
    };

    const publisher = await OT.initPublisher.promise('publisher', publisherOptions);

    // Connect to the session
    await session.connect.promise(token);

    // If the connection is successful, publish the publisher to the session
    await session.publish.promise(publisher);
    transformStream(publisher);
  } catch (error) {
    handleError(error);
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
    handleError(error);
    alert('Failed to get Vonage Video sessionId and token. Make sure you have updated the config.js file.');
  });
}
