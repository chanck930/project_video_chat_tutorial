import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import BroadcastBar from '../components/BroadcastBar';
import Notifications from '../components/Notifications';
import VideoPlayer from '../components/VideoPlayer';
// import selfCamVideoPlayer from '../components/selfCamVideoPlayer';

const useStyles = makeStyles({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
});

const Client = () => {
  const classes = useStyles();

  return (
    <div className={classes.wrapper}>
      <VideoPlayer />
      <BroadcastBar>
        <Notifications />
      </BroadcastBar>
    </div>
  );
};

export default Client;
