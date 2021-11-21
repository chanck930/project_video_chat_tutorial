import React, { useRef, useEffect, useState, useContext } from 'react';
import { v1 as uuid } from "uuid";
import styled from "styled-components";
import Peer from "simple-peer";
//  import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';
import { Grid, Typography, Paper, makeStyles } from '@material-ui/core';
import io from "socket.io-client";
import { drawMesh } from '../components/utilities';


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
    [theme.breakpoints.down('xs')]: {
      width: '480px',
    },
  },
  gridContainer: {
    justifyContent: 'center',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  paper: {
    padding: '10px',
    border: '2px solid black',
    margin: '30px',
  },
}));

/* const Container = styled.div`
    padding: 20px;
    display: flex;
    height: 100vh;
    width: 90%;
    margin: auto;
    flex-wrap: wrap;
`;*/

const StyledVideo = styled.video`
    height: 480px;
    width: 640px;
`;

const Video = (props) => {
    const classes = useStyles();
    const ref = useRef();

    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
        })
    }, []);

    return (
        <StyledVideo playsInline autoPlay ref={ref} className={classes.video}/>
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
  const canvasRef = useRef(null);
  const [peers, setPeers] = useState([]);
  const socketRef = useRef();
  const userVideo = useRef();
  const peersRef = useRef([]);
  // const roomID = props.match.params.roomID;
  const roomID = '1234';

  // Load facemesh
  const runFacemesh = async () => {
    const net = await facemesh.load({
      inputResolution: { width: '640px', height: '480px' }, scale: 0.8,
    });
    setInterval(() => {
      detect(net)
    }, 100);
  };
    // Detect
  const detect = async (net) => {
    if (typeof userVideo.current !== 'undefined'
    && userVideo.current !== null
    && userVideo.current.video.readyState === 4
    ) {
      // Get Video properties
      const video1 = userVideo.current.video;
      userVideo.current.width = '640px';
      userVideo.current.height = '480px';

      // Set canvas width
      canvasRef.current.width = '640px';
      canvasRef.current.height = '480px';

      // make detections
      const face = await net.estimate(video1);
      console.log(face);

      // get canvas context for drawing
      const ctx = canvasRef.current.getContext('2d');
      drawMesh(face, ctx);
    }
  };

  // runFacemesh();

  useEffect(() => {
      // socketRef.current = io.connect("/");
      socketRef.current = io('http://localhost:5000');
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
          userVideo.current.srcObject = stream;
          socketRef.current.emit("join room", roomID);
          socketRef.current.on("all users", users => {
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
              const peer = addPeer(payload.signal, payload.callerID, stream);
              peersRef.current.push({
                  peerID: payload.callerID,
                  peer,
              })

              setPeers(users => [...users, peer]);
          });

          socketRef.current.on("receiving returned signal", payload => {
              const item = peersRef.current.find(p => p.peerID === payload.id);
              item.peer.signal(payload.signal);
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
    <div className={classes.wrapper}>
    <Grid container className={classes.gridContainer}>
    <Paper className={classes.paper}>
            <Typography variant="h5" gutterBottom>Your WebCam</Typography>
            <Grid item xs={12} md={6}>
            <StyledVideo muted ref={userVideo} autoPlay playsInline className={classes.video}/>
            {/* {peers.map((peer, index) => {
                return (
                    <Video key={index} peer={peer} />
                );
            })} */}
          </Grid>
        </Paper>
    </Grid>
    </div>
  );
};

export default Client;
