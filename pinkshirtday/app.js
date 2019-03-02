// IMPORTANT: You will need to have a server running for the sketch to load locally (due to audio track), see readme
let video;
let poseNet;
let poses = [];
let strokehue = 0;
let strokesaturation = 0;
let videoShowing = false;
let song;
let analyzer;
let speed = 1.0;
let x = 0;
let slowdown = false;
let rms;

//Have song ready before the canvas displays
preload = () => {
  song = loadSound("../assets/cantstopmyfeet.mp3");
};

setup = () => {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.size(width, height); // video should be squares

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video, modelReady);

  // This sets up an event that fills the global variable "poses"
  // with an array every time new poses are detected
  poseNet.on("pose", function(results) {
    poses = results;
  });

  // Hide the video element, and just show the canvas
  video.hide();

  // button to hide the video
  button = createButton("Show Video");
  button.mousePressed(toggleVideo);

  // create a new Amplitude analyzer
  analyzer = new p5.Amplitude();
  // Patch the input to an volume analyzer
  analyzer.setInput(song);

  // set colour mode to HSB, 360, 100, 100, 1
  colorMode(HSB);

  // no fill in the circles
  noFill();
  song.play();
  song.setLoop(true);
};

modelReady = () => {
  console.log("model ready");
};

draw = () => {
  // Get audio amplitude
  rms = analyzer.getLevel();
  // reverse image horizontally so it looks like a mirror
  scale(-1, 1);
  translate(-width, 0);
  // Change background color based on the audio amplitude
  bkg = map(rms, 0, 1, 300, 340);
  background(bkg, 30, 75, 0.4);

  // Display the video behind the sketch (if the button has been toggled)
  if (videoShowing) {
    image(video, 0, 0, width, height);
  }

  // Make the lines change color based on wrist position
  stroke(strokehue, strokesaturation, 50);

  // Draw figure
  drawKeypoints();

  // Slow down the speed of the song if no one is in the frame
  slowDown();
};

// get a number close to a given number
const slop = 30;
const sloppy = num => num + random(-slop, slop);
const sloppyline = (p1, p2) =>
  line(sloppy(p1.x), sloppy(p1.y), sloppy(p2.x), sloppy(p2.y));
const sloppycircle = (x, y, r) =>
  ellipse(sloppy(x), sloppy(y), sloppy(r), sloppy(r));

// A function to draw ellipses over the detected keypoints
drawKeypoints = () => {
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i++) {
    // For each pose detected, loop through all the keypoints
    let keypoints = poses[i].pose.keypoints;
    for (let j = 0; j < keypoints.length; j++) {
      // A keypoint is an object describing a body part (like rightArm or leftShoulder)
      let keypoint = keypoints[j];
      // Only do the following if the pose probability is bigger than 0.2, in this case it slows down the music
      if (keypoint.score < 0.2) {
        slowdown = true;
        x = 0;
      } else {
        slowdown = false;
      }

      // Body keypoints
      let [
        leftEye,
        rightEye,
        nose,
        leftEar,
        rightEar,
        leftShoulder,
        rightShoulder,
        leftElbow,
        rightElbow,
        leftWrist,
        rightWrist,
        leftHip,
        rightHip,
        leftKnee,
        rightKnee,
        leftAnkle,
        rightAnkle
      ] = keypoints.map(kp => kp.position);

      // Average point between the ears
      let headX = (leftEar.x + rightEar.x) / 2;
      let headY = (leftEar.y + rightEar.y) / 2;
      let headRadius = rightEar.x - leftEar.x;

      // Average point between the hips
      let hipAvg = {
        x: (leftHip.x + rightHip.x) / 2,
        Y: (leftHip.y + rightHip.y) / 2
      };

      // head
      sloppycircle(headX, headY, headRadius);

      // shoulders
      sloppyline(leftShoulder, rightShoulder);

      // upper arms
      sloppyline(leftElbow, leftShoulder);
      sloppyline(rightElbow, rightShoulder);

      // forearms
      sloppyline(leftWrist, leftElbow);
      sloppyline(rightWrist, rightElbow);

      // body
      sloppyline(hipAvg, leftShoulder);
      sloppyline(hipAvg, rightShoulder);

      // thighs
      sloppyline(hipAvg, leftKnee);
      sloppyline(hipAvg, rightKnee);

      // shins
      sloppyline(leftAnkle, leftKnee);
      sloppyline(rightAnkle, rightKnee);

      // change stroke based on user's wrist position
      strokehue = map(rightWrist.y, 0, height, 300, 340);
      strokesaturation = map(leftWrist.y, 0, height, 70, 100);
    }
  }
};

// Slow down the music if no one is in the frame
slowDown = () => {
  song.rate(1 - x);
  if (slowdown && x < 1) {
    x += 0.01;
  } else if (slowdown && x >= 1) {
    x = 1;
  } else {
    x = 0;
  }
};

// Toggle video on and off using button
toggleVideo = () => {
  videoShowing = !videoShowing;
  if (videoShowing) {
    this.innerHTML = "Hide Video";
  } else {
    this.innerHTML = "Show Video";
  }
};
