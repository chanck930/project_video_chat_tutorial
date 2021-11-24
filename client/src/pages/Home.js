import React, { useEffect, useRef, useState } from 'react';
import * as facemesh from "@tensorflow-models/face-landmarks-detection"
import { drawMesh } from '../components/utilities';
import { makeStyles } from '@material-ui/core/styles';
import Peer from "simple-peer";
import io from "socket.io-client";
import styled from 'styled-components';
import { Grid, Typography, Paper } from '@material-ui/core';
import Webcam from "react-webcam";

// import VideoPlayer from '../components/VideoPlayer';
// import Sidebar1 from '../components/Sidebar1';
// import Notifications from '../components/Notifications';

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
        textAlign: "center",
        zindex: 9,
        [theme.breakpoints.down('xs')]: {
          width: '480px',
        },
      },
        canvas: {
          width: '640px',
          height: '480px',
          textAlign: "center",
          position: 'relative',
          top:'-460px',
          left:'40px',
          zindex: 11,
          [theme.breakpoints.down('xs')]: {
            width: '550px',
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
      container: {
        display: 'inline-block',
        position: 'relative',
      },
  }));

// function createEmptyVideoTrack({ width, height }) {
//     const canvas = Object.assign(document.createElement('canvas'), { width, height });
//     canvas.getContext('2d').fillRect(0, 0, width, height);

//     const stream = canvas.captureStream();
//     const track = stream.getVideoTracks()[0];

//     return Object.assign(track, { enabled: false });
// };

const Home = () => {
    const classes = useStyles();

    const [peers, setPeers] = useState([]);
    const [serverStatus, setServerStatus] = useState(false);
    const socketRef = useRef();
    const userVideo = useRef(null);
    const peersRef = useRef([]);
    const ref = useRef(null);
    const canvasRef = useRef();
    // const roomID = props.match.params.roomID;
    const roomID = '1234';

    // const videoTrack = createEmptyVideoTrack(videoConstraints)
    // const dummyStream = new MediaStream([videoTrack]);
    const Video = (props) => {

        useEffect(() => {
            props.peer.on("stream", stream => {
                ref.current.srcObject = stream;
                console.log("stream active: " + stream.active);
            })
        }, []);
    
        return (
            <Webcam playsInline autoPlay ref={ref} width = '640px' height = '480px' className={classes.video}/>
           // <Webcam playsInline autoPlay ref={ref} className={classes.video}/>
        );
    }

     // Load facemesh
  const runFacemesh = async () => {
    const net = await facemesh.load(facemesh.SupportedPackages.mediapipeFacemesh);
    setInterval(() => {
      detect(net);
    }, 10);
  };
    // Detect
  const detect = async (net) => {
    if (
      typeof userVideo.current !== "undefined" &&
      userVideo.current !== null &&
      userVideo.current.video.readyState === 4
    ) {
      // Get Video Properties
      const video = userVideo.current.video;
      const videoWidth = userVideo.current.video.videoWidth;
      const videoHeight = userVideo.current.video.videoHeight;

      // Set video width
      userVideo.current.video.width = videoWidth;
      userVideo.current.video.height = videoHeight;

      // Set canvas width
      userVideo.current.width = videoWidth;
      userVideo.current.height = videoHeight;

      // Make Detections
      // OLD MODEL
      //       const face = await net.estimateFaces(video);
      // NEW MODEL
      const face = await net.estimateFaces({input:video});
      console.log(face);

      // get canvas context for drawing
      const ctx = canvasRef.current.getContext('2d');
      requestAnimationFrame(()=>{drawMesh(face, ctx)});
    }
  };

  useEffect(() => {
    //runFacemesh()
    // socketRef.current = io.connect("/");
    socketRef.current = io('http://localhost:5000');
    //socketRef.current = io('https://eie4428-webcam-app.herokuapp.com/');
    socketRef.current = io('http://localhost:5000');
    navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((stream) => {
        // stream = dummyStream;
        // console.log(stream);
        // console.log(dummyStream);
        
        userVideo.current.srcObject = stream;
        socketRef.current.emit("client join room", roomID);
        socketRef.current.on("server users", user => {
            console.log("on server users");
            console.log("server user: " + user);
            if (user != null) {
                setServerStatus(true);
                
                const peers = [];
                const peer = createPeer(user, socketRef.current.id, stream);
                peersRef.current.push({
                    peerID: user,
                    peer,
                })
                peers.push(peer);
                setPeers(peers);
            }
        })

        socketRef.current.on("user joined", payload => {
            console.log("on user joined");
            const peer = addPeer(payload.signal, payload.callerID, stream);
            peersRef.current.push({
                peerID: payload.callerID,
                peer,
            })

            setPeers(users => [...users, peer]);
            setServerStatus(true);
        });

        socketRef.current.on("receiving returned signal", payload => {
            console.log("on receiving returned signal " + payload.id);
            const item = peersRef.current.find(p => p.peerID === payload.id);
            item.peer.signal(payload.signal);
        });

        // socketRef.current.on("server disconnect", () => {
        //     console.log("server disconnected");
        //     setServerStatus(false);
        // });

    }, (error) => console.error(error))
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
    //   <Paper className={classes.paper}>
    //     <Grid item xs={12} md={6}>
    //   <div className={classes.Container}>
    //         <Typography variant="h5" gutterBottom>Your WebCam</Typography>
    //         <Webcam muted ref={userVideo} autoPlay playsInline className={classes.video}/> 
    //         <Typography variant="h5" gutterBottom>WebCam Server</Typography>
    //             {/* {peers.map((peer, index) => {
    //                 if (index === 0) {
    //                     return (
    //                         <Video key={index} peer={peer} className={classes.video}/>
    //                     )
    //                 }
    //             })} */}
    // </div>
    //     </Grid>
    // </Paper>

    <Grid container className={classes.gridContainer}>
    <div className={classes.Container}>
    <Paper className={classes.paper}>
        <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>Your WebCam</Typography>
            <Webcam muted ref={userVideo} autoPlay playsInline className={classes.video}/> 
            <Typography variant="h5" gutterBottom>WebCam Server</Typography>
            {console.log('server '+ serverStatus)}
            {/* {console.log("length: " + peers.length)} */}
            {serverStatus ? 
                (peers.map((peer, index) => {
                    if (index === peers.length - 1) {
                        return (
                            <Video key={index} peer={peer} className={classes.video}/>
                        )
                    }
                })) :
                    <Paper className={classes.paper}>
                        <Typography variant="h5" gutterBottom>Server Offline</Typography>
                    </Paper>
            }
        </Grid>
    </Paper>
    <canvas ref={canvasRef} className={classes.canvas} />
    </div>
    </Grid>
  );
};

export default Home;
