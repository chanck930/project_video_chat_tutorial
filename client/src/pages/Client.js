import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Sidebar from '../components/Sidebar';
import Notifications from '../components/Notifications';

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
      <Sidebar>
        <Notifications />
      </Sidebar>
    </div>
  );
};

export default Client;
