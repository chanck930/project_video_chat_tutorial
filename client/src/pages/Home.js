import React, { useEffect, useRef, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Peer from "simple-peer";
import io from "socket.io-client";
import styled from 'styled-components';
import { Grid, Typography, Paper, } from '@material-ui/core';
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

    canvas: {
      width: '640px',
      height: '480px',
      textAlign: "center",
      position: 'relative',
      top:'-700px',
      left:'95px',
      zindex: 11,
      },

    write:{
      position: 'relative',
      top: '-54px',
      left: '320px',
    },
  }));

const Container = styled.div`
    padding: 20px;
    display: flex;
    height: 100vh;
    width: 90%;
    margin: auto;
    flex-wrap: wrap;
`;

const StyledVideo = styled.video`
    height: 100%;
    width: 100%;
`;

const videoConstraints = {  // trying to follow broadcasting video size
    height: 480,
    width: 640
};

function createEmptyVideoTrack({ width, height }) {
    const canvas = Object.assign(document.createElement('canvas'), { width, height });
    canvas.getContext('2d').fillRect(0, 0, width, height);

    const stream = canvas.captureStream();
    const track = stream.getVideoTracks()[0];

    return Object.assign(track, { enabled: false });
};

const Home = () => {

    const [peers, setPeers] = useState([]);
    const [serverStatus, setServerStatus] = useState(false);
    const socketRef = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);
    const classes = useStyles();
    const ref = useRef();
    // const roomID = props.match.params.roomID;
    const roomID = '1234';

    const videoTrack = createEmptyVideoTrack(videoConstraints)
    const dummyStream = new MediaStream([videoTrack]);

  const Video = (props) => {

    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
            console.log("stream active: " + stream.active);
        })
    }, []);

    return (
        <video playsInline autoPlay ref={ref} height={videoConstraints.height} width={videoConstraints.width} />
    );
  }

  useEffect(() => {
    // socketRef.current = io.connect("/");
    // socketRef.current = io('http://localhost:5000');
    socketRef.current = io('https://eie4428-webcam-app.herokuapp.com/');
    // socketRef.current = io('https://eie4428-mini-project.herokuapp.com/ ');
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((stream) => {
        
        userVideo.current.srcObject = stream;
        socketRef.current.emit("client join room", roomID);
        socketRef.current.on("server users", user => {
            console.log("on server users");
            console.log("server user: " + user);
            if (user != null) {
                const peers = [];
                const peer = createPeer(user, socketRef.current.id);
                peersRef.current.push({
                    peerID: user,
                    peer,
                })
                peers.push(peer);
                setPeers(peers);

                setServerStatus(true);
            }
        })

        socketRef.current.on("user joined", payload => {
            console.log("on user joined");
            const peer = addPeer(payload.signal, payload.callerID);

            setPeers([peer]);
            setServerStatus(true);
        });

        socketRef.current.on("receiving returned signal", payload => {
          console.log("on receiving returned signal " + payload.id);
          const item = peersRef.current.find(p => p.peerID === payload.id);
          item.peer.signal(payload.signal);
      });

        socketRef.current.on("server disconnect", payload => {
          console.log("server disconnected");
          setServerStatus(false);
          const tempPeer = peersRef.current.find(p => p.peerID === payload.id);
          if (tempPeer) {
              tempPeer.peer.destory();
          }
          setPeers([]);
        });

    }, (error) => console.error(error))
}, []);

  function createPeer(userToSignal, callerID) {
      const peer = new Peer({
          initiator: true,
          trickle: false,
          stream: dummyStream,
      });

      peer.on("signal", signal => {
          socketRef.current.emit("sending signal", { userToSignal, callerID, signal })
      })

      return peer;
  }

  function addPeer(incomingSignal, callerID) {
      const peer = new Peer({
          initiator: false,
          trickle: false,
          stream: dummyStream,
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
            <Typography variant="h5" gutterBottom>Your WebCam</Typography>
            <Webcam muted ref={userVideo} autoPlay playsInline className={classes.video}/>
            <Typography variant="h5" gutterBottom>WebCam Server</Typography>
            {console.log('server '+ serverStatus)}
            {console.log("length: " + peers.length)}
            {serverStatus ? 
                <Video peer={peers.at(-1)} className={classes.video}/>
                 :
                <Paper className={classes.paper}>
                    <Typography variant="h5" gutterBottom>Server Offline</Typography>
                </Paper>
            }
        </Grid>
    </Paper>
    </div>
    </Grid>
  );
};

export default Home;