import React, { useEffect, useRef, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Peer from "simple-peer";
import io from "socket.io-client";
import styled from 'styled-components';
import { Grid, Typography, Paper, Button, Switch, FormControlLabel } from '@material-ui/core';
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
      [theme.breakpoints.down('xs')]: {
        width: '480px',
      },
      transform: 'scaleX(1)',
    },
    videoM: {
      width: '640px',
      [theme.breakpoints.down('xs')]: {
        width: '480px',
      },
      transform: 'scaleX(-1)',
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
    root: {
      display: 'flex',
      flexDirection: 'column',
    },
    container: {
      width: '600px',
      margin: '35px 0',
      padding: 0,
      [theme.breakpoints.down('xs')]: {
        width: '80%',
      },
    },
    margin: {
      marginTop: 20,
    },
    padding: {
      padding: 10,
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

// function createEmptyVideoTrack({ width, height }) {
//     const canvas = Object.assign(document.createElement('canvas'), { width, height });
//     canvas.getContext('2d').fillRect(0, 0, width, height);

//     const stream = canvas.captureStream();
//     const track = stream.getVideoTracks()[0];

//     return Object.assign(track, { enabled: false });
// };

const Home = () => {

    const [peers, setPeers] = useState([]);
    const [serverStatus, setServerStatus] = useState(false);
    const socketRef = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);
    const classes = useStyles();
    // const roomID = props.match.params.roomID;
    const roomID = '1234';

    // const videoTrack = createEmptyVideoTrack(videoConstraints)
    // const dummyStream = new MediaStream([videoTrack]);
    
  const [mirror, setMirror] = React.useState(false);

  const mirrorChange = event => {
    setMirror(event.target.checked);
  };

  const [image,setImage]=useState('');

  const capture = React.useCallback(
    () => {
      const imageSrc = userVideo.current.getScreenshot();
      setImage(imageSrc)
      });
  

  const Video = (props) => {
    const ref = useRef();

    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
            console.log("stream active: " + stream.active);
        })
    }, []);

    return (
        <Webcam playsInline autoPlay ref={ref} height={videoConstraints.height} width={videoConstraints.width} mirrored={mirror} />
        // <Webcam ref={ref} autoPlay playsInline videoConstraints={videoConstraints}/> 
    );
}

  useEffect(() => {
    // socketRef.current = io.connect("/");
    socketRef.current = io('http://localhost:5000');
    // socketRef.current = io('https://eie4428-webcam-app.herokuapp.com/');
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
            {image == '' ?  <Webcam muted ref={userVideo} autoPlay playsInline className={classes.video} mirrored={mirror}/> : <img src={image} />}
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
    <Paper elevation={10} className={classes.paper}>
        <form className={classes.root} noValidate autoComplete="off">
          <Grid container>
            <Grid item xs={12} md={6} className={classes.padding}>
                    <FormControlLabel control={
                  <Switch
                    checked={mirror}
                    onChange={mirrorChange}
                    value={mirror}
                  />
                }
                label={"Mirror"}
                labelPlacement="start"
              />
              <div>
                {image != '' ?
                    <Button onClick={(e) => {
                        e.preventDefault();
                        setImage('')
                    }}
                        >
                        Retake Image</Button> :
                    <Button onClick={(e) => {
                        e.preventDefault();
                        capture();
                    }}
                        >Capture</Button>
                }
            </div>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </div>
    </Grid>
  );
};

export default Home;