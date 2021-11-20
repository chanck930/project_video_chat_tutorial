import React, { useContext } from 'react';
import { Typography, Paper, makeStyles } from '@material-ui/core';

import { SocketContext } from '../Context';

const useStyles = makeStyles((theme) => ({
  video: {
    width: '550px',
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

const selfCamVideoPlayer = () => {
  const { name, myVideo, stream } = useContext(SocketContext);
  const classes = useStyles();

  return (
    <>
      {stream && (
        <Paper className={classes.paper}>
          <Typography variant="h5" gutterBottom>{name || 'Video'}</Typography>
          <video playsInline muted ref={myVideo} autoPlay className={classes.video} />
        </Paper>
      )}
    </>
  );
};

export default selfCamVideoPlayer;
