Vonage video Stream Filter Sample
=======================

As of v2.13 of opentok.js you can pass a custom `videoSource` and `audioSource` to the Publisher. This sample shows how to use this API to apply custom filters to a Publisher. It is very similar to the [Basic Video Chat](../Basic%20Video%20Chat/) example, but it includes a [filters.js](./js/filters.js) file to change between video filters and then publishes a custom video and audio source to the session with Promise-based Client SDK methods.

You can set custom audio and video sources when calling [`await OT.initPublisher.promise(...)`](https://vonage.github.io/conversation-docs/video-js-reference/latest/OT.html#initPublisher). The custom sources are [`MediaStreamTrack`](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack) objects. The sample first awaits [`OT.getUserMedia()`](https://vonage.github.io/conversation-docs/video-js-reference/latest/OT.html#getUserMedia) to get a [`MediaStream`](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream). It attaches the video track to an HTML canvas and manipulates the image, then obtains the filtered track through [`Canvas.captureStream()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream). Finally, it initializes the publisher with `OT.initPublisher.promise()` and awaits the Promise-based session connection, publication, and subscription methods.

## Demo

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/fork/github/Vonage/vonage-video-api-web-samples/tree/main/Stream-Filter)

Enter your credentials in `config.js` and the application will work.

> Note: There is a devDependency `sirv-cli` in the project that is only necessary to run the demo on StackBlitz.

## Running the App

Follow the instructions at [Basic Video Chat](../Basic%20Video%20Chat/)

Open the application in 2 browser windows. Choose a filter from the filter select box.

## Known Limitations

 * The custom streaming API works on Chrome 51+, Firefox 49+ and Safari 11+. It does not work in IE or Edge browsers.
 * If the browser window loses focus (eg. you open a new tab) then the video will pause or become really slow. This is because it is using requestAnimationFrame to draw the video which is limited when the tab is not in focus.
