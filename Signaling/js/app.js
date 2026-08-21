/* global APPLICATION_ID TOKEN SESSION_ID SAMPLE_SERVER_BASE_URL OT */
/* eslint-disable no-alert */

let applicationId;
let session;
let sessionId;
let token;

async function initializeSession() {
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
      console.error(error);
    }
  });

  session.on('sessionDisconnected', (event) => {
    console.error('You were disconnected from the session.', event.reason);
  });

  try {
    // Initialize the publisher
    const publisherOptions = {
      insertMode: 'append',
      width: '100%',
      height: '100%'
    };
    const publisher = await OT.initPublisher.promise('publisher', publisherOptions);

    // Connect to the session
    await session.connect.promise(token);

    // If the connection is successful, publish the publisher to the session
    await session.publish.promise(publisher);

    // Receive a message and append it to the history
    const msgHistory = document.querySelector('#history');
    session.on('signal:msg', (event) => {
      const msg = document.createElement('p');
      msg.textContent = event.data;
      msg.className = event.from.connectionId === session.connection.connectionId ? 'mine' : 'theirs';
      msgHistory.appendChild(msg);
      msg.scrollIntoView();
    });
  } catch (error) {
    console.error(error);
  }
};

// Text chat
const form = document.querySelector('form');
const msgTxt = document.querySelector('#msgTxt');

// Send a signal once the user enters data in the form
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    await session.signal({
      type: 'msg',
      data: msgTxt.value
    });
    msgTxt.value = '';
  } catch (error) {
    console.error(error);
  }
});

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
