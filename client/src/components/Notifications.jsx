import React, { useContext } from 'react';
// import { Button } from '@material-ui/core';

import { SocketContext } from '../Context';
// import { KeyboardReturnOutlined } from '@material-ui/icons';

const Notifications = () => {
  const { answerCall, call, callAccepted } = useContext(SocketContext);

  if (call.isReceivingCall && !callAccepted) {
    answerCall();
  }

  return (
    <>
      {/* {call.isReceivingCall && !callAccepted && (
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <h1>{call.name} is calling:</h1>
          <Button variant="contained" color="primary" onClick={answerCall} onLoad={answerCall}>
            Answer
          </Button>
        </div>
      )} */}
    </>
  );
};

export default Notifications;
