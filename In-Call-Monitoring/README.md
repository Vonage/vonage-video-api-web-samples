Vonage Video In-Call Monitoring Sample
=======================

This sample application demonstrates the [`qualityScoreChanged`](https://vonage.github.io/video-docs/video-js-reference/latest/QualityScoreChangedEvent.html) (based on the subscriber's audio/video [MOS](https://en.wikipedia.org/wiki/Mean_opinion_score)) and [`cpuPerformanceChanged`](https://vonage.github.io/video-docs/video-js-reference/latest/CpuPerformanceChanged.html) (real-time indication of device performance related to CPU pressure) events.

## Demo

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/fork/github/Vonage/vonage-video-api-web-samples/tree/main/In-Call-Monitoring)

Enter your credentials in `config.js` and the application will work.

> Note: There is a devDependency `sirv-cli` in the project that is only necessary to run the demo on StackBlitz.

## Running the App

*Important:* Read the following sections of the main README file for the repository to set up
and test the application:

* [Setting up the test web service](../README.md#setting-up-the-test-web-service)
* [Configuring the application](../README.md#configuring-the-application)
* [Testing the application](../README.md#testing-the-application)

## Getting an Vonage Video session ID, token, and Application ID

A Vonage Video session connects different clients letting them share audio-video streams and send
messages. Clients in the same session can include iOS, Android, and web browsers.

**Session ID** -- Each client that connects to the session needs the session ID, which identifies
the session. Think of a session as a room, in which clients meet. Depending on the requirements of
your application, you will either reuse the same session (and session ID) repeatedly or generate
new session IDs for new groups of clients.

*Important*: This demo application assumes that only two clients -- the local Web client and
another client -- will connect in the same Vonage Video session. For test purposes, you can reuse the
same session ID each time two clients connect. However, in a production application, your
server-side code must create a unique session ID for each pair of clients. In other applications,
you may want to connect many clients in one Vonage Video session (for instance, a meeting room) and
connect others in another session (another meeting room).

**Token** -- The client also needs a token, which grants them access to the session. Each client is
issued a unique token when they connect to the session. Since the user publishes an audio-video
stream to the session, the token generated must include the publish role (the default). For more
information about tokens, see the Vonage Video [Token creation
overview](https://developer.vonage.com/en/video/guides/create-token).

**Application ID** -- The Application ID identifies your Vonage developer account's application.

Upon starting up, the application executes the following code in the app.js file:

```javascript
// See the config.js file.
if (APPLICATION_ID && TOKEN && SESSION_ID) {
  applicationId = APPLICATION_ID;
  sessionId = SESSION_ID;
  token = TOKEN;
  initializeSession();
} else if (SAMPLE_SERVER_BASE_URL) {
  // Make a GET request to get the Vonage Application ID, session ID, and token from the server
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
    alert('Failed to get Vonage Video applicationId, sessionId, and token. Make sure you have updated the config.js file.');
  });
}
```

This method checks to see if you've set hardcoded values for the Vonage Video Application ID, session ID, and
token. If not, it makes a GET request to the "/session" endpoint of the web service.
The web service returns an HTTP response that includes the session ID, the token, and Application ID
formatted as JSON data:

    {
         "sessionId": "2_MX40NDQ0MzEyMn5-fn4",
         "applicationId": "67c891c9-5ab5-4c20-b4dd-5d277dee9a9e",
         "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmYWI2MTZhMi1hZmIyLTQ0OWQtOWZhNy01..."
    }

For more information, see the main README file of this repository.

## Connecting to the session

Upon obtaining the session ID, token, and Application ID, the app calls the asynchronous `initializeSession()` method. It first initializes a Session object:

```javascript
const session = OT.initSession(applicationId, sessionId);
```

The `Session.connect.promise()` method connects the client to the session and resolves when the connection is complete:

```javascript
try {
  await session.connect.promise(token);
} catch (error) {
  handleError(error);
}
```

If the connection fails, the Promise rejects and execution moves to the `catch` block.

The Session object dispatches a `sessionDisconnected` event when the client disconnects:

```javascript
session.on('sessionDisconnected', (event) => {
  console.log('You were disconnected from the session.', event.reason);
});
```

## Publishing an audio-video stream to the session

The publisher is initialized with `OT.initPublisher.promise()`. The Promise resolves with the Publisher object when initialization succeeds:

```javascript
const publisherOptions = {
  insertMode: 'append',
  width: '100%',
  height: '100%',
  resolution: '1280x720'
};
const publisher = await OT.initPublisher.promise('publisher', publisherOptions);
```

After connecting, the app awaits `Session.publish.promise()`:

```javascript
await session.connect.promise(token);
await session.publish.promise(publisher);
```

These calls are inside a `try/catch` block so initialization, connection, and publication failures are handled together.

## Subscribing to another client's audio-video stream

The Session object dispatches a `streamCreated` event when another client publishes a stream. The asynchronous event handler awaits `Session.subscribe.promise()`, which resolves with the Subscriber object used to register the quality monitoring event:

```javascript
session.on('streamCreated', async (event) => {
  const subscriberOptions = {
    insertMode: 'append',
    width: '100%',
    height: '100%'
  };

  try {
    const subscriber = await session.subscribe.promise(
      event.stream,
      'subscriber',
      subscriberOptions
    );
    subscriber.on('qualityScoreChanged', (scores) => {
      // Update the audio and video quality meters from scores.qualityScore.
    });
  } catch (error) {
    handleError(error);
  }
});
```

`Session.subscribe.promise()` takes the Stream object, an optional target element, and optional subscriber properties. It rejects if the subscription cannot be created.
