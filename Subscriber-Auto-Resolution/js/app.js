/* global OT APPLICATION_ID TOKEN SESSION_ID SAMPLE_SERVER_BASE_URL TimelineDataSeries TimelineGraphView */
const resizeInput = document.querySelector('#resizer');
const subscribersContainer = document.querySelector('#subscribers');
const dataGraphsContainer = document.querySelector('#data-graphs');

let applicationId;
let sessionId;
let token;

let intervalIds = {};
let numberOfSubscribers = 0;

resizeInput.addEventListener('input', (event) => {
  subscribersContainer.style.width = `${event.target.value}%`;
});

function handleError(error) {
  if (error) {
    console.error(error);
  }
}

function updateSubscriberNumber(amt) {
  const status = document.querySelector('#status');
  numberOfSubscribers = numberOfSubscribers + amt;
  if (numberOfSubscribers < 2) {
    status.innerHTML = `You need ${2 - numberOfSubscribers} more subscriber${
      2 - numberOfSubscribers === 1 ? '' : 's'
    }. <a href="${
      window.location.href
    }" target="_blank">Click to open in new tab</a>`;
  } else {
    status.innerText = '';
  }
}

function startInterval(subscriber) {
  let prevStats;
  let intervalId;
  const chartDiv = document.createElement('div');
  chartDiv.id = `chart-${subscriber.streamId}`;
  chartDiv.innerHTML = `<br/>
          ID: <span id="chart-${subscriber.streamId}-stream-id"></span><br>
          Bitrate:<br>
          <canvas id="chart-${subscriber.streamId}-canvas"></canvas><br>
          Resolution: <span id="chart-${subscriber.streamId}-resolution"></span>
        `;
  dataGraphsContainer.appendChild(chartDiv);
  document.querySelector(`#chart-${subscriber.streamId}-stream-id`).innerText =
    subscriber.streamId;
  // graph
  let bitrateGraph;
  let bitrateSeries;
  bitrateSeries = new TimelineDataSeries();
  bitrateGraph = new TimelineGraphView(
    `chart-${subscriber.streamId}`,
    `chart-${subscriber.streamId}-canvas`
  );
  bitrateGraph.updateEndDate();

  intervalId = setInterval(async () => {
    try {
      const stats = await subscriber.getStats();
      document.querySelector(
        `#chart-${subscriber.streamId}-resolution`
      ).innerText = `${subscriber.videoElement().videoWidth} x ${
        subscriber.videoElement().videoHeight
      }`;
      if (prevStats) {
        const videoBitRate =
          8 * (stats.video.bytesReceived - prevStats.video.bytesReceived);
        // append to chart
        const now = stats.timestamp;
        bitrateSeries.addPoint(now, videoBitRate);
        bitrateGraph.setDataSeries([bitrateSeries]);
        bitrateGraph.updateEndDate();
      }
      prevStats = stats;
    } catch (error) {
      console.error('Error getting subscriber stats. ', error.message);
    }
  }, 1000);
  intervalIds[subscriber.streamId] = intervalId;
}

async function initializeSession() {
  const session = OT.initSession(applicationId, sessionId);
  updateSubscriberNumber(0);

  // Subscribe to a newly created stream
  session.on('streamCreated', async (event) => {
    const subscriberOptions = {
      insertMode: 'append',
      width: '100%',
      height: '100%',
      preferredResolution: 'auto',
    };
    // create a new div for subscriber
    const subscriberDiv = document.createElement('div');
    subscriberDiv.id = `subscriber-${event.stream.id}`;
    const subscriberIdLabel = document.createElement('label');
    subscriberIdLabel.className = 'subscriber-id-label';
    subscriberIdLabel.innerText = `ID: ${event.stream.id}`;
    subscriberDiv.appendChild(subscriberIdLabel);
    subscribersContainer.appendChild(subscriberDiv);

    try {
      const subscriber = await session.subscribe.promise(
        event.stream,
        `subscriber-${event.stream.id}`,
        subscriberOptions
      );
      startInterval(subscriber);
      updateSubscriberNumber(1);
    } catch (error) {
      handleError(error);
    }
  });

  session.on('sessionDisconnected', (event) => {
    console.log('You were disconnected from the session.', event.reason);
  });

  session.on('streamDestroyed', (event) => {
    clearInterval(intervalIds[event.stream.id]);
    delete intervalIds[event.stream.id];
    document.getElementById(`subscriber-${event.stream.id}`).remove();
    document.getElementById(`chart-${event.stream.id}`).remove();
    updateSubscriberNumber(-1);
  });

  try {
    // initialize the publisher
    const publisherOptions = {
      insertMode: 'append',
      width: '100%',
      height: '100%',
      resolution: '1920x1080',
    };

    const publisher = await OT.initPublisher.promise(
      'publisher',
      publisherOptions
    );

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
  // Make a GET request to get the Vonage Video Application ID, session ID, and token from the server
  fetch(SAMPLE_SERVER_BASE_URL + '/session')
    .then((response) => response.json())
    .then((json) => {
      applicationId = json.applicationId;
      sessionId = json.sessionId;
      token = json.token;
      // Initialize a Vonage Video Session object
      initializeSession();
    })
    .catch((error) => {
      handleError(error);
      alert(
        'Failed to get Vonage Video sessionId and token. Make sure you have updated the config.js file.'
      );
    });
}
