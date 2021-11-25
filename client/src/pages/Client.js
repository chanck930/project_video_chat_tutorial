import React, { useRef, useEffect, useState, useContext } from 'react';
import { v1 as uuid } from "uuid";
import styled from "styled-components";
import Peer from "simple-peer";
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';
import Webcam from "react-webcam";
import io from "socket.io-client";
import { drawMesh } from '../components/utilities';
import { Grid, Typography, Paper, Button, makeStyles } from '@material-ui/core';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import FlipIcon from '@mui/icons-material/Flip';
import FaceRetouchingNaturalIcon from '@mui/icons-material/FaceRetouchingNatural';


// import BroadcastBar from '../components/BroadcastBar';
// import Notifications from '../components/Notifications';
// import VideoPlayer from '../components/VideoPlayer';
// import selfCamVideoPlayer from '../components/selfCamVideoPlayer';

const useStyles = makeStyles((theme) => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  video: {
    width: '640px',
    height: '480px',
  },
  gridContainer: {
    justifyContent: 'center',
  },
  paper: {
    padding: '10px',
    border: '2px solid black',
    margin: '30px',
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
  container: {
    width: '600px',
    margin: '35px 0',
    padding: 0,
  },
  margin: {
    marginTop: 20,
  },
  padding: {
    padding: 10,
  },
  button: {
    width: '300px'
  },
  switch: {
    size: '300px'
  },
  canvas: {
    width: '640px',
    height: '480px',
    textAlign: "center",
    position: 'relative',
    top:'-745px',
    left:'40px',
    zindex: 11,
  },

  write:{
    position: 'relative',
    top: '-54px',
    left: '320px',
  }
}));

const Video = (props) => {
    const classes = useStyles();
    const ref = useRef();

    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
        })
    }, []);

    return (
        <video playsInline autoPlay ref={ref} className={classes.video}/>
    );
}


/* const videoConstraints = {
    height: window.innerHeight / 2,
    width: window.innerWidth / 2
};*/

const CreateRoom = () => {
  function create() {
      const id = uuid();
      // props.history.push(`/room/${id}`);
      return id;
  }

  return create();
};

const Client = () => {
  const classes = useStyles();
  const canvasRef = useRef();
  const [peers, setPeers] = useState([]);
  const socketRef = useRef();
  const userVideo = useRef();
  const peersRef = useRef([]);
  // const roomID = props.match.params.roomID;
  const roomID = '1234';
  const [isFace, isFaceThere] = useState([]);

  const [mirror, setMirror] = React.useState(false);

  const mirrorChangeT = event => {
    setMirror(true);
  };

  const mirrorChangeF = event => {
    setMirror(false);
  };

  const capture = React.useCallback(
    () => {
      if (typeof userVideo.current !== 'undefined'
        && userVideo.current !== null
        && userVideo.current.video.readyState === 4
        ){
      const imageSrc = userVideo.current.getScreenshot();
      setImage(imageSrc)}
      else{
        alert('error');
      }
      });

  const [image,setImage]=useState('');

  // Load facemesh
  const runFacemesh = async () => {
    const net = await facemesh.load({
      inputResolution: { width: '640px', height: '480px' }, scale: 0.8,
    });
    setInterval(() => {
      detect(net)
    }, 1000)
  };
    // Detect
  const detect = async (net) => {
    if (typeof userVideo.current !== 'undefined'
    && userVideo.current !== null
    && userVideo.current.video.readyState === 4
    ) {
     // Get Video Properties
     const video1 = userVideo.current.video;
     const videoWidth = userVideo.current.video.videoWidth;
     const videoHeight = userVideo.current.video.videoHeight;

     // Set video width
     userVideo.current.video.width = videoWidth;
     userVideo.current.video.height = videoHeight;

     // Set canvas width
     canvasRef.current.width = videoWidth;
     canvasRef.current.height = videoHeight;

      // make detections
      const face = await net.estimateFaces(video1);
      if(face.length == 0)
        {
          isFaceThere(false);
        }
      else{
        isFaceThere(true)
      }

      // get canvas context for drawing
      const ctx = canvasRef.current.getContext('2d');
      drawMesh(face, ctx);
    }
  };


  useEffect(() => {
      // socketRef.current = io.connect("/");
      socketRef.current = io('http://localhost:5000');
      // socketRef.current = io('https://eie4428-webcam-app.herokuapp.com/');
      // socketRef.current = io('https://eie4428-mini-project.herokuapp.com/ ');
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
          userVideo.current.srcObject = stream;
          socketRef.current.emit("server join room", roomID);
          socketRef.current.on("all client users", users => {
              console.log("on all client users");
              const peers = [];
              users.forEach(userID => {
                  const peer = createPeer(userID, socketRef.current.id, stream);
                  peersRef.current.push({
                      peerID: userID,
                      peer,
                  })
                  peers.push(peer);
              })
              setPeers(peers);
          })

          socketRef.current.on("user joined", payload => {
              console.log("on user joined");
              const peer = addPeer(payload.signal, payload.callerID, stream);
              peersRef.current.push({
                  peerID: payload.callerID,
                  peer,
              })

              setPeers(users => [...users, peer]);
          });

          socketRef.current.on("receiving returned signal", payload => {
              console.log("on receiving returned signal");
              const item = peersRef.current.find(p => p.peerID === payload.id);
              item.peer.signal(payload.signal);
          });

          socketRef.current.on("user disconnect", payload => {
            console.log("user disconnected");
            const tempPeer = peersRef.current.find(p => p.peerID === payload.id);
            if (tempPeer) {
                tempPeer.peer.destory();
            }
            const peers = peersRef.current.filter(p => p.peerID !== payload.id);
            peersRef.current = peers;
          });
      })
  }, []);

  function createPeer(userToSignal, callerID, stream) {
      const peer = new Peer({
          initiator: true,
          trickle: false,
          stream,
      });

      peer.on("signal", signal => {
          socketRef.current.emit("sending signal", { userToSignal, callerID, signal })
      })

      return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
      const peer = new Peer({
          initiator: false,
          trickle: false,
          stream,
      })

      peer.on("signal", signal => {
          socketRef.current.emit("returning signal", { signal, callerID })
      })

      peer.signal(incomingSignal);

      return peer;
  }

  return (
    <Grid container className={classes.gridContainer}>
    <div className={classes.Container}>
      <Paper className={classes.paper}>
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom>Your Camera</Typography>
          {image == '' ?  <Webcam muted ref={userVideo} autoPlay playsInline className={classes.video} mirrored={mirror}/> : <img src={image} />}
        </Grid>
      </Paper>
      <Paper elevation={10} className={classes.paper}>
          <Grid container>
            <Grid item xs={12} md={6} className={classes.padding}>
              {mirror != true ?
                    <Button variant="contained" color="primary" className={classes.button} fullWidth startIcon={<FlipIcon fontSize="large" />} onClick={(e) => {
                        e.preventDefault();
                        mirrorChangeT();
                    }}
                        >
                        Mirror Video</Button> :
                    <Button variant="contained" color="primary" className={classes.button} fullWidth startIcon={<FlipIcon fontSize="large" /> }onClick={(e) => {
                        e.preventDefault();
                        mirrorChangeF();
                    }}
                        >Mirror Video</Button>
                }
              </Grid>
              <div>
              <Grid item xs={12} md={6} className={classes.padding}>
                {image != '' ?
                    <Button variant="contained" color="secondary" className={classes.button} fullWidth startIcon={<CameraAltIcon fontSize="large" />} onClick={(e) => {
                        e.preventDefault();
                        setImage('')
                    }}
                        >
                        Retake Image</Button> :
                    <Button variant="contained" color="primary" className={classes.button} fullWidth startIcon={<CameraAltIcon fontSize="large" /> }onClick={(e) => {
                        e.preventDefault();
                        capture();
                    }}
                        >Capture</Button>
                }
                </Grid>
            </div>
            </Grid>
            <Grid item xs={12} md={6} className={classes.padding}>
            <Button variant="contained" color="primary" className={classes.button} fullWidth startIcon={<FaceRetouchingNaturalIcon fontSize="large" /> }onClick={(e) => {
                        e.preventDefault();
                        runFacemesh();
                    }}
                        >Run Face Mesh</Button>
            </Grid>
            <Grid item xs={12} md={6} className={classes.padding}>
            <Typography variant="h6" className={classes.write} > Face detected: {isFace.toString()}</Typography>
          </Grid>
     </Paper>
      <canvas ref={canvasRef} className={classes.canvas} />
    </div>
    </Grid>
     
  );
};

export default Client;