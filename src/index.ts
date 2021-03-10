/* eslint-disable import/no-unresolved */
/// Zappar for ThreeJS Examples
/// Look-For Prompt

// In this image tracked example we'll use a variable to detect if
// the user is viewing the tracked image. If they are not, we will
// show a hint HTML Element prompting the user to do so.

import * as THREE from 'three';
import * as ZapparThree from '@zappar/zappar-threejs';

import targetImage from '../assets/example-tracking-image.zpt';

import './index.sass';

// The SDK is supported on many different browsers, but there are some that
// don't provide camera access. This function detects if the browser is supported
// For more information on support, check out the readme over at
// https://www.npmjs.com/package/@zappar/zappar-threejs
if (ZapparThree.browserIncompatible()) {
  // The browserIncompatibleUI() function shows a full-page dialog that informs the user
  // they're using an unsupported browser, and provides a button to 'copy' the current page
  // URL so they can 'paste' it into the address bar of a compatible alternative.
  ZapparThree.browserIncompatibleUI();

  // If the browser is not compatible, we can avoid setting up the rest of the page
  // so we throw an exception here.
  throw new Error('Unsupported browser');
}

// ZapparThree provides a LoadingManager that shows a progress bar while
// the assets are downloaded. You can use this if it's helpful, or use
// your own loading UI - it's up to you :-)
const manager = new ZapparThree.LoadingManager();

// Construct our ThreeJS renderer and scene as usual
const renderer = new THREE.WebGLRenderer({ antialias: true });
const scene = new THREE.Scene();
document.body.appendChild(renderer.domElement);

// As with a normal ThreeJS scene, resize the canvas if the window resizes
renderer.setSize(window.innerWidth, window.innerHeight);
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Create a Zappar camera that we'll use instead of a ThreeJS camera
const camera = new ZapparThree.Camera();

// In order to use camera and motion data, we need to ask the users for permission
// The Zappar library comes with some UI to help with that, so let's use it
ZapparThree.permissionRequestUI().then((granted) => {
  // If the user granted us the permissions we need then we can start the camera
  // Otherwise let's them know that it's necessary with Zappar's permission denied UI
  if (granted) camera.start();
  else ZapparThree.permissionDeniedUI();
});

// The Zappar component needs to know our WebGL context, so set it like this:
ZapparThree.glContextSet(renderer.getContext());

// Set the background of our scene to be the camera background texture
// that's provided by the Zappar camera
scene.background = camera.backgroundTexture;

// Set an error handler on the loader to help us check if there are issues loading content.
// eslint-disable-next-line no-console
manager.onError = (url) => console.log(`There was an error loading ${url}`);

// Create a zappar image_tracker and wrap it in an image_tracker_group for us
// to put our ThreeJS content into
// Pass our loading manager in to ensure the progress bar works correctly
const imageTracker = new ZapparThree.ImageTrackerLoader(manager).load(targetImage);
const imageTrackerGroup = new ZapparThree.ImageAnchorGroup(camera, imageTracker);
const contentGroup = new THREE.Group();

// Add our image tracker group into the ThreeJS scene
scene.add(imageTrackerGroup);

// Define our prompt element and make it show by default
const Prompt = <HTMLDivElement>document.getElementById('Prompt');
Prompt.style.display = 'block';

// Create a variable to discern when the target is
// and is not 'seen' (in view)
let targetSeen = false;

// Create a plane geometry mesh for the background
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(3.07, 2.05),
  new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    color: new THREE.Color(0, 0, 0),
    transparent: true,
    opacity: 0.8,
  }),
);

// add our content to the tracking group.
contentGroup.add(plane);

// when we lose sight of the camera, hide the scene contents
// & show our HTML Element prompt
imageTracker.onVisible.bind(() => {
  // Always hide the prompt if the target image is in view
  Prompt.style.display = 'none';

  if (!targetSeen) {
    // If target was once not seen:
    targetSeen = true;
  }
});

// TARGET NOT SEEN
imageTracker.onNotVisible.bind(() => {
  if (targetSeen) {
    // If target was once seen:
    targetSeen = false;

    // Hide the prompt if the target image was previously in view
    // NOTE: We don't put this outside the if function because we
    // want to make sure that it always displays on launch
    Prompt.style.display = 'block';
  }
});

// Use a function to render our scene as usual
function render(): void {
  // The Zappar camera must have updateFrame called every frame
  camera.updateFrame(renderer);

  // Draw the ThreeJS scene in the usual way, but using the Zappar camera
  renderer.render(scene, camera);

  // Call render() again next frame
  requestAnimationFrame(render);
}

// Start things off
render();
