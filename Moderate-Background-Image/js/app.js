import {
  createVonageMediaProcessor
} from '../node_modules/@vonage/ml-transformers/dist/ml-transformers.es.js';

/* global OT APPLICATION_ID TOKEN SESSION_ID SAMPLE_SERVER_BASE_URL */
/* global MediaProcessorConnector */

const bgUrl1 = `https://${window.location.hostname}/images/bg-1.jpg`;
const bgUrl2 = `https://${window.location.hostname}/images/bg-2.jpg`;
const applyButtonsContainer = document.getElementById("buttons");

let applicationId;
let sessionId;
let token;

const config = {
  transformerType: "VirtualBackground",
  backgroundAssetUri: bgUrl1
};

const processor = await createVonageMediaProcessor(config);

const handleError = (error) => {
  if (error) {
    console.error(error);
  }
};

const transformStream = (publisher) => {
  if (OT.hasMediaProcessorSupport()) {
    publisher
      .setVideoMediaProcessorConnector(processor.getConnector())
      .catch((e) => {
        console.error(e);
      });
  } else {
    console.log('Browser does not support media processors');
  }
};

const applyBackground = (assetUri) => {
  config.backgroundAssetUri = assetUri;
  processor.setBackgroundOptions(config);
};

applyButtonsContainer.addEventListener("click", (event) => {
  if (event.target.id === "apply-img-1") {
    applyBackground(bgUrl1);
  } else if (event.target.id === "apply-img-2") {
    applyBackground(bgUrl2);
  }
});

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
      handleError(error);
    }
  });

  try {
    // initialize the publisher
    const publisherOptions = {
      insertMode: 'append',
      width: '100%',
      height: '100%'
    };
    const publisher = await OT.initPublisher.promise('publisher', publisherOptions);

    // Connect to the session
    await session.connect.promise(token);

    // If the connection is successful, publish the publisher to the session
    // and transform stream
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
