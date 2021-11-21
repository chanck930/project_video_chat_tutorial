import React, { useRef, useContext } from 'react';
//  import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';
import { Grid, Typography, Paper, makeStyles } from '@material-ui/core';
import { drawMesh } from './utilities';
import { SocketContext } from '../Context';

const useStyles = makeStyles((theme) => ({
  video: {
    width: '640px',
    height: '480px',
    [theme.breakpoints.down('xs')]: {
      width: '300px',
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

const VideoPlayerTrial = (props) => {
  const ref = useRef();
  useEffect(() => {
      props.peer.on("stream", stream => {
        ref.current.srcObject = stream;
    })
  }, []);
}
  const canvasRef = useRef(null);
  const { name, callAccepted, myVideo, userVideo, callEnded, stream, call } = useContext(SocketContext);
  const classes = useStyles();
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
    if (typeof myVideo.current !== 'undefined'
    && myVideo.current !== null
    && myVideo.current.video.readyState === 4
    ) {
      // Get Video properties
      const video1 = myVideo.current.video;
      myVideo.current.width = '640px';
      myVideo.current.height = '480px';

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

  runFacemesh();

  return (
    <Grid container className={classes.gridContainer}>
        <Paper className={classes.paper}>
          <Grid item xs={12} md={6}>
            <StyledVideo playsInline autoPlay ref={ref} className={classes.video} />
            <canvas ref={canvasRef} className={classes.video} />
          </Grid>
        </Paper>
    </Grid>

};

export default VideoPlayerTrial;
